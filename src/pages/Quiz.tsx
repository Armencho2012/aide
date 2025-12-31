import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
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
    title: 'Practice Quiz',
    questionPrefix: 'Question',
    checkAnswer: 'Check Answer',
    retry: 'Try Again',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    explanation: 'Explanation',
    noQuestions: 'No quiz questions available',
    backToContent: 'Back to Content'
  },
  ru: {
    title: 'Практический Тест',
    questionPrefix: 'Вопрос',
    checkAnswer: 'Проверить ответ',
    retry: 'Попробовать снова',
    correct: 'Правильно!',
    incorrect: 'Неправильно',
    explanation: 'Объяснение',
    noQuestions: 'Вопросы недоступны',
    backToContent: 'Назад к контенту'
  },
  hy: {
    title: 'Փdelays delays',
    questionPrefix: 'Հарdelays',
    checkAnswer: ' Delays delays delays',
    retry: 'ک delays delays',
    correct: 'Delays delays!',
    incorrect: 'Delays',
    explanation: 'Delays delays',
    noQuestions: 'Delays delays delays delays',
    backToContent: 'Delays delays delays'
  },
  ko: {
    title: '연습 퀴즈',
    questionPrefix: '문항',
    checkAnswer: '답변 확인',
    retry: '다시 시도',
    correct: '정답입니다!',
    incorrect: '오답입니다',
    explanation: '설명',
    noQuestions: '퀴즈 문제가 없습니다',
    backToContent: '콘텐츠로 돌아가기'
  }
};

const Quiz = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionStates, setQuestionStates] = useState<{ selectedAnswer: number | null; showResult: boolean }[]>([]);
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
      
      const analysisData = data?.analysis_data as any;
      const quizQuestions = analysisData?.quiz_questions || [];
      setQuestionStates(quizQuestions.map(() => ({ selectedAnswer: null, showResult: false })));
    } catch (error) {
      console.error('Error fetching content:', error);
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setQuestionStates((prev) =>
      prev.map((state, idx) => (idx === questionIndex ? { ...state, selectedAnswer: optionIndex } : state))
    );
  };

  const handleCheckAnswer = (questionIndex: number) => {
    setQuestionStates((prev) =>
      prev.map((state, idx) => (idx === questionIndex ? { ...state, showResult: state.selectedAnswer !== null } : state))
    );
  };

  const handleRetry = (questionIndex: number) => {
    setQuestionStates((prev) =>
      prev.map((state, idx) => (idx === questionIndex ? { selectedAnswer: null, showResult: false } : state))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quiz...</p>
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
  const quizQuestions: QuizQuestion[] = content.analysis_data?.quiz_questions || [];

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {labels.title}
          </h1>
        </div>

        {quizQuestions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{labels.noQuestions}</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {quizQuestions.map((question, questionIndex) => {
              const questionState = questionStates[questionIndex];
              const selectedAnswer = questionState?.selectedAnswer ?? null;
              const showResult = questionState?.showResult ?? false;
              const isCorrect = selectedAnswer !== null && selectedAnswer === question.correct_answer_index;

              return (
                <Card key={questionIndex} className="border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {labels.questionPrefix} {questionIndex + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="font-medium text-lg leading-relaxed">{question.question}</p>

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() => !showResult && handleSelectOption(questionIndex, optionIndex)}
                          disabled={showResult}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            selectedAnswer === optionIndex
                              ? showResult
                                ? isCorrect
                                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                  : 'border-red-500 bg-red-50 dark:bg-red-950'
                                : 'border-primary bg-secondary'
                              : 'border-border hover:border-primary/50'
                          } ${showResult && optionIndex === question.correct_answer_index ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {showResult && optionIndex === question.correct_answer_index && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                            {showResult && selectedAnswer === optionIndex && !isCorrect && (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {!showResult ? (
                        <Button
                          onClick={() => handleCheckAnswer(questionIndex)}
                          disabled={selectedAnswer === null}
                          className="w-full sm:flex-1"
                        >
                          {labels.checkAnswer}
                        </Button>
                      ) : (
                        <>
                          <div className={`w-full sm:flex-1 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                            <p className={`font-bold mb-2 ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                              {isCorrect ? labels.correct : labels.incorrect}
                            </p>
                            <p className="text-sm leading-relaxed">
                              <strong>{labels.explanation}:</strong> {question.explanation}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleRetry(questionIndex)}
                            variant="outline"
                            className="w-full sm:flex-[0.4]"
                          >
                            {labels.retry}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
