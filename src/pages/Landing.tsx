import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Globe, Zap, Shield, Clock, Settings, Mail, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { SettingsModal } from "@/components/SettingsModal";
import { useSettings } from "@/hooks/useSettings";
import { motion } from "framer-motion";

type Language = 'en' | 'ru' | 'hy' | 'ko';

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
    ctaDescription: 'Start with 1 free analysis per day. No credit card required.',
    startLearning: 'Start Learning Now',
    footer: '© 2025 Aide. Empowering learners with AI-driven study tools.',
    help: 'Help',
    contact: 'Contact'
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
    ctaDescription: 'Начните с 1 бесплатного анализа в день. Кредитная карта не требуется.',
    startLearning: 'Начать обучение сейчас',
    footer: '© 2025 Aide. Расширяем возможности учащихся с помощью инструментов для обучения на основе ИИ.',
    help: 'Помощь',
    contact: 'Контакт'
  },
  hy: {
    subtitle: 'Կառուցվածքային AI ուսումնական համակարգ',
    description: 'Վերածեք ցանկացած տեքստ համապարփակ ուսումնական նյութերի՝ AI-ի վրա հիմնված վերլուծությամբ, հիմնական ամփոփագրերով, բառապաշարի դուրսբերմամբ և բազմալեզու պրակտիկ թեստերով:',
    getStarted: 'Սկսեք անվճար',
    signIn: 'Մուտք',
    featuresTitle: 'Հզոր հնարավորություններ խելացի ուսուցման համար',
    aiAnalysis: {
      title: 'AI-ով աշխատող վերլուծություն',
      description: 'AI-ի առաջադեմ տեխնոլոգիան ակնթարթորեն դուրս է բերում հիմնական գաղափարները, ամփոփագրերը և ուսումնական կետերը ցանկացած տեքստից:'
    },
    multilingual: {
      title: 'Բազմալեզու աջակցություն',
      description: 'Սովորեք անգլերեն, ռուսերեն, հայերեն կամ կորեերեն՝ լեզուների անխափան փոխարկմամբ և թարգմանությամբ:'
    },
    instantResults: {
      title: 'Ակնթարթային արդյունքներ',
      description: 'Ստացեք համապարփակ ուսումնական նյութեր վայրկյանների ընթացքում: Առանց սպասելու, առանց ձեռքով աշխատանքի:'
    },
    smartVocabulary: {
      title: 'Խելացի բառապաշար',
      description: 'Ավտոմատ կերպով դուրս բերեք և սահմանեք հիմնական տերմիններն ու հասկացությունները՝ համատեքստային իմաստներով:'
    },
    practiceQuizzes: {
      title: 'Պրակտիկ թեստեր',
      description: 'Ավտոմատ կերպով ստեղծեք հատուկ թեստեր՝ ձեր հասկացողությունն ու հիշողությունը ստուգելու համար:'
    },
    structuredLearning: {
      title: 'Կառուցվածքային ուսուցում',
      description: 'Կազմակերպված արդյունք՝ հստակ բաժիններով. ամփոփում, հիմնական կետեր, բառապաշար և հարցաշարի հարցեր:'
    },
    howItWorksTitle: 'Ինչպես է աշխատում Aide-ը',
    step1: {
      title: 'Տեղադրեք ձեր տեքստը',
      description: 'Պատճենեք և տեղադրեք ցանկացած հոդված, ուսումնական նյութ կամ փաստաթուղթ, որից ցանկանում եք սովորել:'
    },
    step2: {
      title: 'AI վերլուծություն',
      description: 'Մեր AI շարժիչը մշակում է ձեր տեքստը՝ դուրս բերելով հիմնական տեղեկատվությունը և ստեղծելով կառուցվածքային ուսումնական նյութեր:'
    },
    step3: {
      title: 'Սովորեք և վարժվեք',
      description: 'Վերանայեք ամփոփագրերը, ուսումնասիրեք բառապաշարը և ստուգեք ինքներդ ձեզ ավտոմատ ստեղծված թեստերով:'
    },
    ctaTitle: 'Պատրա՞ստ եք փոխել ձեր ուսուցումը:',
    ctaDescription: 'Սկսեք օրական 1 անվճար վերլուծությամբ: Վարկային քարտ չի պահանջվում:',
    startLearning: 'Սկսեք սովորել հիմա',
    footer: '© 2025 Aide. Հզորացնելով սովորողներին AI-ի վրա հիմնված ուսումնական գործիքներով:',
    help: 'Օգնություն',
    contact: 'Կապ'
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
    ctaDescription: '일 1회 무료 분석으로 시작하세요. 신용 카드 불필요.',
    startLearning: '지금 학습 시작하기',
    footer: '© 2025 Aide. AI 기반 학습 도구로 학습자를 강화합니다.',
    help: '도움말',
    contact: '연락처'
  }
};

const Landing = () => {
  const { language, theme, setLanguage, setTheme } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const labels = uiLabels[language];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Glassmorphism Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Aide
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex gap-1.5"
            >
              <a href="mailto:Armen.aslikyan@gmail.com">
                <Mail className="h-4 w-4" />
                {labels.contact}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex gap-1.5"
            >
              <Link to="/help">
                <HelpCircle className="h-4 w-4" />
                {labels.help}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="backdrop-blur-sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" variant="default">
              <Link to="/auth">{labels.signIn}</Link>
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section with Animated Gradient */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden">
        {/* Animated multi-color gradient background */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0" 
            style={{ background: 'linear-gradient(135deg, hsl(280 60% 15% / 0.3), hsl(215 30% 12%), hsl(195 50% 15% / 0.3))' }}
          />
          {/* Purple/Pink blob */}
          <motion.div
            className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(280, 80%, 60%, 0.25), hsl(320, 75%, 55%, 0.2))' }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Cyan/Blue blob */}
          <motion.div
            className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(195, 90%, 55%, 0.2), hsl(210, 85%, 55%, 0.15))' }}
            animate={{
              x: [0, -60, 0],
              y: [0, 80, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Orange/Yellow blob */}
          <motion.div
            className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(35, 95%, 55%, 0.25), hsl(15, 90%, 55%, 0.2))' }}
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Green/Teal accent blob */}
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(160, 80%, 50%, 0.15), hsl(180, 75%, 50%, 0.1))' }}
            animate={{
              x: [0, 50, 0],
              y: [0, -40, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Main Hero Content */}
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-8 md:p-12 backdrop-blur-xl bg-card/80 border-2 border-purple-500/30 shadow-2xl">
                <motion.h1
                  className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span 
                    className="bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]"
                    style={{ backgroundImage: 'linear-gradient(90deg, hsl(280, 85%, 60%), hsl(320, 80%, 55%), hsl(35, 95%, 55%), hsl(195, 85%, 55%), hsl(280, 85%, 60%))' }}
                  >
                    Aide
                  </span>
                </motion.h1>
                <motion.p
                  className="text-xl md:text-2xl font-semibold text-foreground mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {labels.subtitle}
                </motion.p>
                <motion.p
                  className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {labels.description}
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="hover:opacity-90 transition-all shadow-lg hover:shadow-xl text-base group text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(280, 80%, 55%), hsl(320, 75%, 55%), hsl(35, 95%, 55%))' }}
                  >
                    <Link to="/auth">
                      {labels.getStarted}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="shadow-md backdrop-blur-sm text-base"
                  >
                    <Link to="/auth">{labels.signIn}</Link>
                  </Button>
                </motion.div>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              className="lg:col-span-5 space-y-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Card className="p-6 backdrop-blur-xl bg-card/80 border border-purple-500/30 text-center">
                <div 
                  className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, hsl(280, 85%, 60%), hsl(320, 80%, 55%))' }}
                >
                  1
                </div>
                <p className="text-sm text-muted-foreground mt-1">Free Analysis Per Day</p>
              </Card>
              <Card className="p-6 backdrop-blur-xl bg-card/80 border border-cyan-500/30 text-center">
                <div 
                  className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, hsl(195, 90%, 55%), hsl(210, 85%, 60%))' }}
                >
                  4
                </div>
                <p className="text-sm text-muted-foreground mt-1">Languages Supported</p>
              </Card>
              <Card className="p-6 backdrop-blur-xl bg-card/80 border border-orange-500/30 text-center">
                <div 
                  className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, hsl(35, 95%, 55%), hsl(15, 90%, 55%))' }}
                >
                  ∞
                </div>
                <p className="text-sm text-muted-foreground mt-1">Learning Possibilities</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="container max-w-7xl mx-auto px-4 py-16 md:py-24">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {labels.featuresTitle}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Large Feature Card - Purple */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full p-6 md:p-8 backdrop-blur-xl bg-card/80 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
              <Sparkles className="h-10 w-10 md:h-12 md:w-12 mb-4 group-hover:scale-110 transition-transform" style={{ color: 'hsl(280, 85%, 60%)' }} />
              <h3 className="text-xl md:text-2xl font-bold mb-3">{labels.aiAnalysis.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{labels.aiAnalysis.description}</p>
            </Card>
          </motion.div>

          {/* Medium Feature Cards - Cyan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full p-6 md:p-8 backdrop-blur-xl bg-card/80 border-2 border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 group">
              <Globe className="h-10 w-10 md:h-12 md:w-12 mb-4 group-hover:scale-110 transition-transform" style={{ color: 'hsl(195, 90%, 55%)' }} />
              <h3 className="text-lg md:text-xl font-bold mb-2">{labels.multilingual.title}</h3>
              <p className="text-sm text-muted-foreground">{labels.multilingual.description}</p>
            </Card>
          </motion.div>

          {/* Orange */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full p-6 md:p-8 backdrop-blur-xl bg-card/80 border-2 border-orange-500/30 hover:border-orange-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 group">
              <Zap className="h-10 w-10 md:h-12 md:w-12 mb-4 group-hover:scale-110 transition-transform" style={{ color: 'hsl(35, 95%, 55%)' }} />
              <h3 className="text-lg md:text-xl font-bold mb-2">{labels.instantResults.title}</h3>
              <p className="text-sm text-muted-foreground">{labels.instantResults.description}</p>
            </Card>
          </motion.div>

          {/* Small Feature Cards - Pink */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full p-6 backdrop-blur-xl bg-card/80 border-2 border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 group">
              <Shield className="h-8 w-8 md:h-10 md:w-10 mb-3 group-hover:scale-110 transition-transform" style={{ color: 'hsl(320, 80%, 55%)' }} />
              <h3 className="text-base md:text-lg font-bold mb-2">{labels.smartVocabulary.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{labels.smartVocabulary.description}</p>
            </Card>
          </motion.div>

          {/* Green */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full p-6 backdrop-blur-xl bg-card/80 border-2 border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 group">
              <Clock className="h-8 w-8 md:h-10 md:w-10 mb-3 group-hover:scale-110 transition-transform" style={{ color: 'hsl(160, 80%, 45%)' }} />
              <h3 className="text-base md:text-lg font-bold mb-2">{labels.practiceQuizzes.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{labels.practiceQuizzes.description}</p>
            </Card>
          </motion.div>

          {/* Large - Blue gradient */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full p-6 md:p-8 backdrop-blur-xl bg-card/80 border-2 border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 group">
              <div className="flex items-start gap-4">
                <Sparkles className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0 group-hover:scale-110 transition-transform" style={{ color: 'hsl(210, 85%, 55%)' }} />
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">{labels.structuredLearning.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">{labels.structuredLearning.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container max-w-7xl mx-auto px-4 py-16 md:py-24">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {labels.howItWorksTitle}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: 1, data: labels.step1, gradient: 'from-primary/20' },
            { step: 2, data: labels.step2, gradient: 'from-accent/20' },
            { step: 3, data: labels.step3, gradient: 'from-primary/20 to-accent/10' }
          ].map(({ step, data, gradient }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className={`h-full p-6 md:p-8 backdrop-blur-xl bg-gradient-to-br ${gradient} to-transparent border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl`}>
                <div className="flex flex-col items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{data.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{data.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-7xl mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 backdrop-blur-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-2 border-primary/30 text-center relative overflow-hidden">
            {/* Subtle animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {labels.ctaTitle}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {labels.ctaDescription}
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg hover:shadow-xl text-base md:text-lg px-8 py-6 group"
              >
                <Link to="/auth">
                  {labels.startLearning}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container max-w-6xl mx-auto px-4 py-8 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">{labels.footer}</p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:Armen.aslikyan@gmail.com"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Mail className="h-4 w-4" />
              {labels.contact}
            </a>
            <Link
              to="/help"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="h-4 w-4" />
              {labels.help}
            </Link>
          </div>
        </div>
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

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
