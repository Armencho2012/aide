import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GenerationStatus {
  quiz?: boolean;
  flashcards?: boolean;
  map?: boolean;
  course?: boolean;
  podcast?: boolean;
}

interface MissingAssetsBarProps {
  generationStatus: GenerationStatus | null;
  onRegenerate: (assets: string[]) => void;
  isRegenerating?: boolean;
}

export const MissingAssetsBar = ({ 
  generationStatus, 
  onRegenerate, 
  isRegenerating = false 
}: MissingAssetsBarProps) => {
  if (!generationStatus) return null;

  const missingAssets: string[] = [];
  
  if (generationStatus.quiz === false) missingAssets.push('quiz');
  if (generationStatus.flashcards === false) missingAssets.push('flashcards');
  if (generationStatus.map === false) missingAssets.push('map');
  if (generationStatus.course === false) missingAssets.push('course');
  if (generationStatus.podcast === false) missingAssets.push('podcast');

  if (missingAssets.length === 0) return null;

  const assetLabels: Record<string, string> = {
    quiz: 'Quiz',
    flashcards: 'Flashcards',
    map: 'Knowledge Map',
    course: 'Course',
    podcast: 'Podcast'
  };

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 sm:p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="text-sm font-medium text-warning">
              Missing Assets
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {missingAssets.map(asset => (
                <Badge 
                  key={asset} 
                  variant="outline" 
                  className="text-xs border-warning/50 text-warning"
                >
                  {assetLabels[asset] || asset}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button
          onClick={() => onRegenerate(missingAssets)}
          disabled={isRegenerating}
          size="sm"
          variant="outline"
          className="border-warning/50 text-warning hover:bg-warning/10"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Missing
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
