import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Settings, Sparkles, Loader2, LogOut, BookOpen, CreditCard, User as UserIcon, Lock } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { AnalysisOutput } from "@/components/AnalysisOutput";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const uiLabels = {
  en: {
    title: 'Aide',
    subtitle: 'Structured AI Study Engine',
    placeholder: 'Paste your text here to analyze...',
    analyze: 'Analyze Text',
    usage: 'Analyses Left Today:',
    analyzing: 'Analyzing...',
    signOut: 'Sign Out',
    errorNoInput: 'Please enter text or attach a file to analyze',
    freeTierUsage: 'Free Tier Usage',
    remainingAnalyses: 'free analyses remaining today',
    limitReached: "You've reached your daily limit",
    dailyLimitReached: 'Daily Limit Reached',
    upgradeDesc: 'You\'ve used all free analyses for today. Upgrade to Pro for unlimited access!',
    upgradeToPro: 'Upgrade to Pro',
    attach: 'Attach PDF/Image',
    fileAttached: 'File Attached',
    courseMode: 'Course Mode',
    upgradeToContinue: 'Upgrade to Continue',
    library: 'Library',
    upgrade: 'Upgrade',
    profile: 'Profile',
    of: 'of'
  },
  ru: {
    title: 'Aide',
    subtitle: 'Структурированный ИИ-движок для обучения',
    placeholder: 'Вставьте текст для анализа...',
    analyze: 'Анализировать текст',
    usage: 'Анализов осталось сегодня:',
    analyzing: 'Анализируем...',
    signOut: 'Выйти',
    errorNoInput: 'Введите текст или прикрепите файл для анализа',
    freeTierUsage: 'Использование бесплатного тарифа',
    remainingAnalyses: 'бесплатных анализов осталось сегодня',
    limitReached: 'Вы достигли дневного лимита',
    dailyLimitReached: 'Дневной лимит исчерпан',
    upgradeDesc: 'Вы использовали все бесплатные анализы на сегодня. Обновитесь до Pro для неограниченного доступа!',
    upgradeToPro: 'Обновить до Pro',
    attach: 'Прикрепить PDF/Изображение',
    fileAttached: 'Файл прикреплен',
    courseMode: 'Курсовой режим',
    upgradeToContinue: 'Обновитесь для продолжения',
    library: 'Библиотека',
    upgrade: 'Обновить',
    profile: 'Профиль',
    of: 'из'
  },
  hy: {
    title: 'Aide',
    subtitle: 'Կառուցվածքային ԱԲ Ուսումնական Շարժիչ',
    placeholder: 'Տեքստը տեղադրեք այստեղ վերլուծության համար...',
    analyze: 'Վերլուծել տեքստը',
    usage: 'Մնացել է վերլուծություն այսօր:',
    analyzing: 'Վերլուծում...',
    signOut: 'Դուրս գալ',
    errorNoInput: 'Խնդրում ենք մուտքագրել տեքստ կամ կցել ֆայլ վերլուծության համար',
    freeTierUsage: 'Անվճար տարբերակի օգտագործում',
    remainingAnalyses: 'անվճար վերլուծություն է մնացել այսօր',
    limitReached: 'Դուք հասել եք ձեր օրական սահմանաչափին',
    dailyLimitReached: 'Օրական սահմանաչափը լրացել է',
    upgradeDesc: 'Դուք օգտագործել եք բոլոր անվճար վերլուծությունները այսօր: Թարմացրեք Pro-ի անսահմանափակ հասանելիության համար:',
    upgradeToPro: 'Թարմացնել Pro',
    attach: 'Կցել PDF/Պատկեր',
    fileAttached: 'Ֆայլը կցված է',
    courseMode: 'Դասընթացի ռեժիմ',
    upgradeToContinue: 'Թարմացրեք շարունակելու համար',
    library: 'Գրադարան',
    upgrade: 'Թարմացնել',
    profile: 'Պրոֆիլ',
    of: '/' // using clean separator or 'hy' correct form 'ից' but logic is formatted {count} of {limit}.
  },
  ko: {
    title: 'Aide',
    subtitle: 'AI 기반 학습 엔진',
    placeholder: '분석할 텍스트를 여기에 붙여넣으세요...',
    analyze: '텍스트 분석',
    usage: '오늘 남은 분석:',
    analyzing: '분석 중...',
    signOut: '로그아웃',
    errorNoInput: '분석할 텍스트를 입력하거나 파일을 첨부하세요',
    freeTierUsage: '무료 요금제 사용량',
    remainingAnalyses: '회의 무료 분석이 남았습니다',
    limitReached: '일일 한도에 도달했습니다',
    dailyLimitReached: '일일 한도 도달',
    upgradeDesc: '오늘의 무료 분석을 모두 사용했습니다. 무제한 액세스를 위해 Pro로 업그레이드하세요!',
    upgradeToPro: 'Pro로 업그레이드',
    attach: 'PDF/이미지 첨부',
    fileAttached: '파일 첨부됨',
    courseMode: '코스 모드',
    upgradeToContinue: '계속하려면 업그레이드',
    library: '라이브러리',
    upgrade: '업그레이드',
    profile: '프로필',
    of: '/'
  }
};


const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PRO = 50;

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const { language, theme, setLanguage, setTheme, isLoaded: settingsLoaded } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [text, setText] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [media, setMedia] = useState<{ data: string; mimeType: string } | null>(null);
  const [isCourseMode, setIsCourseMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [usageCount, setUsageCount] = useState(1);
  const [dailyLimit, setDailyLimit] = useState(DAILY_LIMIT_FREE);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'class'>('free');
  const [isLocked, setIsLocked] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setMedia({ data: base64String, mimeType: file.type });
        toast({ title: "File attached", description: file.name });
      };
      reader.readAsDataURL(file);
    }
  };
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

  // Check for success parameter from Gumroad redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
      toast({
        title: "Success!",
        description: "Your subscription is now active. Refreshing your account...",
      });
      // Refresh usage count and subscription status
      if (user) {
        fetchUsageCount(user.id);
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, toast]);

  const fetchUsageCount = async (userId: string) => {
    try {
      // First, get user's subscription plan
      const { data: subData } = await (supabase as any)
        .from('subscriptions')
        .select('status, plan_type, expires_at')
        .eq('user_id', userId)
        .single();

      let plan: 'free' | 'pro' | 'class' = 'free';
      if (subData) {
        const isActive = subData.status === 'active' &&
          ['pro', 'class'].includes(subData.plan_type) &&
          (!subData.expires_at || new Date(subData.expires_at) > new Date());
        if (isActive) {
          plan = subData.plan_type as 'pro' | 'class';
        }
      }
      setUserPlan(plan);

      // Class tier has unlimited - no limits
      if (plan === 'class') {
        setDailyLimit(Infinity);
        setUsageCount(Infinity);
        setIsLocked(false);
        return;
      }

      // Set daily limit based on plan
      const limit = plan === 'pro' ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;
      setDailyLimit(limit);

      // Get usage count
      const { data, error } = await supabase.rpc('get_daily_usage_count', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching usage count:', error);
        return;
      }

      const remaining = Math.max(0, limit - (data || 0));
      setUsageCount(remaining);
      const locked = remaining <= 0;
      setIsLocked(locked);
      // Show upgrade modal when limit is reached (only for free users)
      if (locked && plan === 'free') {
        setShowUpgradeModal(true);
      }
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

    if (!text.trim() && !media) {
      toast({
        title: language === 'en' ? 'Error' : language === 'ru' ? 'Ошибка' : language === 'hy' ? 'Սխալ' : '오류',
        description: labels.errorNoInput,
        variant: 'destructive'
      });
      return;
    }

    if (usageCount <= 0) {
      toast({
        title: language === 'en' ? 'Limit Reached' : language === 'ru' ? 'Лимит достигнут' : language === 'hy' ? 'Սdelays' : '한도 도달',
        description: language === 'en' ? `You have reached your daily limit of ${dailyLimit} analyses` : language === 'ru' ? `Вы достигли дневного лимита в ${dailyLimit} анализов` : language === 'hy' ? `Delays ${dailyLimit}` : `일일 ${dailyLimit}회 분석 한도에 도달했습니다`,
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-text', {
        body: {
          text,
          media, // Multi-modal support
          isCourse: isCourseMode
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to analyze content');
      }

      if (!data) {
        throw new Error('No data returned from analysis');
      }

      setAnalysisData(data);
      setMedia(null); // Clear media after successful analysis

      // Refetch usage count from server to get accurate value
      if (user) {
        await fetchUsageCount(user.id);
      }

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
        title: language === 'en' ? 'Great job!' : language === 'ru' ? 'Отлично!' : language === 'hy' ? 'Հիանալի է!' : '훌륭합니다!',
        description: language === 'en' ? "You're mastering this subject. Keep it up!" : language === 'ru' ? 'Вы осваиваете этот предмет. Продолжайте в том же духе!' : language === 'hy' ? 'Դուք տիրապետում եք այս առարկային: Շարունակեք այդպես!' : '이 주제를 잘 이해하고 있습니다. 계속 노력하세요!'
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-in fade-in-50 slide-in-from-top-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {labels.title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{labels.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button variant="ghost" asChild size="sm" className="text-xs sm:text-sm">
              <Link to="/library">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{labels.library}</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild size="sm" className="text-xs sm:text-sm">
              <Link to="/billing">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{labels.upgrade}</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild size="sm" className="text-xs sm:text-sm">
              <Link to="/settings">
                <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{labels.profile}</span>
              </Link>
            </Button>
            <Card className="px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm">
              <p className="text-xs sm:text-sm text-muted-foreground">{labels.usage}</p>
              <p className={`text-lg sm:text-2xl font-bold ${usageCount === 0 && userPlan === 'free' ? 'text-destructive' : 'text-primary'}`}>
                {userPlan === 'class' ? '∞' : `${usageCount}/${dailyLimit}`}
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
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth");
              }}
              className="text-xs sm:text-sm"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{labels.signOut}</span>
            </Button>
          </div>
        </header>

        {/* Usage Meter - Prominent Display */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1">
                {userPlan === 'free' ? labels.freeTierUsage : userPlan === 'pro' ? 'Pro Plan' : 'Class Plan'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {userPlan === 'class' 
                  ? 'Unlimited analyses'
                  : usageCount > 0
                    ? `${usageCount} ${labels.of} ${dailyLimit} ${labels.remainingAnalyses}`
                    : labels.limitReached}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className={`text-2xl sm:text-4xl font-bold ${usageCount === 0 && userPlan === 'free' ? 'text-destructive' : 'text-primary'}`}>
                {userPlan === 'class' ? '∞' : `${usageCount}/${dailyLimit}`}
              </div>
            </div>
          </div>
        </Card>

        {/* Locked State - Conversion CTA */}
        {isLocked && (
          <Card className="p-8 mb-8 bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/20">
            <div className="text-center space-y-4">
              <Lock className="h-16 w-16 mx-auto text-destructive" />
              <h2 className="text-2xl font-bold">{labels.dailyLimitReached}</h2>
              <p className="text-muted-foreground">
                {labels.upgradeDesc}
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent">
                <Link to="/billing">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {labels.upgradeToPro}
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Input Area */}
        <Card className={`p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 ${isLocked ? 'opacity-50' : ''}`}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="media-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('media-upload')?.click()}
                  className="gap-2"
                  disabled={isLocked}
                >
                  <Sparkles className="h-4 w-4" />
                  {labels.attach}
                </Button>
                {media && <Badge variant="secondary">{labels.fileAttached}</Badge>}
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="course-mode">{labels.courseMode}</Label>
                <input
                  type="checkbox"
                  id="course-mode"
                  checked={isCourseMode}
                  onChange={(e) => setIsCourseMode(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <Textarea
              placeholder={isLocked ? labels.upgradeToContinue : labels.placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px] sm:min-h-[200px] text-sm sm:text-base resize-none"
              disabled={isLocked}
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!text.trim() && !media) || isLocked}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md"
              size="lg"
            >
              {isLocked ? (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  {labels.upgradeToContinue}
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

        {/* Premium Upgrade Modal */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          language={language}
        />
      </div>
    </div>
  );
};

export default Dashboard;