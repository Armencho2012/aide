export type NodeCategory = 
  | 'science' 
  | 'history' 
  | 'math' 
  | 'language' 
  | 'technology' 
  | 'philosophy' 
  | 'art' 
  | 'general'
  | 'concept'
  | 'main'
  | 'section';

export interface ConceptNode {
  id: string;
  label: string;
  category: NodeCategory;
  connectedTo: string[];
  isActive?: boolean;
}

export interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  strength?: string | number;
}

export interface KnowledgeMapData {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export const categoryColors: Record<NodeCategory, { bg: string; border: string; glow: string }> = {
  science: { 
    bg: 'hsl(142, 76%, 36%)', 
    border: 'hsl(142, 76%, 46%)', 
    glow: 'hsl(142, 76%, 36%)' 
  },
  history: { 
    bg: 'hsl(217, 91%, 60%)', 
    border: 'hsl(217, 91%, 70%)', 
    glow: 'hsl(217, 91%, 60%)' 
  },
  math: { 
    bg: 'hsl(280, 87%, 55%)', 
    border: 'hsl(280, 87%, 65%)', 
    glow: 'hsl(280, 87%, 55%)' 
  },
  language: { 
    bg: 'hsl(35, 95%, 55%)', 
    border: 'hsl(35, 95%, 65%)', 
    glow: 'hsl(35, 95%, 55%)' 
  },
  technology: { 
    bg: 'hsl(195, 85%, 55%)', 
    border: 'hsl(195, 85%, 65%)', 
    glow: 'hsl(195, 85%, 55%)' 
  },
  philosophy: { 
    bg: 'hsl(330, 65%, 50%)', 
    border: 'hsl(330, 65%, 60%)', 
    glow: 'hsl(330, 65%, 50%)' 
  },
  art: { 
    bg: 'hsl(15, 85%, 55%)', 
    border: 'hsl(15, 85%, 65%)', 
    glow: 'hsl(15, 85%, 55%)' 
  },
  general: { 
    bg: 'hsl(215, 25%, 45%)', 
    border: 'hsl(215, 25%, 55%)', 
    glow: 'hsl(215, 25%, 45%)' 
  },
  concept: { 
    bg: 'hsl(260, 70%, 50%)', 
    border: 'hsl(260, 70%, 60%)', 
    glow: 'hsl(260, 70%, 50%)' 
  },
  main: { 
    bg: 'hsl(45, 90%, 50%)', 
    border: 'hsl(45, 90%, 60%)', 
    glow: 'hsl(45, 90%, 50%)' 
  },
  section: { 
    bg: 'hsl(180, 60%, 45%)', 
    border: 'hsl(180, 60%, 55%)', 
    glow: 'hsl(180, 60%, 45%)' 
  },
};

export const categoryIcons: Record<NodeCategory, string> = {
  science: 'Flask',
  history: 'BookOpen',
  math: 'Calculator',
  language: 'Languages',
  technology: 'Cpu',
  philosophy: 'Brain',
  art: 'Palette',
  general: 'Lightbulb',
  concept: 'Circle',
  main: 'Star',
  section: 'FileText',
};
