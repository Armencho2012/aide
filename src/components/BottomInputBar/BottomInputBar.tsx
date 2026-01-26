import { useState, useRef, DragEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Sparkles,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Lock,
  Plus,
  Upload,
  Send,
} from 'lucide-react';
import { useVoiceInput } from './useVoiceInput';
import { BottomInputBarProps, PrimaryMode, GenerationOptions, uiLabels } from './types';

export const BottomInputBar = ({
  language,
  onSubmit,
  isProcessing,
  isLocked
}: BottomInputBarProps) => {
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>('analyse');
  const [text, setText] = useState('');
  const [media, setMedia] = useState<{ data: string; mimeType: string; name: string }[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labels = uiLabels[language];

  // Generation options - Quiz and Flashcards checked by default
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    quiz: true,
    flashcards: true,
    map: false,
    course: false,
    podcast: false
  });

  const handleTranscript = useCallback((transcript: string) => {
    setText(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const { isListening, isSupported, toggleListening } = useVoiceInput({
    onTranscript: handleTranscript,
    language
  });

  const handleSubmit = () => {
    if (!text.trim() && (!media || media.length === 0)) return;
    
    // For analyse mode, pass generation options
    // For chat mode, just send to chat
    const mode = primaryMode === 'analyse' ? 'analyze' : 'chat';
    onSubmit(text, mode, media, primaryMode === 'analyse' ? generationOptions : undefined);
    setText('');
    setMedia(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLocked) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isLocked && e.dataTransfer.files.length > 0) {
      handleFilesAdd(e.dataTransfer.files);
    }
  };

  const handleFilesAdd = async (files: FileList) => {
    const newMedia: { data: string; mimeType: string; name: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      await new Promise<void>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          newMedia.push({
            data: base64String,
            mimeType: file.type,
            name: file.name
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setMedia(prev => prev ? [...prev, ...newMedia] : newMedia);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdd(e.target.files);
    }
  };

  const toggleGenerationOption = (option: keyof GenerationOptions) => {
    setGenerationOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all ${isDragging ? 'bg-primary/5' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-10 w-10" />
            <span className="font-medium">{labels.dropFiles}</span>
          </div>
        </div>
      )}

      <div className="container max-w-3xl mx-auto">
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 sm:p-5">
          {/* Primary Mode Toggle - Analyse | Chat */}
          <div className="flex justify-center mb-4">
            <ToggleGroup
              type="single"
              value={primaryMode}
              onValueChange={(value) => value && setPrimaryMode(value as PrimaryMode)}
              className="bg-muted/50 rounded-xl p-1.5"
            >
              <ToggleGroupItem
                value="analyse"
                aria-label={labels.tooltips.analyze}
                className="gap-2 px-4 sm:px-6 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-lg transition-all"
                disabled={isLocked}
              >
                <Sparkles className="h-4 w-4" />
                <span>{labels.primaryModes.analyse}</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="chat"
                aria-label={labels.tooltips.chat}
                className="gap-2 px-4 sm:px-6 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-lg transition-all"
                disabled={isLocked}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{labels.primaryModes.chat}</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Generation Options - Only show when Analyse is selected */}
          {primaryMode === 'analyse' && (
            <div className="flex flex-wrap justify-center gap-3 mb-4 px-2">
              {(['quiz', 'flashcards', 'map', 'course', 'podcast'] as const).map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    generationOptions[option]
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'bg-muted/50 border border-transparent text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={generationOptions[option]}
                    onCheckedChange={() => toggleGenerationOption(option)}
                    disabled={isLocked}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium capitalize">
                    {labels.generationOptions[option]}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Main Input Area */}
          <div className="relative">
            {media && media.length > 0 && (
              <Badge variant="secondary" className="absolute -top-3 left-3 gap-1 text-xs z-10">
                {media.length} {media.length === 1 ? labels.fileAttached : labels.filesAttached}
              </Badge>
            )}
            <Textarea
              placeholder={isLocked ? labels.upgradeTooltip : labels.placeholder[primaryMode === 'analyse' ? 'analyze' : 'chat']}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] max-h-[200px] resize-none text-base p-4 pr-14 rounded-xl border-border/30 bg-background/50 focus:bg-background transition-colors"
              disabled={isLocked}
              rows={3}
            />

            {/* Voice Input Button (inside textarea) */}
            {isSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                disabled={isLocked}
                className={`absolute right-3 top-3 h-10 w-10 rounded-lg ${isListening ? 'text-destructive bg-destructive/10 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                title={isListening ? labels.listening : labels.voiceInput}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between mt-4 gap-3">
            {/* File Picker Button */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileInputChange}
              accept="image/*,application/pdf"
              multiple
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLocked}
              className="shrink-0 h-11 w-11 rounded-xl border-border/50"
              title={labels.attachFile}
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Send Button */}
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || (!text.trim() && (!media || media.length === 0)) || isLocked}
              className="shrink-0 h-11 px-6 sm:px-8 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-base font-medium shadow-lg shadow-primary/25"
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">{labels.submit}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
