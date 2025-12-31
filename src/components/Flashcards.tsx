import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, Layers } from 'lucide-react';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsProps {
  flashcards: Flashcard[];
  language: Language;
}

const uiLabels = {
  en: {
    title: 'Flashcards',
    flip: 'Click to flip',
    card: 'Card',
    of: 'of',
    restart: 'Restart',
    noCards: 'No flashcards available'
  },
  ru: {
    title: 'Карточки',
    flip: 'Нажмите, чтобы перевернуть',
    card: 'Карточка',
    of: 'из',
    restart: 'Начать заново',
    noCards: 'Карточки недоступны'
  },
  hy: {
    title: 'Delays',
    flip: 'Սdelays delays delays delays',
    card: 'Քdelays',
    of: 'delays',
    restart: 'Վdelays delays',
    noCards: 'Delays delays delays delays'
  },
  ko: {
    title: '플래시카드',
    flip: '클릭하여 뒤집기',
    card: '카드',
    of: '/',
    restart: '다시 시작',
    noCards: '플래시카드가 없습니다'
  }
};

export const Flashcards = ({ flashcards, language }: FlashcardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const labels = uiLabels[language];

  const validFlashcards = useMemo(() => {
    return flashcards.filter(card => card.front && card.back);
  }, [flashcards]);

  if (validFlashcards.length === 0) {
    return (
      <Card className="border-primary/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {labels.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">{labels.noCards}</p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = validFlashcards[currentIndex];

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev === 0 ? validFlashcards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev === validFlashcards.length - 1 ? 0 : prev + 1));
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <CardTitle className="text-primary flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {labels.title}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {labels.card} {currentIndex + 1} {labels.of} {validFlashcards.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flashcard */}
        <div 
          className="relative cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div 
            className={`relative w-full min-h-[200px] transition-transform duration-500 transform-style-preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 rounded-xl p-6 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-lg font-medium text-center">{currentCard.front}</p>
              <p className="text-xs text-muted-foreground mt-4">{labels.flip}</p>
            </div>
            
            {/* Back */}
            <div 
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-accent/20 rounded-xl p-6 flex flex-col items-center justify-center"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <p className="text-lg text-center">{currentCard.back}</p>
              <p className="text-xs text-muted-foreground mt-4">{labels.flip}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {labels.restart}
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 flex-wrap">
          {validFlashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => { setCurrentIndex(index); setIsFlipped(false); }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
