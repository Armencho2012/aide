import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Sparkles,
  Loader2,
  Calendar,
  MessageSquare,
  HelpCircle,
  Lock,
  Paperclip
} from 'lucide-react';

type Language = 'en' | 'ru' | 'hy' | 'ko';
type ActionMode = 'analyze' | 'plan' | 'chat' | 'ask';

export interface MediaFile {
  data: string;
  mimeType: string;
  name: string;
}

interface MultiActionInputProps {
  language: Language;
  onSubmit: (text: string, mode: ActionMode, media?: MediaFile[] | null) => void;
  isProcessing: boolean;
  isLocked: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  media: MediaFile[] | null;
}

const uiLabels = {
  en: {
    placeholder: {
      analyze: 'Paste your text to get a full analysis with summaries, vocabulary, and quizzes...',
      plan: 'Paste content to generate a 7-day learning schedule...',
      chat: 'Ask a question about any topic or paste text to discuss...',
      ask: 'Paste text and I\'ll ask YOU questions to test your understanding...'
    },
    buttons: {
      analyze: 'Analyze',
      plan: 'Plan',
      chat: 'Chat',
      ask: 'Ask Me'
    },
    tooltips: {
      analyze: 'Full pedagogical analysis',
      plan: '7-day learning calendar',
      chat: 'General Q&A',
      ask: 'Socratic questioning'
    },
    submit: {
      analyze: 'Analyze Text',
      plan: 'Generate Plan',
      chat: 'Send Message',
      ask: 'Start Quiz'
    },
    processing: 'Processing...',
    attachFile: 'Attach',
    fileAttached: 'file attached',
    filesAttached: 'files attached',
    upgradeTooltip: 'Upgrade to continue'
  },
  ru: {
    placeholder: {
      analyze: 'Вставьте текст для полного анализа с резюме, словарём и тестами...',
      plan: 'Вставьте материал для создания 7-дневного плана обучения...',
      chat: 'Задайте вопрос или вставьте текст для обсуждения...',
      ask: 'Вставьте текст, и я задам ВАМ вопросы для проверки понимания...'
    },
    buttons: {
      analyze: 'Анализ',
      plan: 'План',
      chat: 'Чат',
      ask: 'Тест'
    },
    tooltips: {
      analyze: 'Полный педагогический анализ',
      plan: '7-дневный календарь обучения',
      chat: 'Общие вопросы и ответы',
      ask: 'Сократический метод'
    },
    submit: {
      analyze: 'Анализировать',
      plan: 'Создать план',
      chat: 'Отправить',
      ask: 'Начать тест'
    },
    processing: 'Обработка...',
    attachFile: 'Файл',
    fileAttached: 'файл прикреплён',
    filesAttached: 'файлов прикреплено',
    upgradeTooltip: 'Обновите для продолжения'
  },
  hy: {
    placeholder: {
      analyze: 'Տdelays delays delays delays, delays delays delays delays delays delays...',
      plan: 'Տdelays delays 7-delays delays delays delays delays...',
      chat: 'Delays delays delays delays delays delays delays delays delays delays...',
      ask: 'Տdelays delays, delays delays delays delays delays delays delays delays...'
    },
    buttons: {
      analyze: 'Delays delays',
      plan: 'Delays',
      chat: 'Delays delays',
      ask: 'Delays delays'
    },
    tooltips: {
      analyze: 'Delays delays delays delays delays',
      plan: '7-delays delays delays delays',
      chat: 'Delays delays delays',
      ask: 'Delays delays delays delays'
    },
    submit: {
      analyze: 'Delays delays delays delays',
      plan: 'Delays delays delays',
      chat: 'Delays delays delays delays',
      ask: 'Delays delays delays delays'
    },
    processing: 'Delays delays...',
    attachFile: 'Delays',
    fileAttached: 'delays delays',
    filesAttached: 'delays delays',
    upgradeTooltip: 'Delays delays'
  },
  ko: {
    placeholder: {
      analyze: '텍스트를 붙여넣어 요약, 어휘, 퀴즈가 포함된 전체 분석을 받으세요...',
      plan: '콘텐츠를 붙여넣어 7일 학습 일정을 생성하세요...',
      chat: '주제에 대해 질문하거나 토론할 텍스트를 붙여넣으세요...',
      ask: '텍스트를 붙여넣으면 이해도를 테스트하기 위해 질문을 드립니다...'
    },
    buttons: {
      analyze: '분석',
      plan: '계획',
      chat: '채팅',
      ask: '질문'
    },
    tooltips: {
      analyze: '전체 교육 분석',
      plan: '7일 학습 일정',
      chat: '일반 Q&A',
      ask: '소크라테스식 질문'
    },
    submit: {
      analyze: '분석하기',
      plan: '계획 생성',
      chat: '메시지 전송',
      ask: '퀴즈 시작'
    },
    processing: '처리 중...',
    attachFile: '첨부',
    fileAttached: '개 파일 첨부됨',
    filesAttached: '개 파일 첨부됨',
    upgradeTooltip: '계속하려면 업그레이드'
  }
};

export const MultiActionInput = ({
  language,
  onSubmit,
  isProcessing,
  isLocked,
  onFileChange,
  media
}: MultiActionInputProps) => {
  const [mode, setMode] = useState<ActionMode>('analyze');
  const [text, setText] = useState('');
  const labels = uiLabels[language];

  const handleSubmit = () => {
    if (!text.trim() && (!media || media.length === 0)) return;
    onSubmit(text, mode, media);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const modeIcons = {
    analyze: <Sparkles className="h-4 w-4" />,
    plan: <Calendar className="h-4 w-4" />,
    chat: <MessageSquare className="h-4 w-4" />,
    ask: <HelpCircle className="h-4 w-4" />
  };

  return (
    <Card className={`p-4 sm:p-6 shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 ${isLocked ? 'opacity-50' : ''}`}>
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => value && setMode(value as ActionMode)}
            className="flex-wrap justify-start"
          >
            {(['analyze', 'plan', 'chat', 'ask'] as const).map((m) => (
              <ToggleGroupItem
                key={m}
                value={m}
                aria-label={labels.tooltips[m]}
                className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                disabled={isLocked}
              >
                {modeIcons[m]}
                <span className="hidden sm:inline">{labels.buttons[m]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="flex items-center gap-2">
            <input
              type="file"
              id="multi-action-upload"
              className="hidden"
              onChange={onFileChange}
              accept="image/*,application/pdf"
              multiple
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('multi-action-upload')?.click()}
              className="gap-1.5"
              disabled={isLocked}
            >
              <Paperclip className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.attachFile}</span>
            </Button>
            {media && media.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {media.length} {media.length === 1 ? labels.fileAttached : labels.filesAttached}
              </Badge>
            )}
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          placeholder={isLocked ? labels.upgradeTooltip : labels.placeholder[mode]}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] sm:min-h-[160px] text-sm sm:text-base resize-none"
          disabled={isLocked}
        />

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || (!text.trim() && (!media || media.length === 0)) || isLocked}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md"
          size="lg"
        >
          {isLocked ? (
            <>
              <Lock className="mr-2 h-5 w-5" />
              {labels.upgradeTooltip}
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {labels.processing}
            </>
          ) : (
            <>
              {modeIcons[mode]}
              <span className="ml-2">{labels.submit[mode]}</span>
            </>
          )}
        </Button>

        {/* Mode Description */}
        <p className="text-xs text-muted-foreground text-center">
          {labels.tooltips[mode]} • Ctrl+Enter to submit
        </p>
      </div>
    </Card>
  );
};