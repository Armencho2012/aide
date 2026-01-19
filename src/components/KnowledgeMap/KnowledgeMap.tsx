import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionLineType,
  MarkerType,
  Panel,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { Trash2, Download, Maximize2, Minimize2, Map, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ConceptNodeComponent from './ConceptNodeComponent';
import { initialNodes, initialEdges } from './mockData';
import { ConceptNode, ConceptEdge, KnowledgeMapData, categoryColors, NodeCategory } from './types';

interface KnowledgeMapProps {
  onNodeClick?: (nodeName: string, description?: string, category?: string) => void;
  activeNodeId?: string;
  data?: KnowledgeMapData | null;
  highlightedNodes?: Set<string>;
  language?: 'en' | 'ru' | 'hy' | 'ko';
}

const uiLabels = {
  en: {
    knowledgeMap: 'Knowledge Map',
    clearMap: 'Clear Map',
    clear: 'Clear',
    export: 'Export',
    save: 'Save',
    mapCleared: 'Map Cleared',
    mapClearedDesc: 'The knowledge map has been reset.',
    exportSuccess: 'Export Successful',
    exportSuccessDesc: 'Your knowledge map has been exported as an image.',
    exportFail: 'Export Failed',
    exportFailDesc: 'Could not export the map. Please try again.'
  },
  ru: {
    knowledgeMap: 'Карта Знаний',
    clearMap: 'Очистить карту',
    clear: 'Очистить',
    export: 'Экспорт',
    save: 'Сохранить',
    mapCleared: 'Карта очищена',
    mapClearedDesc: 'Карта знаний была сброшена.',
    exportSuccess: 'Экспорт выполнен успешно',
    exportSuccessDesc: 'Ваша карта знаний была экспортирована как изображение.',
    exportFail: 'Ошибка экспорта',
    exportFailDesc: 'Не удалось экспортировать карту. Попробуйте снова.'
  },
  hy: {
    knowledgeMap: 'Գdelays delays delays Քdelays delays',
    clearMap: 'Մdelays delays Delays',
    clear: 'Մdelays delays',
    export: 'Արdelays',
    save: 'Պdelays delays',
    mapCleared: 'Քdelays delays delays',
    mapClearedDesc: 'Գdelays delays քdelays delays delays է:',
    exportSuccess: 'Delays delays delays',
    exportSuccessDesc: ' Delays delays delays delays delays է delays delays:',
    exportFail: 'Delays delays delays',
    exportFailDesc: 'Չdelays delays delays: Delays delays delays delays:'
  },
  ko: {
    knowledgeMap: '지식 맵',
    clearMap: '맵 지우기',
    clear: '지우기',
    export: '내보내기',
    save: '저장',
    mapCleared: '맵이 지워졌습니다',
    mapClearedDesc: '지식 맵이 초기화되었습니다.',
    exportSuccess: '내보내기 성공',
    exportSuccessDesc: '지식 맵이 이미지로 내보내졌습니다.',
    exportFail: '내보내기 실패',
    exportFailDesc: '맵을 내보낼 수 없습니다. 다시 시도해 주세요.'
  }
};

const nodeTypes: NodeTypes = {
  conceptNode: ConceptNodeComponent,
};

const getNodeColor = (node: Node): string => {
  const category = node.data?.category as NodeCategory;
  const colors = categoryColors[category] || categoryColors.concept;
  return colors.bg;
};

const createFlowNodes = (
  conceptNodes: ConceptNode[],
  activeNodeId?: string,
  highlightedNodes?: Set<string>
): Node[] => {
  const baseRadius = 350;
  const nodeCount = conceptNodes.length;
  
  return conceptNodes.map((node, index) => {
    const ringIndex = Math.floor(index / 8);
    const positionInRing = index % 8;
    const nodesInRing = Math.min(8, nodeCount - ringIndex * 8);
    const radius = baseRadius + ringIndex * 200;
    const angle = (2 * Math.PI * positionInRing) / nodesInRing - Math.PI / 2;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const isActive = node.id === activeNodeId;
    const isHighlighted = highlightedNodes?.has(node.id);
    const baseSize = 120 + (node.label?.length || 0) * 2;
    const size = Math.min(Math.max(baseSize, 100), 200);

    return {
      id: node.id,
      type: 'conceptNode',
      position: { x, y },
      data: {
        label: node.label,
        category: node.category,
        description: '',
        isActive,
        isHighlighted,
        size,
      },
    };
  });
};

const createFlowEdges = (conceptEdges: ConceptEdge[]): Edge[] => {
  return conceptEdges.map((edge, index) => {
    const strength = typeof edge.strength === 'number' ? edge.strength : parseInt(String(edge.strength)) || 5;
    return {
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: strength > 7,
      style: {
        stroke: 'hsl(215, 30%, 45%)',
        strokeWidth: Math.max(1, strength / 3),
      },
      labelStyle: {
        fill: 'hsl(215, 20%, 70%)',
        fontSize: 10,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: 'hsl(215, 30%, 15%)',
        fillOpacity: 0.8,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(215, 30%, 45%)',
      },
    };
  });
};

export const KnowledgeMap = ({ onNodeClick, activeNodeId, data, highlightedNodes, language = 'en' }: KnowledgeMapProps) => {
  const { toast } = useToast();
  const flowRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const labels = uiLabels[language] || uiLabels.en;

  const initialFlowNodes = useMemo(() => {
    const sourceNodes = data?.nodes || initialNodes;
    return createFlowNodes(sourceNodes, activeNodeId, highlightedNodes);
  }, [data, activeNodeId, highlightedNodes]);

  const initialFlowEdges = useMemo(() => {
    const sourceEdges = data?.edges || initialEdges;
    return createFlowEdges(sourceEdges);
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  useEffect(() => {
    setNodes(initialFlowNodes);
    setEdges(initialFlowEdges);
  }, [initialFlowNodes, initialFlowEdges, setNodes, setEdges]);

  const clearState = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleClearMap = useCallback(() => {
    clearState();
    toast({
      title: labels.mapCleared,
      description: labels.mapClearedDesc,
    });
  }, [clearState, toast, labels]);

  const handleExportImage = useCallback(async () => {
    if (!flowRef.current) return;

    try {
      const dataUrl = await toPng(flowRef.current, {
        backgroundColor: 'hsl(215, 30%, 12%)',
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = 'knowledge-map.png';
      link.href = dataUrl;
      link.click();

      toast({
        title: labels.exportSuccess,
        description: labels.exportSuccessDesc,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: labels.exportFail,
        description: labels.exportFailDesc,
        variant: 'destructive',
      });
    }
  }, [toast, labels]);

  return (
    <div
      className={`relative transition-all duration-300 ${isFullscreen
        ? 'fixed inset-0 z-50'
        : 'h-full w-full'
        }`}
    >
      {/* Dark glassmorphism background */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(215 30% 12% / 0.95), hsl(215 28% 8% / 0.98))',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(215 20% 25% / 0.5)',
        }}
      >
        <div ref={flowRef} className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={3}
            proOptions={{ hideAttribution: true }}
            panOnDrag={true}
            zoomOnPinch={true}
            zoomOnScroll={true}
            preventScrolling={false}
          >
            <Background
              color="hsl(215, 20%, 30%)"
              gap={20}
              size={1}
            />
            <Controls
              className="!bg-card/80 !backdrop-blur-sm !border-border !rounded-lg !shadow-lg"
              showInteractive={false}
            />
            <MiniMap
              nodeColor={getNodeColor}
              maskColor="hsl(215, 30%, 12% / 0.8)"
              className="!bg-card/60 !backdrop-blur-sm !border-border !rounded-lg"
            />

            {/* Control Panel */}
            <Panel position="top-right" className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearMap}
                className="bg-card/90 backdrop-blur-sm border-border hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 shadow-md text-xs sm:text-sm"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{labels.clearMap}</span>
                <span className="sm:hidden">{labels.clear}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
                className="bg-card/90 backdrop-blur-sm border-border hover:bg-primary/20 hover:text-primary hover:border-primary/50 shadow-md text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{labels.export}</span>
                <span className="sm:hidden">{labels.save}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-card/90 backdrop-blur-sm border-border hover:bg-secondary shadow-md"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </Panel>

            {/* Title */}
            <Panel position="top-left">
              <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md">
                <Map className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-foreground">{labels.knowledgeMap}</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Fullscreen close button */}
      {isFullscreen && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur-sm border-border"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default KnowledgeMap;
