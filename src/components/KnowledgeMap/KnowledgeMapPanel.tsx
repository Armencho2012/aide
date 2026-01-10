import { useState } from 'react';
import { Map, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KnowledgeMap from './KnowledgeMap';

import { KnowledgeMapData } from './types';

interface KnowledgeMapPanelProps {
  onAskAboutNode?: (nodeName: string) => void;
  activeNodeId?: string;
  data?: KnowledgeMapData | null;
}

export const KnowledgeMapPanel = ({ onAskAboutNode, activeNodeId, data }: KnowledgeMapPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleNodeClick = (nodeName: string) => {
    onAskAboutNode?.(`Tell me more about ${nodeName}`);
  };

  return (
    <div
      className={`relative h-full transition-all duration-300 ease-out ${
        isOpen ? 'w-full sm:w-[350px] md:w-[400px] lg:w-[500px]' : 'w-12'
      }`}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 bg-card border border-border shadow-lg hover:bg-secondary rounded-l-lg rounded-r-none h-20 w-10"
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Collapsed state */}
      {!isOpen && (
        <div className="h-full flex items-center justify-center bg-card/50 backdrop-blur-sm border-l border-border">
          <div className="flex flex-col items-center gap-2">
            <Map className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground writing-mode-vertical transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
              Knowledge Map
            </span>
          </div>
        </div>
      )}

      {/* Expanded state */}
      {isOpen && (
        <div className="h-full p-4 flex flex-col">
          <div className="flex-1 min-h-0">
            <KnowledgeMap
              onNodeClick={handleNodeClick}
              activeNodeId={activeNodeId}
              data={data}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeMapPanel;
