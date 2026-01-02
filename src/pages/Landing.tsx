import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Globe, Zap, Shield, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { SettingsModal } from "@/components/SettingsModal";

type Language = 'en' | 'ru' | 'hy' | 'ko';
type Theme = 'light' | 'dark';

const uiLabels = {
  en: {
    subtitle: 'Structured AI Study Engine',
    description: 'Transform any text into comprehensive learning materials with AI-powered analysis, key summaries, vocabulary extraction, and practice quizzes in multiple languages.',
    getStarted: 'Get Started Free',
    signIn: 'Sign In',
    featuresTitle: 'Powerful Features for Smarter Learning',
    aiAnalysis: {
      title: 'AI-Powered Analysis',
      description: 'Advanced AI technology extracts key insights, summaries, and learning points from any text instantly.'
    },
    multilingual: {
      title: 'Multilingual Support',
      description: 'Learn in English, Russian, Armenian, or Korean with seamless language switching and translation.'
    },
    instantResults: {
      title: 'Instant Results',
      description: 'Get comprehensive study materials in seconds. No waiting, no manual work required.'
    },
    smartVocabulary: {
      title: 'Smart Vocabulary',
      description: 'Automatically extract and define key terms and concepts with contextual meanings.'
    },
    practiceQuizzes: {
      title: 'Practice Quizzes',
      description: 'Generate custom quizzes automatically to test your understanding and retention.'
    },
    structuredLearning: {
      title: 'Structured Learning',
      description: 'Organized output with clear sections: summary, key points, vocabulary, and quiz questions.'
    },
    howItWorksTitle: 'How Aide Works',
    step1: {
      title: 'Paste Your Text',
      description: 'Copy and paste any article, study material, or document you want to learn from.'
    },
    step2: {
      title: 'AI Analysis',
      description: 'Our AI engine processes your text, extracting key information and creating structured learning materials.'
    },
    step3: {
      title: 'Learn & Practice',
      description: 'Review summaries, study vocabulary, and test yourself with auto-generated quizzes.'
    },
    ctaTitle: 'Ready to Transform Your Learning?',
    ctaDescription: 'Start with 5 free analyses per day. No credit card required.',
    startLearning: 'Start Learning Now',
    footer: '© 2025 Aide. Empowering learners with AI-driven study tools.'
  },
  ru: {
    subtitle: 'Структурированный ИИ-движок для обучения',
    description: 'Преобразуйте любой текст в комплексные учебные материалы с помощью анализа на основе ИИ, ключевых резюме, извлечения словарного запаса и практических викторин на нескольких языках.',
    getStarted: 'Начать бесплатно',
    signIn: 'Войти',
    featuresTitle: 'Мощные функции для умного обучения',
    aiAnalysis: {
      title: 'Анализ на основе ИИ',
      description: 'Передовые технологии ИИ мгновенно извлекают ключевые идеи, резюме и учебные моменты из любого текста.'
    },
    multilingual: {
      title: 'Многоязычная поддержка',
      description: 'Изучайте на английском, русском, армянском или корейском языках с бесшовным переключением языков и переводом.'
    },
    instantResults: {
      title: 'Мгновенные результаты',
      description: 'Получайте комплексные учебные материалы за секунды. Без ожидания, без ручной работы.'
    },
    smartVocabulary: {
      title: 'Умный словарь',
      description: 'Автоматически извлекайте и определяйте ключевые термины и концепции с контекстными значениями.'
    },
    practiceQuizzes: {
      title: 'Практические викторины',
      description: 'Автоматически создавайте индивидуальные викторины для проверки вашего понимания и запоминания.'
    },
    structuredLearning: {
      title: 'Структурированное обучение',
      description: 'Организованный вывод с четкими разделами: резюме, ключевые моменты, словарь и вопросы викторины.'
    },
    howItWorksTitle: 'Как работает Aide',
    step1: {
      title: 'Вставьте ваш текст',
      description: 'Скопируйте и вставьте любую статью, учебный материал или документ, из которого вы хотите учиться.'
    },
    step2: {
      title: 'Анализ ИИ',
      description: 'Наш ИИ-движок обрабатывает ваш текст, извлекая ключевую информацию и создавая структурированные учебные материалы.'
    },
    step3: {
      title: 'Изучайте и практикуйтесь',
      description: 'Просматривайте резюме, изучайте словарь и проверяйте себя с помощью автоматически созданных викторин.'
    },
    ctaTitle: 'Готовы преобразить ваше обучение?',
    ctaDescription: 'Начните с 5 бесплатных анализов в день. Кредитная карта не требуется.',
    startLearning: 'Начать обучение сейчас',
    footer: '© 2025 Aide. Расширяем возможности учащихся с помощью инструментов для обучения на основе ИИ.'
  },
  hy: {
    subtitle: 'Structured AI Study Engine',
    description: 'Transform any text into comprehensive learning materials with AI-powered analysis, key summaries, vocabulary extraction, and practice quizzes.',
    getStarted: 'Start Free',
    signIn: 'Sign In',
    featuresTitle: 'Powerful Features for Smarter Learning',
    aiAnalysis: {
      title: 'AI-Powered Analysis',
      description: 'Advanced AI technology extracts key insights, summaries, and learning points from any text instantly.'
    },
    multilingual: {
      title: 'Multilingual Support',
      description: 'Learn in English, Russian, Armenian, or Korean with seamless language switching and translation.'
    },
    instantResults: {
      title: 'Instant Results',
      description: 'Get comprehensive study materials in seconds. No waiting, no manual work required.'
    },
    smartVocabulary: {
      title: 'Smart Vocabulary',
      description: 'Automatically extract and define key terms and concepts with contextual meanings.'
    },
    practiceQuizzes: {
      title: 'Practice Quizzes',
      description: 'Automatically generate custom quizzes to test your understanding and retention.'
    },
    structuredLearning: {
      title: 'Structured Learning',
      description: 'Organized output with clear sections: summary, key points, vocabulary, and quiz questions.'
    },
    howItWorksTitle: 'How Aide Works',
    step1: {
      title: 'Paste Your Text',
      description: 'Copy and paste any article, study material, or document you want to learn from.'
    },
    step2: {
      title: 'AI Analysis',
      description: 'Our AI engine processes your text, extracting key information and creating structured learning materials.'
    },
    step3: {
      title: 'Learn & Practice',
      description: 'Review summaries, study vocabulary, and test yourself with auto-generated quizzes.'
    },
    ctaTitle: 'Ready to Transform Your Learning?',
    ctaDescription: 'Start with 5 free analyses per day. No credit card required.',
    startLearning: 'Start Learning Now',
    footer: '© 2025 Aide. Empowering learners with AI-driven study tools.'
  },
  ko: {
    subtitle: 'AI 기반 학습 엔진',
    description: 'AI 기반 분석, 주요 요약, 어휘 추출, 다국어 연습 퀴즈를 통해 모든 텍스트를 포괄적인 학습 자료로 변환하세요.',
    getStarted: '무료로 시작하기',
    signIn: '로그인',
    featuresTitle: '더 스마트한 학습을 위한 강력한 기능',
    aiAnalysis: {
      title: 'AI 기반 분석',
      description: '고급 AI 기술이 모든 텍스트에서 주요 인사이트, 요약 및 학습 포인트를 즉시 추출합니다.'
    },
    multilingual: {
      title: '다국어 지원',
      description: '영어, 러시아어, 아르메니아어 또는 한국어로 원활한 언어 전환과 번역을 통해 학습하세요.'
    },
    instantResults: {
      title: '즉시 결과',
      description: '몇 초 안에 포괄적인 학습 자료를 받으세요. 대기 시간 없음, 수동 작업 불필요.'
    },
    smartVocabulary: {
      title: '스마트 어휘',
      description: '맥락적 의미와 함께 주요 용어와 개념을 자동으로 추출하고 정의합니다.'
    },
    practiceQuizzes: {
      title: '연습 퀴즈',
      description: '이해도와 기억력을 테스트하기 위해 자동으로 맞춤형 퀴즈를 생성합니다.'
    },
    structuredLearning: {
      title: '구조화된 학습',
      description: '요약, 주요 포인트, 어휘 및 퀴즈 질문으로 명확한 섹션이 있는 체계적인 출력.'
    },
    howItWorksTitle: 'Aide 작동 방식',
    step1: {
      title: '텍스트 붙여넣기',
      description: '학습하고 싶은 기사, 학습 자료 또는 문서를 복사하여 붙여넣으세요.'
    },
    step2: {
      title: 'AI 분석',
      description: 'AI 엔진이 텍스트를 처리하여 주요 정보를 추출하고 구조화된 학습 자료를 생성합니다.'
    },
    step3: {
      title: '학습 및 연습',
      description: '요약을 검토하고, 어휘를 공부하고, 자동 생성된 퀴즈로 자신을 테스트하세요.'
    },
    ctaTitle: '학습을 변화시킬 준비가 되셨나요?',
    ctaDescription: '일 5회 무료 분석으로 시작하세요. 신용 카드 불필요.',
    startLearning: '지금 학습 시작하기',
    footer: '© 2025 Aide. AI 기반 학습 도구로 학습자를 강화합니다.'
  }
};

const Landing = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const labels = uiLabels[language];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-4 pt-8">
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="shadow-sm"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <header className="container max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="animate-in fade-in-50 slide-in-from-bottom-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Aide
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">{labels.subtitle}</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{labels.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg">
              <Link to="/auth">{labels.getStarted}<ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-md">
              <Link to="/auth">{labels.signIn}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{labels.featuresTitle}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Sparkles className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">{labels.aiAnalysis.title}</h3>
            <p className="text-muted-foreground">{labels.aiAnalysis.description}</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Globe className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">{labels.multilingual.title}</h3>
            <p className="text-muted-foreground">{labels.multilingual.description}</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Zap className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">{labels.instantResults.title}</h3>
            <p className="text-muted-foreground">{labels.instantResults.description}</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Shield className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">{labels.smartVocabulary.title}</h3>
            <p className="text-muted-foreground">{labels.smartVocabulary.description}</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Clock className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">{labels.practiceQuizzes.title}</h3>
            <p className="text-muted-foreground">{labels.practiceQuizzes.description}</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Sparkles className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">{labels.structuredLearning.title}</h3>
            <p className="text-muted-foreground">{labels.structuredLearning.description}</p>
          </Card>
        </div>
      </section>

      <section className="container max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{labels.howItWorksTitle}</h2>
        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{labels.step1.title}</h3>
                <p className="text-muted-foreground">{labels.step1.description}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{labels.step2.title}</h3>
                <p className="text-muted-foreground">{labels.step2.description}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{labels.step3.title}</h3>
                <p className="text-muted-foreground">{labels.step3.description}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <Card className="p-12 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{labels.ctaTitle}</h2>
          <p className="text-lg text-muted-foreground mb-8">{labels.ctaDescription}</p>
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg">
            <Link to="/auth">{labels.startLearning}<ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </Card>
      </section>

      <footer className="container max-w-6xl mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>{labels.footer}</p>
      </footer>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        showPlanStatus={false}
        showDeleteAccount={false}
      />
    </div>
  );
};

export default Landing;
