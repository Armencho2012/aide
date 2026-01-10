import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Globe, Zap, Shield, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { SettingsModal } from "@/components/SettingsModal";
import { useSettings } from "@/hooks/useSettings";

type Language = 'en' | 'ru' | 'hy' | 'ko';
type Theme = 'light' | 'dark';

const uiLabels = {
  en: {
    subtitle: 'Your AI-Powered Study Companion',
    description: 'Turn any text into bite-sized lessons, flashcards, and quizzes in seconds. Master concepts faster with intelligent summaries and spaced repetition.',
    getStarted: 'Start Learning Free',
    signIn: 'Sign In',
    featuresTitle: 'Everything You Need to Learn Smarter',
    aiAnalysis: {
      title: 'Instant Breakdown',
      description: 'Drop in any text and watch AI distill it into clear summaries, key takeaways, and actionable study notes.'
    },
    multilingual: {
      title: 'Learn in Your Language',
      description: 'Study seamlessly in English, Russian, Armenian, or Korean with native language support.'
    },
    instantResults: {
      title: 'Zero Wait Time',
      description: 'Get complete study materials the moment you paste. No setup, no delays—just learning.'
    },
    smartVocabulary: {
      title: 'Vocabulary Builder',
      description: 'Key terms are automatically highlighted and defined in context so nothing slips by.'
    },
    practiceQuizzes: {
      title: 'Test Yourself',
      description: 'Auto-generated quizzes help you retain what you learn and spot knowledge gaps.'
    },
    structuredLearning: {
      title: 'Organized for Recall',
      description: 'Summaries, sections, terms, and quizzes—all structured so you can review fast.'
    },
    howItWorksTitle: 'Three Steps to Mastery',
    step1: {
      title: '1. Drop Your Text',
      description: 'Paste an article, lecture notes, or any content you want to understand.'
    },
    step2: {
      title: '2. Let AI Work',
      description: 'Our engine extracts the essentials and creates tailored study materials instantly.'
    },
    step3: {
      title: '3. Learn & Retain',
      description: 'Review summaries, practice with quizzes, and lock in knowledge with flashcards.'
    },
    ctaTitle: 'Start Mastering Any Subject Today',
    ctaDescription: '5 free analyses every day. No credit card. No strings attached.',
    startLearning: 'Begin Now',
    footer: '© 2025 Aide. Learn smarter, not harder.'
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
    subtitle: 'Կառուցվածքային AI ուսման շարժիչ',
    description: 'Փոխակերպեք ցանկացած տեքստ համապարփակ ուսումնական նյութերի՝ AI-ով ուժեղացված վերլուծության, կարևոր ամփոփումների, բառապաշարի առանձնացման և պրակտիկ թեստերի միջոցով։',
    getStarted: 'Սկսել անվճար',
    signIn: 'Մուտք',
    featuresTitle: 'Խելացի ուսման համար հզոր հնարավորություններ',
    aiAnalysis: {
      title: 'AI-վերլուծություն',
      description: 'Ուժեղ AI տեխնոլոգիան անմիջապես հանում է գլխավոր պատկերացումները, ամփոփումները և ուսումնական կետերը ցանկացած տեքստից։'
    },
    multilingual: {
      title: 'Բազմալեզու աջակցություն',
      description: 'Սովորեք անգլերեն, ռուսերեն, հայերեն կամ կորեա՝ հարմար լեզվային փոփոխությամբ և թարգմանությամբ։'
    },
    instantResults: {
      title: 'Ամեն վայրկյան արդյունքներ',
      description: 'Ստացեք համապարփակ նյութեր վայրկյանների ընթացքում՝ առանց սպասման կամ ձեռքով աշխատանքների։'
    },
    smartVocabulary: {
      title: 'Խելացի բառապաշար',
      description: 'Ավտոմատ կերպով հանեք և սահմանեք կարևոր տերմինները և հասկացությունները՝ համատեքստային նշանակությամբ։'
    },
    practiceQuizzes: {
      title: 'Պրակտիկ թեստեր',
      description: 'Ընթացքի ընթացքում ավտոմատ ձևով ստեղծեք թեստեր՝ ձեր ըմբռնումը և հիշողությունը ստուգելու համար։'
    },
    structuredLearning: {
      title: 'Կառուցված ուսուցում',
      description: 'Կազմակերպված արդյունք՝ հստակ բաժիններով՝ ամփոփում, հիմնական կետեր, բառապաշար և թեստային հարցեր։'
    },
    howItWorksTitle: 'Ինչպես է աշխատում Aide',
    step1: {
      title: 'Տեքստը տեղադրեք',
      description: 'Պատճենեք և տեղադրեք ցանկացած հոդված, ուսումնական նյութ կամ փաստաթուղթ, որով ցանկանում եք սովորել։'
    },
    step2: {
      title: 'AI վերլուծություն',
      description: 'Մեր AI շարժիչը մշակում է ձեր տեքստը՝ հանելու համար հիմնական տեղեկությունները և ստեղծելու կառուցված ուսումնական նյութեր։'
    },
    step3: {
      title: 'Ուսումնացեք և պրակտիկա արեք',
      description: 'Ստուգեք ամփոփումները, ուսումնասիրեք բառապաշարը և փորձեք ինքներդ՝ ավտոմատ ստեղծված թեստերով։'
    },
    ctaTitle: 'Պատրաստ եք փոխել ձեր ուսումը?',
    ctaDescription: 'Սկսեք օրական 5 անվճար վերլուծությամբ. կրեդիտ քարտը չի պահանջվում.',
    startLearning: 'Սկսեք սովորելը հիմա',
    footer: '© 2025 Aide. Ուժեղացնում ենք սովորողներին՝ AI-ով ղեկավարվող ուսումնական գործիքներով։'
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
  const { language, theme, setLanguage, setTheme } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const labels = uiLabels[language];

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

      {/* Hero Section - Bento Style */}
      <section className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Main Hero Card - Large */}
          <Card className="md:col-span-8 p-8 md:p-12 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border-2 border-primary/30 hover:border-primary/50 transition-all duration-300">
            <div className="animate-in fade-in-50 slide-in-from-bottom-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                Aide
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-foreground mb-3">{labels.subtitle}</p>
              <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl">{labels.description}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg text-base">
                  <Link to="/auth">{labels.getStarted}<ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-md text-base">
                  <Link to="/auth">{labels.signIn}</Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Stats Card - Subtle utility hint */}
          <Card className="md:col-span-4 p-3 md:p-4 bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20 flex flex-col justify-center items-center text-center">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">5</div>
              <p className="text-xs md:text-sm text-muted-foreground">Free Analyses Per Day</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="container max-w-7xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">{labels.featuresTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Large Feature Card */}
          <Card className="lg:col-span-2 p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
            <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-primary mb-4" />
            <h3 className="text-xl md:text-2xl font-bold mb-3">{labels.aiAnalysis.title}</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{labels.aiAnalysis.description}</p>
          </Card>

          {/* Medium Feature Cards */}
          <Card className="p-6 md:p-8 bg-gradient-to-br from-accent/10 to-transparent border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-xl">
            <Globe className="h-10 w-10 md:h-12 md:w-12 text-accent mb-4" />
            <h3 className="text-lg md:text-xl font-bold mb-2">{labels.multilingual.title}</h3>
            <p className="text-sm text-muted-foreground">{labels.multilingual.description}</p>
          </Card>

          <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
            <Zap className="h-10 w-10 md:h-12 md:w-12 text-primary mb-4" />
            <h3 className="text-lg md:text-xl font-bold mb-2">{labels.instantResults.title}</h3>
            <p className="text-sm text-muted-foreground">{labels.instantResults.description}</p>
          </Card>

          {/* Small Feature Cards */}
          <Card className="p-6 bg-gradient-to-br from-accent/10 to-transparent border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-xl">
            <Shield className="h-8 w-8 md:h-10 md:w-10 text-accent mb-3" />
            <h3 className="text-base md:text-lg font-bold mb-2">{labels.smartVocabulary.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">{labels.smartVocabulary.description}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
            <Clock className="h-8 w-8 md:h-10 md:w-10 text-primary mb-3" />
            <h3 className="text-base md:text-lg font-bold mb-2">{labels.practiceQuizzes.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">{labels.practiceQuizzes.description}</p>
          </Card>

          <Card className="lg:col-span-2 p-6 md:p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-start gap-4">
              <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-accent flex-shrink-0" />
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-2">{labels.structuredLearning.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{labels.structuredLearning.description}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works - Bento Style */}
      <section className="container max-w-7xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">{labels.howItWorksTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">1</div>
              <div>
                <h3 className="text-xl font-bold mb-2">{labels.step1.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{labels.step1.description}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 md:p-8 bg-gradient-to-br from-accent/10 to-transparent border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg">2</div>
              <div>
                <h3 className="text-xl font-bold mb-2">{labels.step2.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{labels.step2.description}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-lg">3</div>
              <div>
                <h3 className="text-xl font-bold mb-2">{labels.step3.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{labels.step3.description}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section - Bento Style */}
      <section className="container max-w-7xl mx-auto px-4 py-12 md:py-16">
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 border-2 border-primary/30 hover:border-primary/50 transition-all duration-300 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{labels.ctaTitle}</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{labels.ctaDescription}</p>
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg text-base md:text-lg px-8 py-6">
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
