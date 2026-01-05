import { ConceptNode, ConceptEdge, KnowledgeMapData } from './types';

export const initialNodes: ConceptNode[] = [
  {
    id: 'photosynthesis',
    label: 'Photosynthesis',
    category: 'science',
    connectedTo: ['chlorophyll', 'sunlight', 'glucose', 'oxygen'],
    isActive: true,
  },
  {
    id: 'chlorophyll',
    label: 'Chlorophyll',
    category: 'science',
    connectedTo: ['photosynthesis', 'plant-cells'],
  },
  {
    id: 'sunlight',
    label: 'Sunlight',
    category: 'science',
    connectedTo: ['photosynthesis', 'energy'],
  },
  {
    id: 'glucose',
    label: 'Glucose',
    category: 'science',
    connectedTo: ['photosynthesis', 'energy', 'cellular-respiration'],
  },
  {
    id: 'oxygen',
    label: 'Oxygen',
    category: 'science',
    connectedTo: ['photosynthesis', 'cellular-respiration'],
  },
  {
    id: 'energy',
    label: 'Energy',
    category: 'science',
    connectedTo: ['sunlight', 'glucose', 'atp'],
  },
  {
    id: 'cellular-respiration',
    label: 'Cellular Respiration',
    category: 'science',
    connectedTo: ['glucose', 'oxygen', 'atp'],
  },
  {
    id: 'atp',
    label: 'ATP',
    category: 'science',
    connectedTo: ['energy', 'cellular-respiration'],
  },
  {
    id: 'plant-cells',
    label: 'Plant Cells',
    category: 'science',
    connectedTo: ['chlorophyll', 'mitochondria'],
  },
  {
    id: 'mitochondria',
    label: 'Mitochondria',
    category: 'science',
    connectedTo: ['plant-cells', 'cellular-respiration'],
  },
];

// Generate edges from node connections
export const generateEdges = (nodes: ConceptNode[]): ConceptEdge[] => {
  const edges: ConceptEdge[] = [];
  const addedEdges = new Set<string>();

  nodes.forEach((node) => {
    node.connectedTo.forEach((targetId) => {
      const edgeId = [node.id, targetId].sort().join('-');
      if (!addedEdges.has(edgeId)) {
        addedEdges.add(edgeId);
        edges.push({
          id: edgeId,
          source: node.id,
          target: targetId,
        });
      }
    });
  });

  return edges;
};

export const initialEdges: ConceptEdge[] = generateEdges(initialNodes);

export const mockKnowledgeMapData: KnowledgeMapData = {
  nodes: initialNodes,
  edges: initialEdges,
};
