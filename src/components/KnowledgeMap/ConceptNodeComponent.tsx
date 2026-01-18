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
  Circle,
  Star,
  FileText,
  type LucideIcon
} from 'lucide-react';
import { NodeCategory, categoryColors } from './types';

interface ConceptNodeData {
  label: string;
  category: NodeCategory;
  isActive?: boolean;
  isHighlighted?: boolean;
  description?: string;
  size?: number;
  centrality?: number;
  masteryStatus?: 'locked' | 'unlocked' | 'mastered';
  onClick?: (label: string, description?: string, category?: string) => void;
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
  concept: Circle,
  main: Star,
  section: FileText,
};

const ConceptNodeComponent = ({ data }: ConceptNodeProps) => {
  const { label, category, isActive, isHighlighted, description, size = 40, centrality = 0, masteryStatus = 'unlocked', onClick } = data;
  const colors = categoryColors[category] || categoryColors.general;
  const Icon = iconMap[category] || Lightbulb;

  // Determine visual state based on mastery
  const isLocked = masteryStatus === 'locked';
  const isMastered = masteryStatus === 'mastered';

  // Adjust colors based on mastery status
  const nodeBg = isLocked
    ? 'hsl(215, 25%, 30%)'
    : isMastered
      ? 'linear-gradient(135deg, hsl(45, 90%, 55%), hsl(35, 95%, 60%))'
      : `linear-gradient(135deg, ${colors.bg}20, ${colors.bg}40)`;
  const nodeBorder = isLocked
    ? 'hsl(215, 25%, 40%)'
    : isMastered
      ? 'hsl(45, 90%, 60%)'
      : isActive ? colors.border : `${colors.border}60`;
  const nodeGlow = isMastered ? 'hsl(45, 90%, 60%)' : colors.glow;

  const handleClick = () => {
    if (!isLocked) {
      onClick?.(label, description, category);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer transition-all duration-300 ease-out"
      style={{
        filter: isActive ? `drop-shadow(0 0 20px ${colors.glow})` : 'none',
      }}
    >
      {/* Glassmorphism card with improved sizing and padding */}
      <div
        className={`relative px-5 py-4 rounded-2xl backdrop-blur-xl border-2 transition-all duration-300 hover:scale-105 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isMastered ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
        style={{
          background: nodeBg,
          borderColor: nodeBorder,
          minWidth: `${Math.max(160, size)}px`,
          maxWidth: '200px',
          width: 'auto',
          boxShadow: isActive
            ? `0 12px 40px -4px ${nodeGlow}50, inset 0 1px 0 ${nodeBorder}30`
            : isMastered
              ? `0 8px 24px -2px hsl(45 90% 55% / 0.5), inset 0 1px 0 hsl(45 90% 60% / 0.3)`
              : `0 8px 24px -4px hsl(0 0% 0% / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.1)`,
          transform: isLocked ? 'scale(0.9)' : undefined,
        }}
        title={isLocked ? 'Complete related quiz to unlock' : isMastered ? 'Mastered!' : description || label}
      >
        {/* Active glow ring or pulse animation */}
        {(isActive || isHighlighted) && (
          <div
            className={`absolute inset-0 rounded-xl ${isHighlighted ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : 'animate-pulse'}`}
            style={{
              background: isHighlighted
                ? `radial-gradient(ellipse at center, hsl(var(--primary)) 30%, transparent 70%)`
                : `radial-gradient(ellipse at center, ${nodeGlow}15, transparent 70%)`,
              border: isHighlighted ? '2px solid hsl(var(--primary))' : 'none',
              boxShadow: isHighlighted ? `0 0 30px hsl(var(--primary) / 0.8)` : 'none',
              zIndex: isHighlighted ? 10 : 0
            }}
          />
        )}

        {/* Mastery badge */}
        {isMastered && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-background flex items-center justify-center shadow-lg">
            <span className="text-xs">✓</span>
          </div>
        )}

        {/* Locked indicator */}
        {isLocked && (
          <div className="absolute inset-0 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs text-muted-foreground">🔒</span>
          </div>
        )}

      {/* Content - Improved typography */}
      <div className="relative flex items-center gap-3">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{
            background: `${colors.bg}60`,
          }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span 
          className="text-base font-semibold text-white drop-shadow-md leading-tight"
          style={{
            fontFamily: "'Inter', 'Geist', system-ui, sans-serif",
            maxWidth: '140px',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
          }}
        >
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
