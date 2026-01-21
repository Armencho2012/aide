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
  NodeChange,
  NodePositionChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Trash2, Download, Maximize2, Minimize2, Map as MapIcon, X, Info, Sparkles, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ConceptNodeComponent from './ConceptNodeComponent';
import { initialNodes, initialEdges, nodeDescriptions, edgeRelationships } from './mockData';
import { ConceptNode, ConceptEdge, KnowledgeMapData, categoryColors, NodeCategory } from './types';
import { ZenModeSidePanel } from './components/ZenModeSidePanel';
import { EditableNodeLabel } from './components/EditableNodeLabel';
import { FullscreenExitButton } from './components/FullscreenExitButton';

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
    reset: 'Reset',
    mapCleared: 'Map Cleared',
    mapClearedDesc: 'The knowledge map has been reset.',
    exportSuccess: 'Export Successful',
    exportSuccessDesc: 'Your knowledge map has been exported as an image.',
    exportFail: 'Export Failed',
    exportFailDesc: 'Could not export the map. Please try again.',
    zenMode: 'Zen Mode'
  },
  ru: {
    knowledgeMap: 'Карта Знаний',
    clearMap: 'Очистить карту',
    clear: 'Очистить',
    export: 'Экспорт',
    save: 'Сохранить',
    reset: 'Сброс',
    mapCleared: 'Карта очищена',
    mapClearedDesc: 'Карта знаний была сброшена.',
    exportSuccess: 'Экспорт выполнен успешно',
    exportSuccessDesc: 'Ваша карта знаний была экспортирована как изображение.',
    exportFail: 'Ошибка экспорта',
    exportFailDesc: 'Не удалось экспортировать карту. Попробуйте снова.',
    zenMode: 'Режим Дзен'
  },
  hy: {
    knowledgeMap: 'Գdelays delays delays Քdelays delays',
    clearMap: 'Մdelays delays Delays',
    clear: 'Մdelays delays',
    export: 'Արdelays',
    save: 'Պdelays delays',
    reset: 'Վերdelays',
    mapCleared: 'Քdelays delays delays',
    mapClearedDesc: 'Գdelays delays քdelays delays delays է:',
    exportSuccess: 'Delays delays delays',
    exportSuccessDesc: ' Delays delays delays delays delays է delays delays:',
    exportFail: 'Delays delays delays',
    exportFailDesc: 'Չdelays delays delays: Delays delays delays delays:',
    zenMode: 'Zen Mode'
  },
  ko: {
    knowledgeMap: '지식 맵',
    clearMap: '맵 지우기',
    clear: '지우기',
    export: '내보내기',
    save: '저장',
    reset: '초기화',
    mapCleared: '맵이 지워졌습니다',
    mapClearedDesc: '지식 맵이 초기화되었습니다.',
    exportSuccess: '내보내기 성공',
    exportSuccessDesc: '지식 맵이 이미지로 내보내졌습니다.',
    exportFail: '내보내기 실패',
    exportFailDesc: '맵을 내보낼 수 없습니다. 다시 시도해 주세요.',
    zenMode: '젠 모드'
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

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

const createTreeLayout = (
  conceptNodes: ConceptNode[],
  conceptEdges: ConceptEdge[],
  activeNodeId?: string,
  highlightedNodes?: Set<string>,
  isZenMode?: boolean
): LayoutResult => {
  if (conceptNodes.length === 0) return { nodes: [], edges: [] };

  // Scale factor for Zen Mode (25% larger text/padding handled in node component)
  const scaleFactor = isZenMode ? 1.25 : 1;

  // 1. Build Adjacency List from original edges
  const adjacency = new globalThis.Map<string, string[]>();
  conceptNodes.forEach(node => {
    adjacency.set(node.id, []);
  });

  conceptEdges.forEach(edge => {
    if (adjacency.has(edge.source)) adjacency.get(edge.source)?.push(edge.target);
    if (adjacency.has(edge.target)) adjacency.get(edge.target)?.push(edge.source);
  });

  // 2. Identify Root (main node or highest degree)
  let rootId = conceptNodes[0]?.id;
  const mainNode = conceptNodes.find(n => n.category === 'main');
  if (mainNode) {
    rootId = mainNode.id;
  } else {
    let maxDegree = -1;
    conceptNodes.forEach(node => {
      const degree = adjacency.get(node.id)?.length || 0;
      if (degree > maxDegree) {
        maxDegree = degree;
        rootId = node.id;
      }
    });
  }

  // 3. Build Spanning Tree (BFS) - THIS IS THE KEY: tree edges NEVER cross
  const childrenMap = new globalThis.Map<string, string[]>();
  const parentMap = new globalThis.Map<string, string | null>();
  const visited = new globalThis.Set<string>();
  const queue = [rootId];
  visited.add(rootId);
  childrenMap.set(rootId, []);
  parentMap.set(rootId, null);

  // Store tree edges as we build the tree
  const treeEdges: Array<{ source: string; target: string }> = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    const neighbors = adjacency.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        visited.add(v);
        childrenMap.get(u)?.push(v);
        childrenMap.set(v, []);
        parentMap.set(v, u);
        queue.push(v);
        // Add tree edge (parent -> child)
        treeEdges.push({ source: u, target: v });
      }
    }
  }

  // Handle disconnected nodes - attach to root
  conceptNodes.forEach(node => {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      childrenMap.get(rootId)?.push(node.id);
      childrenMap.set(node.id, []);
      parentMap.set(node.id, rootId);
      treeEdges.push({ source: rootId, target: node.id });
    }
  });

  // 4. Calculate Subtree Sizes for proportional angle allocation
  const subtreeSizes = new globalThis.Map<string, number>();
  const calcSize = (u: string): number => {
    let size = 1;
    const children = childrenMap.get(u) || [];
    for (const v of children) {
      size += calcSize(v);
    }
    subtreeSizes.set(u, size);
    return size;
  };
  calcSize(rootId);

  // 5. Calculate node depths
  const depths = new globalThis.Map<string, number>();
  const calcDepth = (u: string, depth: number) => {
    depths.set(u, depth);
    const children = childrenMap.get(u) || [];
    for (const v of children) {
      calcDepth(v, depth + 1);
    }
  };
  calcDepth(rootId, 0);

  // 6. Radial Tree Layout - MUCH more spacing, guaranteed no crossing
  const positions = new globalThis.Map<string, { x: number; y: number }>();
  const LAYER_SPACING = 400 * scaleFactor; // Much bigger spacing between layers
  const MIN_NODE_SPACING = 0.3; // Minimum angle gap between siblings (radians)

  const layoutNode = (u: string, startAngle: number, endAngle: number) => {
    const depth = depths.get(u) || 0;
    const radius = depth * LAYER_SPACING;
    const midAngle = (startAngle + endAngle) / 2;
    
    positions.set(u, {
      x: Math.cos(midAngle) * radius,
      y: Math.sin(midAngle) * radius
    });

    const children = childrenMap.get(u) || [];
    if (children.length === 0) return;

    const totalWeight = children.reduce((sum, v) => sum + (subtreeSizes.get(v) || 1), 0);
    const totalSweep = endAngle - startAngle;
    
    // Ensure minimum spacing between children
    const requiredPadding = MIN_NODE_SPACING * (children.length - 1);
    const availableSweep = Math.max(totalSweep - requiredPadding, totalSweep * 0.7);
    const actualPadding = (totalSweep - availableSweep) / Math.max(1, children.length - 1);
    
    let currentAngle = startAngle;
    
    for (let i = 0; i < children.length; i++) {
      const v = children[i];
      const weight = subtreeSizes.get(v) || 1;
      const share = weight / totalWeight;
      const angleWidth = availableSweep * share;
      
      layoutNode(v, currentAngle, currentAngle + angleWidth);
      currentAngle += angleWidth + actualPadding;
    }
  };

  // Start layout from root with full circle
  layoutNode(rootId, 0, 2 * Math.PI);

  // 7. Create Flow Nodes
  const flowNodes: Node[] = conceptNodes.map((node) => {
    const pos = positions.get(node.id) || { x: 0, y: 0 };
    const isActive = node.id === activeNodeId;
    const isHighlighted = highlightedNodes?.has(node.id);
    const isRoot = node.id === rootId;
    
    let size: number;
    if (isRoot) {
      size = 240 * scaleFactor; // Big central node
    } else {
      const baseSize = 100 + (node.label?.length || 0) * 1.5;
      size = Math.min(Math.max(baseSize, 80), 160) * scaleFactor;
    }

    return {
      id: node.id,
      type: 'conceptNode',
      position: pos,
      data: {
        label: node.label,
        category: isRoot ? 'main' : node.category,
        description: '',
        isActive,
        isHighlighted,
        size,
        isRoot,
        isZenMode,
      },
    };
  });

  // 8. Create STRAIGHT tree edges ONLY with labels - these NEVER cross in radial layout
  const flowEdges: Edge[] = treeEdges.map((edge, index) => {
    // Get relationship label from the original edge data
    const relationKey = `${edge.source}-${edge.target}`;
    const reverseKey = `${edge.target}-${edge.source}`;
    const label = edgeRelationships[relationKey] || edgeRelationships[reverseKey] || 'relates to';
    
    return {
      id: `tree-edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'straight',
      label: label,
      labelStyle: { 
        fill: 'hsl(265, 80%, 80%)', 
        fontWeight: 600, 
        fontSize: isZenMode ? 14 : 11,
        textShadow: '0 1px 3px hsl(0 0% 0% / 0.8)',
      },
      labelBgStyle: { 
        fill: 'hsl(265, 40%, 15%)', 
        fillOpacity: 0.9,
        rx: 4,
        ry: 4,
      },
      labelBgPadding: [6, 4] as [number, number],
      style: {
        stroke: 'hsl(265, 60%, 55%)',
        strokeWidth: isZenMode ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(265, 60%, 55%)',
        width: isZenMode ? 18 : 15,
        height: isZenMode ? 18 : 15,
      },
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
};

export const KnowledgeMap = ({ onNodeClick, activeNodeId, data, highlightedNodes, language = 'en' }: KnowledgeMapProps) => {
  const { toast } = useToast();
  const flowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{ 
    id: string;
    label: string; 
    category: string; 
    description?: string;
    details?: string[];
    connections?: string[];
  } | null>(null);
  
  // Edit modal state
  const [editingNode, setEditingNode] = useState<{ id: string; label: string } | null>(null);
  
  // Persistence: track if user has made changes
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const [userNodePositions, setUserNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [userNodeLabels, setUserNodeLabels] = useState<Map<string, string>>(new Map());
  
  const labels = uiLabels[language] || uiLabels.en;

  // Calculate layout with user modifications applied
  const layoutResult = useMemo(() => {
    const sourceNodes = data?.nodes || initialNodes;
    const sourceEdges = data?.edges || initialEdges;
    
    // Apply user label changes
    const modifiedNodes = sourceNodes.map(node => ({
      ...node,
      label: userNodeLabels.get(node.id) || node.label,
    }));
    
    return createTreeLayout(modifiedNodes, sourceEdges, activeNodeId, highlightedNodes, isZenMode);
  }, [data, activeNodeId, highlightedNodes, isZenMode, userNodeLabels]);

  // Apply user position changes to layout result
  const nodesWithUserPositions = useMemo(() => {
    if (userNodePositions.size === 0) return layoutResult.nodes;
    return layoutResult.nodes.map(node => {
      const userPos = userNodePositions.get(node.id);
      return userPos ? { ...node, position: userPos } : node;
    });
  }, [layoutResult.nodes, userNodePositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithUserPositions);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutResult.edges);

  // Sync nodes when layout changes (but preserve user positions)
  useEffect(() => {
    if (!hasUserChanges) {
      setNodes(nodesWithUserPositions);
      setEdges(layoutResult.edges);
    } else {
      // Only update edges, keep user node positions
      setEdges(layoutResult.edges);
    }
  }, [nodesWithUserPositions, layoutResult.edges, hasUserChanges, setNodes, setEdges]);

  // Handle node position changes (drag)
  const handleNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    onNodesChange(changes);
    
    // Track position changes for persistence
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        const posChange = change as NodePositionChange;
        if (posChange.position) {
          setUserNodePositions(prev => {
            const newMap = new Map(prev);
            newMap.set(change.id, posChange.position!);
            return newMap;
          });
          setHasUserChanges(true);
        }
      }
    });
  }, [onNodesChange]);

  // Handle node double-click for editing
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const nodeData = node.data as { label: string };
    setEditingNode({ id: node.id, label: nodeData.label });
  }, []);

  // Save edited label
  const handleSaveLabel = useCallback((nodeId: string, newLabel: string) => {
    setUserNodeLabels(prev => {
      const newMap = new Map(prev);
      newMap.set(nodeId, newLabel);
      return newMap;
    });
    setHasUserChanges(true);
    setEditingNode(null);
    
    // Update the selected node if it's the one being edited
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, label: newLabel } : prev);
    
    // Update nodes state directly
    setNodes(nds => nds.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
    ));
  }, [setNodes]);

  // Handle node click - show comprehensive info panel
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const nodeData = node.data as { label: string; category: string; description?: string };
    const nodeId = node.id;
    
    // Get description and details from nodeDescriptions
    const nodeInfo = nodeDescriptions[nodeId] || { 
      description: `Learn more about "${nodeData.label}"`,
      details: []
    };
    
    // Find connected nodes
    const sourceNodes = data?.nodes || initialNodes;
    const currentNode = sourceNodes.find(n => n.id === nodeId);
    const connections = currentNode?.connectedTo || [];
    const connectionLabels = connections.map(connId => {
      const connNode = sourceNodes.find(n => n.id === connId);
      return connNode?.label || connId;
    });
    
    setSelectedNode({
      id: nodeId,
      label: userNodeLabels.get(nodeId) || nodeData.label,
      category: nodeData.category,
      description: nodeInfo.description,
      details: nodeInfo.details,
      connections: connectionLabels,
    });
    onNodeClick?.(nodeData.label, nodeInfo.description, nodeData.category);
  }, [onNodeClick, data, userNodeLabels]);

  const closeInfoPanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const clearState = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Reset to initial layout
  const resetToInitial = useCallback(() => {
    setUserNodePositions(new Map());
    setUserNodeLabels(new Map());
    setHasUserChanges(false);
    setNodes(layoutResult.nodes);
    setEdges(layoutResult.edges);
    toast({
      title: labels.mapCleared,
      description: labels.mapClearedDesc,
    });
  }, [layoutResult, setNodes, setEdges, toast, labels]);

  // Zen Mode toggle with Browser Fullscreen API
  const toggleZenMode = useCallback(async () => {
    if (!isZenMode) {
      // Enter Zen Mode
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch (e) {
        console.warn('Fullscreen API not available:', e);
      }
      setIsZenMode(true);
    } else {
      // Exit Zen Mode
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (e) {
        console.warn('Error exiting fullscreen:', e);
      }
      setIsZenMode(false);
    }
  }, [isZenMode]);

  // Handle ESC key and fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isZenMode) {
        setIsZenMode(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        toggleZenMode();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZenMode, toggleZenMode]);

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
    <>
      <AnimatePresence>
        <motion.div
          ref={containerRef}
          layout
          initial={false}
          animate={{
            width: isZenMode ? '100vw' : '100%',
            height: isZenMode ? '100vh' : '100%',
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`relative ${isZenMode ? 'fixed inset-0 z-50' : 'h-full w-full'}`}
        >
          {/* Dark glassmorphism background */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(215 30% 12% / 0.95), hsl(215 28% 8% / 0.98))',
              backdropFilter: 'blur(20px)',
              border: isZenMode ? 'none' : '1px solid hsl(215 20% 25% / 0.5)',
              borderRadius: isZenMode ? 0 : undefined,
            }}
          >
            <div ref={flowRef} className="w-full h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: isZenMode ? 0.2 : 0.3 }}
                minZoom={0.1}
                maxZoom={isZenMode ? 4 : 3}
                proOptions={{ hideAttribution: true }}
                panOnDrag={true}
                zoomOnPinch={true}
                zoomOnScroll={true}
                preventScrolling={false}
                nodesDraggable={true}
              >
                <Background
                  color="hsl(215, 20%, 30%)"
                  gap={isZenMode ? 30 : 20}
                  size={1}
                />
                <Controls
                  className={`!backdrop-blur-sm !border-border !rounded-lg !shadow-lg ${
                    isZenMode 
                      ? '!bg-card/95 [&>button]:!w-10 [&>button]:!h-10 [&>button]:!text-base' 
                      : '!bg-card/80'
                  }`}
                  showInteractive={false}
                  style={{
                    boxShadow: isZenMode ? '0 10px 40px -10px hsl(0 0% 0% / 0.5)' : undefined,
                  }}
                />
                <MiniMap
                  nodeColor={getNodeColor}
                  maskColor="hsl(215, 30%, 12% / 0.8)"
                  className="!bg-card/60 !backdrop-blur-sm !border-border !rounded-lg"
                />

                {/* Control Panel */}
                <Panel position="top-right" className="flex flex-col sm:flex-row gap-2">
                  {hasUserChanges && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToInitial}
                      className="bg-card/90 backdrop-blur-sm border-border hover:bg-secondary shadow-md text-xs sm:text-sm active:scale-95 transition-all"
                    >
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{labels.reset}</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearMap}
                    className="bg-card/90 backdrop-blur-sm border-border hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 shadow-md text-xs sm:text-sm active:scale-95 transition-all"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{labels.clearMap}</span>
                    <span className="sm:hidden">{labels.clear}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportImage}
                    className="bg-card/90 backdrop-blur-sm border-border hover:bg-primary/20 hover:text-primary hover:border-primary/50 shadow-md text-xs sm:text-sm active:scale-95 transition-all"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{labels.export}</span>
                    <span className="sm:hidden">{labels.save}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleZenMode}
                    className="bg-card/90 backdrop-blur-sm border-border hover:bg-secondary shadow-md active:scale-95 transition-all"
                  >
                    {isZenMode ? (
                      <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </Panel>

                {/* Title */}
                <Panel position="top-left">
                  <motion.div 
                    layout
                    className="flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md"
                  >
                    <MapIcon className={`text-primary ${isZenMode ? 'h-5 w-5' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
                    <span className={`font-medium text-foreground ${isZenMode ? 'text-base' : 'text-xs sm:text-sm'}`}>
                      {labels.knowledgeMap}
                      {isZenMode && <span className="text-muted-foreground ml-2">• {labels.zenMode}</span>}
                    </span>
                  </motion.div>
                </Panel>
              </ReactFlow>
            </div>
          </div>

          {/* Zen Mode exit button (appears on hover at top) */}
          {isZenMode && <FullscreenExitButton onExit={toggleZenMode} />}

          {/* Node Info Panel - Bottom panel for non-Zen mode */}
          {selectedNode && !isZenMode && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 max-h-[70vh] overflow-y-auto">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="rounded-xl p-5 backdrop-blur-xl border"
                style={{
                  background: 'linear-gradient(135deg, hsl(265 70% 20% / 0.95), hsl(265 60% 15% / 0.98))',
                  borderColor: 'hsl(265 60% 50% / 0.5)',
                  boxShadow: '0 20px 50px -10px hsl(265 60% 30% / 0.5)',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span className="text-xs uppercase tracking-wider text-purple-300 font-medium px-2 py-0.5 rounded-full bg-purple-500/20">
                        {selectedNode.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{selectedNode.label}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeInfoPanel}
                    className="h-8 w-8 text-purple-300 hover:text-white hover:bg-purple-500/20 shrink-0 backdrop-blur-sm active:scale-95 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-200">Description</span>
                  </div>
                  <p className="text-sm text-purple-100/90 leading-relaxed">{selectedNode.description}</p>
                </div>

                {/* Key Details */}
                {selectedNode.details && selectedNode.details.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-200">Key Facts</span>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedNode.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-purple-100/80">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Connected Concepts */}
                {selectedNode.connections && selectedNode.connections.length > 0 && (
                  <div className="pt-3 border-t border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-200">Connected To</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.connections.map((conn, index) => (
                        <span 
                          key={index} 
                          className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30"
                        >
                          {conn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Zen Mode Side Panel */}
      <ZenModeSidePanel
        isOpen={isZenMode && !!selectedNode}
        node={selectedNode}
        onClose={closeInfoPanel}
        onEditLabel={(nodeId, label) => setEditingNode({ id: nodeId, label })}
      />

      {/* Edit Node Label Modal */}
      <AnimatePresence>
        {editingNode && (
          <EditableNodeLabel
            isOpen={!!editingNode}
            nodeId={editingNode.id}
            currentLabel={editingNode.label}
            onSave={handleSaveLabel}
            onCancel={() => setEditingNode(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default KnowledgeMap;
