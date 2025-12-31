import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, RotateCcw, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface Flashcard {
  front: string;
  back: string;
}

interface ContentItem {
  id: string;
  title: string | null;
  original_text: string;
  analysis_data: any;
  language: string | null;
  created_at: string | null;
  user_id: string;
}

const uiLabels = {
  en: {
    title: 'Flashcards',
    flip: 'Click to flip',
    card: 'Card',
    of: 'of',
    restart: 'Restart',
    noCards: 'No flashcards available',
    backToContent: 'Back to Content'
  },
  ru: {
    title: 'Карточки',
    flip: 'Нажмите, чтобы перевернуть',
    card: 'Карточка',
    of: 'из',
    restart: 'Начать заново',
    noCards: 'Карточки недоступны',
    backToContent: 'Назад к контенту'
  },
  hy: {
    title: 'Delays',
    flip: 'Сdelays delays delays delays',
    card: 'Քdelays',
    of: 'delays',
    restart: 'Вdelays delays',
    noCards: 'Delays delays delays delays',
    backToContent: 'Delays delays delays'
  },
  ko: {
    title: '플래시카드',
    flip: '클릭하여 뒤집기',
    card: '카드',
    of: '/',
    restart: '다시 시작',
    noCards: '플래시카드가 없습니다',
    backToContent: '콘텐츠로 돌아가기'
  }
};

const FlashcardsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      if (id) fetchContent(id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate, id]);

  const fetchContent = async (contentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;
      setContent(data as ContentItem);
    } catch (error) {
      console.error('Error fetching content:', error);
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const flashcards: Flashcard[] = useMemo(() => {
    return (content?.analysis_data?.flashcards || []).filter((card: Flashcard) => card.front && card.back);
  }, [content]);

  const currentCard = flashcards[currentIndex];

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev === 0 ? flashcards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev === flashcards.length - 1 ? 0 : prev + 1));
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Content not found</p>
          <Button asChild>
            <Link to="/library">Back to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  const language = (content.language as Language) || 'en';
  const labels = uiLabels[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild>
            <Link to={`/library/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {labels.backToContent}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
            <Layers className="h-6 w-6" />
            {labels.title}
          </h1>
        </div>

        {flashcards.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{labels.noCards}</p>
          </Card>
        ) : (
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-primary flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {labels.title}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {labels.card} {currentIndex + 1} {labels.of} {flashcards.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Flashcard - Larger */}
              <div 
                className="relative cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className={`relative w-full min-h-[350px] transition-transform duration-500 transform-style-preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <p className="text-xl font-medium text-center">{currentCard?.front}</p>
                    <p className="text-sm text-muted-foreground mt-6">{labels.flip}</p>
                  </div>
                  
                  {/* Back */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-accent/20 rounded-xl p-8 flex flex-col items-center justify-center"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <p className="text-xl text-center">{currentCard?.back}</p>
                    <p className="text-sm text-muted-foreground mt-6">{labels.flip}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" size="lg" onClick={handlePrev}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Button variant="ghost" size="lg" onClick={handleRestart}>
                  <RotateCcw className="h-5 w-5 mr-2" />
                  {labels.restart}
                </Button>
                
                <Button variant="outline" size="lg" onClick={handleNext}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 flex-wrap">
                {flashcards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => { setCurrentIndex(index); setIsFlipped(false); }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FlashcardsPage;
