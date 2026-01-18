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
}

const nodeTypes: NodeTypes = {
  concept: ConceptNodeComponent as any,
};

// Calculate degree centrality (number of connections) for each node
const calculateDegreeCentrality = (nodes: ConceptNode[], edges: ConceptEdge[]): Record<string, number> => {
  const centrality: Record<string, number> = {};
  nodes.forEach(node => {
    centrality[node.id] = 0;
  });
  edges.forEach(edge => {
    if (centrality[edge.source] !== undefined) centrality[edge.source]++;
    if (centrality[edge.target] !== undefined) centrality[edge.target]++;
  });
  return centrality;
};

// Convert ConceptNodes to React Flow nodes with layout - node sizing based on degree centrality
const createFlowNodes = (
  conceptNodes: ConceptNode[],
  edges: ConceptEdge[],
  activeNodeId?: string,
  onNodeClick?: (label: string, description?: string, category?: string) => void,
  highlightedNodes?: Set<string>
): Node[] => {
  const centerX = 500;
  const centerY = 400;
  const baseRadius = 350; // INCREASED from 250 for better separation

  // Calculate degree centrality for node sizing
  const centrality = calculateDegreeCentrality(conceptNodes, edges);
  const maxCentrality = Math.max(...Object.values(centrality), 1);

  // Sort nodes by centrality (most connected first) for better layout
  const sortedNodes = [...conceptNodes].sort((a, b) => (centrality[b.id] || 0) - (centrality[a.id] || 0));

  return sortedNodes.map((node, index) => {
    // Arrange nodes in a force-directed spiral pattern for better separation
    const angle = (index / sortedNodes.length) * 2 * Math.PI - Math.PI / 2;
    const isCenter = index === 0;
    const nodeCentrality = centrality[node.id] || 0;

    // IMPROVED NODE SIZING: Larger base, more contrast
    // Base size 80, scaling up based on centrality relative to max
    const nodeSize = 90 + (nodeCentrality / maxCentrality) * 60;

    const isHighlighted = highlightedNodes?.has(node.id);
    const isActive = node.id === activeNodeId || node.isActive || isHighlighted;

    // Use layered rings for better node distribution
    const ringIndex = Math.floor(index / 6);
    const ringRadius = baseRadius + ringIndex * 120; // 120px between rings
    const nodesInRing = Math.min(6, sortedNodes.length - ringIndex * 6);
    const angleInRing = ((index % 6) / nodesInRing) * 2 * Math.PI - Math.PI / 2;

    return {
      id: node.id,
      type: 'concept',
      position: isCenter
        ? { x: centerX, y: centerY }
        : {
          x: centerX + Math.cos(angleInRing) * ringRadius,
          y: centerY + Math.sin(angleInRing) * ringRadius,
        },
      data: {
        label: node.label,
        category: node.category,
        isActive,
        isHighlighted,
        onClick: onNodeClick,
        description: (node as any).description || '',
        size: nodeSize,
        centrality: nodeCentrality,
        masteryStatus: (node as any).masteryStatus || 'unlocked',
      },
    };
  });
};

// Convert ConceptEdges to React Flow edges - handle structure with label and strength
const createFlowEdges = (conceptEdges: ConceptEdge[]): Edge[] => {
  return conceptEdges.map((edge) => {
    const strength = edge.strength ? (typeof edge.strength === 'string' ? parseInt(edge.strength) : edge.strength) : 5;
    const opacity = 0.5 + (strength / 10) * 0.3; // Opacity based on strength
    const strokeWidth = 1.5 + (strength / 10) * 2.5; // Stroke width based on strength

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      // EDGE LABELS: Display relationship type directly on edges
      label: edge.label || '',
      labelStyle: {
        fill: 'hsl(var(--foreground))',
        fontWeight: 600,
        fontSize: 10,
        backgroundColor: 'hsl(var(--background) / 0.8)',
      },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'hsl(var(--card))', fillOpacity: 0.8 },
      style: {
        stroke: 'hsl(var(--primary) / 0.5)',
        strokeWidth,
        opacity,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--primary) / 0.5)',
        width: 15,
        height: 15,
      },
    };
  });
};

export const KnowledgeMap = ({ onNodeClick, activeNodeId, data, highlightedNodes }: KnowledgeMapProps) => {
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
    () => createFlowNodes(conceptNodes, conceptEdges, activeNodeId, onNodeClick, highlightedNodes),
    [conceptNodes, conceptEdges, activeNodeId, onNodeClick, highlightedNodes]
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
