import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Settings, Sparkles, Loader2, LogOut, BookOpen, CreditCard, User as UserIcon, Lock } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { AnalysisOutput } from "@/components/AnalysisOutput";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type Language = 'en' | 'ru' | 'hy' | 'ko';
type Theme = 'light' | 'dark';

const uiLabels = {
  en: {
    title: 'Aide',
    subtitle: 'Structured AI Study Engine',
    placeholder: 'Paste your text here to analyze...',
    analyze: 'Analyze Text',
    usage: 'Analyses Left Today:',
    analyzing: 'Analyzing...',
    signOut: 'Sign Out'
  },
  ru: {
    title: 'Aide',
    subtitle: 'Структурированный ИИ-движок для обучения',
    placeholder: 'Вставьте текст для анализа...',
    analyze: 'Анализировать текст',
    usage: 'Анализов осталось сегодня:',
    analyzing: 'Анализируем...',
    signOut: 'Выйти'
  },
  hy: {
    title: 'Aide',
    subtitle: 'Կառուցվածքային ԱԲ Ուսումնական Շարժիչ',
    placeholder: 'Տեքստը տեղադրեք այստեղ վերլուծության համար...',
    analyze: 'Վերլուծել տեքստը',
    usage: 'Մնացել է վերլուծություն այսօր:',
    analyzing: 'Վերլուծում...',
    signOut: 'Դուրս գալ'
  },
  ko: {
    title: 'Aide',
    subtitle: 'AI 기반 학습 엔진',
    placeholder: '분석할 텍스트를 여기에 붙여넣으세요...',
    analyze: '텍스트 분석',
    usage: '오늘 남은 분석:',
    analyzing: '분석 중...',
    signOut: '로그아웃'
  }
};

const DAILY_LIMIT = 5; // Freemium limit: 5 free uses per day

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [text, setText] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [usageCount, setUsageCount] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const labels = uiLabels[language];

  useEffect(() => {
    // Check if Supabase is properly configured
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      console.warn('Supabase not configured - redirecting to auth');
      navigate("/auth");
      return;
    }

    // Set up auth state listener
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        // Fetch usage count when user changes
        setTimeout(() => {
          fetchUsageCount(session.user.id);
        }, 0);
      }
    });
      subscription = sub;
    } catch (err) {
      console.error('Failed to set up auth state listener:', err);
      navigate("/auth");
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        navigate("/auth");
        return;
      }
      
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        fetchUsageCount(session.user.id);
      }
    }).catch((err) => {
      console.error('Failed to get session:', err);
      navigate("/auth");
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const fetchUsageCount = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_daily_usage_count', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching usage count:', error);
        return;
      }

      const remaining = Math.max(0, DAILY_LIMIT - (data || 0));
      setUsageCount(remaining);
      setIsLocked(remaining <= 0);
    } catch (error) {
      console.error('Error fetching usage count:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to analyze text",
        variant: "destructive"
      });
      return;
    }

    if (!text.trim()) {
      toast({
        title: language === 'en' ? 'Error' : language === 'ru' ? 'Ошибка' : language === 'hy' ? 'Սխալ' : '오류',
        description: language === 'en' ? 'Please enter text to analyze' : language === 'ru' ? 'Пожалуйста, введите текст для анализа' : language === 'hy' ? 'Խնդրում ենք մուտքագրել տեքստ վերլուծության համար' : '분석할 텍스트를 입력하세요',
        variant: 'destructive'
      });
      return;
    }

    if (usageCount <= 0) {
      toast({
        title: language === 'en' ? 'Limit Reached' : language === 'ru' ? 'Лимит достигнут' : language === 'hy' ? 'Սահմանաչափը լրացել է' : '한도 도달',
        description: language === 'en' ? `You have reached your daily limit of ${DAILY_LIMIT} analyses` : language === 'ru' ? `Вы достигли дневного лимита в ${DAILY_LIMIT} анализов` : language === 'hy' ? `Դուք հասել եք ձեր օրական ${DAILY_LIMIT} վերլուծության սահմանաչափին` : `일일 ${DAILY_LIMIT}회 분석 한도에 도달했습니다`,
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-text', {
        body: { text }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to analyze text');
      }

      if (!data) {
        throw new Error('No data returned from analysis');
      }

      // Log usage
      const { error: logError } = await supabase
        .from('usage_logs')
        .insert({
          user_id: user.id,
          action_type: 'text_analysis'
        });

      if (logError) {
        console.error('Error logging usage:', logError);
      }

      setAnalysisData(data);
      const newCount = Math.max(0, usageCount - 1);
      setUsageCount(newCount);
      setIsLocked(newCount <= 0);
      
      // Save to user_content archive
      if (user) {
        try {
          await (supabase as any).from('user_content').insert({
            user_id: user.id,
            original_text: text,
            analysis_data: data,
            language: language,
            title: text.substring(0, 50) + (text.length > 50 ? '...' : '')
          });
        } catch (saveError) {
          console.error('Error saving to archive:', saveError);
          // Non-critical, don't show error to user
        }
      }
      
      toast({
        title: language === 'en' ? 'Success!' : language === 'ru' ? 'Успешно!' : language === 'hy' ? 'Հաջողություն!' : '성공!',
        description: language === 'en' ? 'Text analyzed successfully' : language === 'ru' ? 'Текст успешно проанализирован' : language === 'hy' ? 'Տեքստը հաջողությամբ վերլուծվել է' : '텍스트가 성공적으로 분석되었습니다'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: language === 'en' ? 'Error' : language === 'ru' ? 'Ошибка' : language === 'hy' ? 'Սխալ' : '오류',
        description: error instanceof Error ? error.message : 'Failed to analyze text',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-in fade-in-50 slide-in-from-top-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {labels.title}
            </h1>
            <p className="text-muted-foreground mt-1">{labels.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/library">
                <BookOpen className="h-4 w-4 mr-2" />
                Library
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/settings">
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Card className="px-4 py-2 shadow-sm">
              <p className="text-sm text-muted-foreground">{labels.usage}</p>
              <p className={`text-2xl font-bold ${usageCount === 0 ? 'text-destructive' : 'text-primary'}`}>
                {usageCount}/{DAILY_LIMIT}
              </p>
            </Card>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="shadow-sm"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title={labels.signOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Usage Meter - Prominent Display */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Free Tier Usage</h3>
              <p className="text-sm text-muted-foreground">
                {usageCount > 0 
                  ? `${usageCount} of ${DAILY_LIMIT} free analyses remaining today`
                  : 'You\'ve reached your daily limit'}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${usageCount === 0 ? 'text-destructive' : 'text-primary'}`}>
                {usageCount}/{DAILY_LIMIT}
              </div>
            </div>
          </div>
        </Card>

        {/* Locked State - Conversion CTA */}
        {isLocked && (
          <Card className="p-8 mb-8 bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/20">
            <div className="text-center space-y-4">
              <Lock className="h-16 w-16 mx-auto text-destructive" />
              <h2 className="text-2xl font-bold">Daily Limit Reached</h2>
              <p className="text-muted-foreground">
                You've used all {DAILY_LIMIT} free analyses for today. Upgrade to Pro for unlimited access!
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent">
                <Link to="/billing">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Upgrade to Pro
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Input Area */}
        <Card className={`p-6 mb-8 shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 ${isLocked ? 'opacity-50' : ''}`}>
          <div className="space-y-4">
            <Textarea
              placeholder={isLocked ? "Upgrade to Pro to continue analyzing..." : labels.placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] text-base resize-none"
              disabled={isLocked}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !text.trim() || isLocked}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md"
              size="lg"
            >
              {isLocked ? (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  Upgrade to Continue
                </>
              ) : isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {labels.analyzing}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {labels.analyze}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output Area */}
        {analysisData && (
          <AnalysisOutput data={analysisData} language={language} />
        )}

        {/* Settings Modal */}
        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeChange={setTheme}
        />
      </div>
    </div>
  );
};

export default Dashboard;