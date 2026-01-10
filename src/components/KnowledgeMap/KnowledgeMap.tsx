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
  onNodeClick?: (nodeName: string) => void;
  activeNodeId?: string;
  data?: KnowledgeMapData | null;
}

const nodeTypes: NodeTypes = {
  concept: ConceptNodeComponent as any,
};

// Convert ConceptNodes to React Flow nodes with layout
const createFlowNodes = (
  conceptNodes: ConceptNode[],
  activeNodeId?: string,
  onNodeClick?: (label: string) => void
): Node[] => {
  const centerX = 400;
  const centerY = 300;
  const radius = 200;
  
  return conceptNodes.map((node, index) => {
    // Arrange nodes in a circular pattern
    const angle = (index / conceptNodes.length) * 2 * Math.PI - Math.PI / 2;
    const isCenter = index === 0;
    
    return {
      id: node.id,
      type: 'concept',
      position: isCenter 
        ? { x: centerX, y: centerY }
        : { 
            x: centerX + Math.cos(angle) * radius * (1 + (index % 2) * 0.3),
            y: centerY + Math.sin(angle) * radius * (1 + (index % 2) * 0.3),
          },
      data: {
        label: node.label,
        category: node.category,
        isActive: node.id === activeNodeId || node.isActive,
        onClick: onNodeClick,
      },
    };
  });
};

// Convert ConceptEdges to React Flow edges - handle new structure with label and strength
const createFlowEdges = (conceptEdges: ConceptEdge[]): Edge[] => {
  return conceptEdges.map((edge) => {
    const strength = edge.strength ? (typeof edge.strength === 'string' ? parseInt(edge.strength) : edge.strength) : 5;
    const opacity = 0.4 + (strength / 10) * 0.4; // Opacity based on strength (0.4 to 0.8)
    const strokeWidth = 1 + (strength / 10) * 2; // Stroke width based on strength (1 to 3)
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      label: edge.label || '',
      labelStyle: {
        fill: 'hsl(215, 25%, 75%)',
        fontWeight: 500,
        fontSize: 11,
      },
      style: {
        stroke: 'hsl(215, 25%, 45%)',
        strokeWidth,
        opacity,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(215, 25%, 45%)',
        width: 15,
        height: 15,
      },
    };
  });
};

export const KnowledgeMap = ({ onNodeClick, activeNodeId, data }: KnowledgeMapProps) => {
  const { toast } = useToast();
  const flowRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Use provided data or fallback to mock data - handle new structure with description
  const conceptNodes: ConceptNode[] = useMemo(() => {
    if (data?.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
      return data.nodes.map(node => {
        // Map new category strings to NodeCategory type
        let category: NodeCategory = 'general';
        const catStr = String(node.category || 'general').toLowerCase();
        if (['core concept', 'supporting detail', 'historical context', 'mathematical formula', 'related entity'].includes(catStr)) {
          // Map new categories to existing ones or use general
          if (catStr.includes('historical')) category = 'history';
          else if (catStr.includes('mathematical') || catStr.includes('formula')) category = 'math';
          else category = 'general';
        } else if (['science', 'history', 'math', 'language', 'technology', 'philosophy', 'art', 'general'].includes(catStr)) {
          category = catStr as NodeCategory;
        }
        
        return {
          id: node.id || String(Math.random()),
          label: node.label || '',
          category,
          isActive: node.isActive || false,
          connectedTo: [] // Not used in new structure, but keep for compatibility
        };
      });
    }
    // Return initialNodes if no data provided
    return initialNodes;
  }, [data]);
  
  const conceptEdges: ConceptEdge[] = useMemo(() => {
    if (data?.edges && Array.isArray(data.edges) && data.edges.length > 0) {
      return data.edges.map((edge, index) => ({
        id: edge.id || `${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        strength: edge.strength
      }));
    }
    // Return initial edges if we're using initial nodes
    return initialEdges.filter(edge => 
      conceptNodes.some(n => n.id === edge.source) && 
      conceptNodes.some(n => n.id === edge.target)
    );
  }, [data, conceptNodes]);
  
  const flowNodes = useMemo(
    () => createFlowNodes(conceptNodes, activeNodeId, onNodeClick),
    [conceptNodes, activeNodeId, onNodeClick]
  );
  
  const flowEdges = useMemo(
    () => createFlowEdges(conceptEdges),
    [conceptEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Clear state function to purge previous map data
  const clearState = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Update nodes and edges when data changes
  useEffect(() => {
    // Always update with current flowNodes and flowEdges
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleClearMap = useCallback(() => {
    clearState();
    toast({
      title: 'Map Cleared',
      description: 'The knowledge map has been reset.',
    });
  }, [clearState, toast]);

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
        title: 'Export Successful',
        description: 'Your knowledge map has been exported as an image.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export the map. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const getNodeColor = (node: Node): string => {
    const category = node.data?.category as NodeCategory | undefined;
    return category ? categoryColors[category]?.bg : 'hsl(215, 25%, 45%)';
  };

  return (
    <div
      className={`relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50'
          : 'h-full w-full min-h-[400px]'
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
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
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
                <span className="hidden sm:inline">Clear Map</span>
                <span className="sm:hidden">Clear</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
                className="bg-card/90 backdrop-blur-sm border-border hover:bg-primary/20 hover:text-primary hover:border-primary/50 shadow-md text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Save</span>
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
                <span className="text-xs sm:text-sm font-medium text-foreground">Knowledge Map</span>
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
