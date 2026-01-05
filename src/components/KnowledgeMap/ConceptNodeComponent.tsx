import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Beaker, 
  BookOpen, 
  Calculator, 
  Languages, 
  Cpu, 
  Brain, 
  Palette, 
  Lightbulb,
  type LucideIcon 
} from 'lucide-react';
import { NodeCategory, categoryColors } from './types';

interface ConceptNodeData {
  label: string;
  category: NodeCategory;
  isActive?: boolean;
  onClick?: (label: string) => void;
}

interface ConceptNodeProps {
  data: ConceptNodeData;
}

const iconMap: Record<NodeCategory, LucideIcon> = {
  science: Beaker,
  history: BookOpen,
  math: Calculator,
  language: Languages,
  technology: Cpu,
  philosophy: Brain,
  art: Palette,
  general: Lightbulb,
};

const ConceptNodeComponent = ({ data }: ConceptNodeProps) => {
  const { label, category, isActive, onClick } = data;
  const colors = categoryColors[category] || categoryColors.general;
  const Icon = iconMap[category] || Lightbulb;

  const handleClick = () => {
    onClick?.(label);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer transition-all duration-300 ease-out"
      style={{
        filter: isActive ? `drop-shadow(0 0 20px ${colors.glow})` : 'none',
      }}
    >
      {/* Glassmorphism card */}
      <div
        className="relative px-4 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 min-w-[120px]"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}20, ${colors.bg}40)`,
          borderColor: isActive ? colors.border : `${colors.border}60`,
          boxShadow: isActive 
            ? `0 8px 32px -4px ${colors.glow}40, inset 0 1px 0 ${colors.border}30`
            : `0 4px 16px -2px hsl(0 0% 0% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.1)`,
        }}
      >
        {/* Active glow ring */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-xl animate-pulse"
            style={{
              background: `radial-gradient(ellipse at center, ${colors.glow}15, transparent 70%)`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: `${colors.bg}60`,
            }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white drop-shadow-sm">
            {label}
          </span>
        </div>

        {/* Category indicator dot */}
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
          style={{
            background: colors.bg,
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
        />
      </div>

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
    </div>
  );
};

export default memo(ConceptNodeComponent);
