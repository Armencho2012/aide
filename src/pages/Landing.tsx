import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsModal } from "@/components/SettingsModal";
import { useSettings } from "@/hooks/useSettings";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  Download,
  FileText,
  HelpCircle,
  Languages,
  Library,
  Mail,
  Map,
  MessageSquare,
  Mic,
  Settings,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Language } from "@/lib/settings";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  chips: string[];
}

interface LandingCopy {
  contact: string;
  help: string;
  signIn: string;
  trustedBy: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  startNow: string;
  seeFlow: string;
  freeBadge: string;
  langBadge: string;
  uploadBadge: string;
  previewTitle: string;
  previewSubtitle: string;
  previewTab1: string;
  previewTab2: string;
  previewTab3: string;
  previewStream: string;
  previewWidgetQuizNotes: string;
  previewWidgetPodcast: string;
  previewNodeCore: string;
  previewNodeQuiz: string;
  previewNodeChat: string;
  flowTitle: string;
  flowSubtitle: string;
  transitionTitle: string;
  transitionSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  featuresTitle: string;
  featuresSubtitle: string;
  capabilitiesTitle: string;
  capabilitiesSubtitle: string;
  capabilityIngestionTitle: string;
  capabilityIngestionDesc: string;
  capabilityControlsTitle: string;
  capabilityControlsDesc: string;
  capabilityTutorTitle: string;
  capabilityTutorDesc: string;
  capabilityMapTitle: string;
  capabilityMapDesc: string;
  capabilityPodcastTitle: string;
  capabilityPodcastDesc: string;
  capabilityLibraryExportTitle: string;
  capabilityLibraryExportDesc: string;
  capabilityLanguagesTitle: string;
  capabilityLanguagesDesc: string;
  capabilityOneClickTitle: string;
  capabilityOneClickDesc: string;
  capabilityItems: string[];
  ctaTitle: string;
  ctaSubtitle: string;
  readGuide: string;
  footer: string;
  plans: string;
  shipped: string;
  featureCards: FeatureCard[];
}

const languageSwitch = [
  { code: "en" as Language, label: "EN" },
  { code: "ru" as Language, label: "RU" },
  { code: "hy" as Language, label: "HY" },
  { code: "ko" as Language, label: "KO" },
];

const copy: Record<Language, LandingCopy> = {
  en: {
    contact: "Contact",
    help: "Help",
    signIn: "Log In",
    trustedBy: "Aide is trusted by students and professionals at...",
    heroEyebrow: "AI-Powered Study Assistant",
    heroTitle: "Stop Rewriting. Start Remembering.",
    heroSubtitle: "Aide turns your messy notes into neural maps, practice tests, and AI podcasts. Spend 10 minutes studying, not 2 hours preparing.",
    startNow: "Start Speedrunning",
    seeFlow: "See How It Works",
    freeBadge: "Daily Free Analysis",
    langBadge: "4 Languages",
    uploadBadge: "PDF + Image + Voice",
    previewTitle: "Your Study Dashboard",
    previewSubtitle: "Everything you need in one view",
    previewTab1: "Deep Summary",
    previewTab2: "Neural Map",
    previewTab3: "AI Tutor",
    previewStream: "Analyzing...",
    previewWidgetQuizNotes: "Quiz & Notes",
    previewWidgetPodcast: "Podcast",
    previewNodeCore: "Main Idea",
    previewNodeQuiz: "Quiz Point",
    previewNodeChat: "Tutor Tip",
    flowTitle: "Study Smarter",
    flowSubtitle: "Three steps to total control.",
    transitionTitle: "Focus Mode",
    transitionSubtitle: "Watch Aide transition from light to deep study mode as you scroll.",
    step1Title: "Upload",
    step1Desc: "Drop a PDF, paste text, or just talk. Aide handles the rest.",
    step2Title: "Customize",
    step2Desc: "Pick what you need: Maps, flashcards, or a podcast episode.",
    step3Title: "Master",
    step3Desc: "Ace your exams with active recall and your own personal AI tutor.",
    featuresTitle: "Power Tools",
    featuresSubtitle: "Everything you need to dominate your syllabus.",
    capabilitiesTitle: "Live Capability Stack",
    capabilitiesSubtitle: "The technology inside your study assistant.",
    capabilityIngestionTitle: "Multimodal Ingestion",
    capabilityIngestionDesc: "Talk, upload, or paste to start.",
    capabilityControlsTitle: "Adaptive Quiz Engine",
    capabilityControlsDesc: "Custom question counts, flashcards, and active recall loops.",
    capabilityTutorTitle: "24/7 AI Tutor",
    capabilityTutorDesc: "Context-aware help that knows your materials and explains mistakes in real time.",
    capabilityMapTitle: "Interactive Knowledge Maps",
    capabilityMapDesc: "Visualize concept links, scan for gaps, and reorganize understanding as you study.",
    capabilityPodcastTitle: "AI Podcasts",
    capabilityPodcastDesc: "Turn your notes into focused audio sessions for commute-time revision.",
    capabilityLibraryExportTitle: "Library & Pro Exports",
    capabilityLibraryExportDesc: "Notion, PDF, and Markdown from one searchable study archive.",
    capabilityLanguagesTitle: "4 Languages",
    capabilityLanguagesDesc: "English, Russian, Armenian, Korean",
    capabilityOneClickTitle: "One-click Export",
    capabilityOneClickDesc: "Ship final notes instantly",
    capabilityItems: [
      "Drag-and-drop PDF, text, and photo uploads (OCR).",
      "Talk to your notes: Instant voice-to-study conversion.",
      "Customizable quizzes, flashcards, and neural maps.",
      "You control the difficulty: Adjustable question counts.",
      "Done-for-you: 7-day structured study plans.",
      "Smart quizzes that explain why you got it wrong.",
      "Flashcards that track what you actually know.",
      "24/7 AI Tutor that knows your material inside out.",
      "Interactive knowledge maps to visualize how ideas connect.",
      "Gap Scan: Aide finds what you missed in your notes.",
      "Export to PDF, Notion, or Markdown in one click.",
      "Searchable library to keep all your subjects organized.",
      "AI Podcasts: Listen to your notes on the go.",
      "Available in English, Russian, Armenian, and Korean."
    ],
    ctaTitle: "Ready to Ace Your Exams?",
    ctaSubtitle: "Join the students using Aide to study 5x faster.",
    readGuide: "How to Prompt",
    footer: "© 2026 Aide. Built for students, by AI.",
    plans: "Plans",
    shipped: "Live Now",
    featureCards: [
      {
        icon: Sparkles,
        title: "Smart Summaries",
        description: "Get the big picture without reading 50 pages.",
        chips: ["PDFs", "Images", "OCR"]
      },
      {
        icon: FileText,
        title: "Practice Tests",
        description: "Quizzes and flashcards built from your own notes.",
        chips: ["Active Recall", "Explanations"]
      },
      {
        icon: Map,
        title: "Neural Maps",
        description: "See your subjects as a visual web of ideas.",
        chips: ["Visual Learning", "Gap Scan"]
      },
      {
        icon: MessageSquare,
        title: "AI Tutor",
        description: "A tutor that's always awake and knows your notes.",
        chips: ["24/7 Chat", "Homework Help"]
      },
      {
        icon: Mic,
        title: "Study Podcasts",
        description: "Turn your syllabus into an easy-to-listen podcast.",
        chips: ["Listen & Learn", "TTS"]
      },
      {
        icon: Library,
        title: "Easy Exports",
        description: "Move your notes to Notion or PDF instantly.",
        chips: ["Notion", "Markdown", "PDF"]
      },
    ],
  },
  ko: {
    contact: "문의",
    help: "도움말",
    signIn: "로그인",
    trustedBy: "Aide를 신뢰하는 학생과 전문가들이 있는 곳",
    heroEyebrow: "AI 기반 학습 비서",
    heroTitle: "받아쓰기는 끝. 이제는 기억할 시간.",
    heroSubtitle: "Aide는 복잡한 노트를 신경망 맵, 모의고사, AI 팟캐스트로 바꿔줍니다. 2시간 준비할 내용을 10분 만에 끝내세요.",
    startNow: "지금 바로 시작",
    seeFlow: "작동 방식 보기",
    freeBadge: "매일 무료 분석 제공",
    langBadge: "4개 언어 지원",
    uploadBadge: "PDF + 이미지 + 음성",
    previewTitle: "나의 학습 대시보드",
    previewSubtitle: "공부에 필요한 모든 것을 한눈에",
    previewTab1: "핵심 요약",
    previewTab2: "지식 맵",
    previewTab3: "AI 튜터",
    previewStream: "분석 중...",
    previewWidgetQuizNotes: "퀴즈 및 노트",
    previewWidgetPodcast: "팟캐스트",
    previewNodeCore: "핵심 개념",
    previewNodeQuiz: "퀴즈 포인트",
    previewNodeChat: "튜터 팁",
    flowTitle: "더 스마트한 학습",
    flowSubtitle: "완벽한 이해를 위한 3단계.",
    transitionTitle: "집중 모드",
    transitionSubtitle: "스크롤하면 Aide가 라이트 모드에서 딥 스터디 모드로 전환됩니다.",
    step1Title: "업로드",
    step1Desc: "PDF를 올리거나 텍스트를 붙여넣으세요. 음성 입력도 가능합니다.",
    step2Title: "맞춤 설정",
    step2Desc: "맵, 플래시카드, 팟캐스트 중 필요한 것을 선택하세요.",
    step3Title: "마스터",
    step3Desc: "나만의 AI 튜터와 함께 시험을 완벽하게 대비하세요.",
    featuresTitle: "강력한 도구",
    featuresSubtitle: "모든 과목을 정복하기 위한 필수 기능.",
    capabilitiesTitle: "Aide 핵심 기능",
    capabilitiesSubtitle: "당신의 학습을 돕는 강력한 기술들.",
    capabilityIngestionTitle: "멀티모달 입력",
    capabilityIngestionDesc: "말하기, 업로드, 붙여넣기로 바로 시작하세요.",
    capabilityControlsTitle: "적응형 퀴즈 엔진",
    capabilityControlsDesc: "문항 수와 플래시카드를 조정하며 능동 회상 학습을 진행합니다.",
    capabilityTutorTitle: "24/7 AI 튜터",
    capabilityTutorDesc: "내 자료를 이해하고 오답 이유를 실시간으로 설명하는 맞춤형 튜터.",
    capabilityMapTitle: "인터랙티브 지식 맵",
    capabilityMapDesc: "개념 연결을 시각화하고 학습 공백을 빠르게 찾아 정리합니다.",
    capabilityPodcastTitle: "AI 팟캐스트",
    capabilityPodcastDesc: "노트를 이동 중에도 들을 수 있는 오디오 학습 세션으로 변환.",
    capabilityLibraryExportTitle: "라이브러리 & Pro 내보내기",
    capabilityLibraryExportDesc: "Notion, PDF, Markdown을 검색 가능한 학습 아카이브에서 즉시 생성.",
    capabilityLanguagesTitle: "4개 언어",
    capabilityLanguagesDesc: "한국어, 영어, 러시아어, 아르메니아어",
    capabilityOneClickTitle: "원클릭 내보내기",
    capabilityOneClickDesc: "최종 노트를 즉시 공유",
    capabilityItems: [
      "PDF, 텍스트, 사진 업로드 및 텍스트 추출(OCR).",
      "노트와 대화하기: 실시간 음성-학습 변환.",
      "맞춤형 퀴즈, 플래시카드, 인터랙티브 지식 맵.",
      "난이도 조절 가능: 문항 수 직접 선택.",
      "7일 맞춤형 구조화 학습 플랜 제공.",
      "오답 이유까지 설명해주는 스마트 퀴즈.",
      "학습 진도를 추적하는 지능형 플래시카드.",
      "내 공부 내용을 전부 꿰고 있는 24/7 AI 튜터.",
      "개념 간의 연결고리를 보여주는 시각적 신경망 맵.",
      "갭 스캔: 노트에서 놓친 부분을 AI가 직접 찾아줍니다.",
      "한 번의 클릭으로 PDF, Notion, Markdown 내보내기.",
      "과목별로 깔끔하게 정리되는 라이브러리.",
      "AI 팟캐스트: 이동 중에도 공부 내용을 귀로 들으세요.",
      "지원 언어: 한국어, 영어, 러시아어, 아르메니아어."
    ],
    ctaTitle: "시험 점수를 올릴 준비가 되셨나요?",
    ctaSubtitle: "Aide와 함께 5배 더 빠르게 공부하는 학생이 되어보세요.",
    readGuide: "사용 가이드",
    footer: "© 2026 Aide. 학생들을 위해 AI가 만들었습니다.",
    plans: "요금제",
    shipped: "지금 사용 가능",
    featureCards: [
      {
        icon: Sparkles,
        title: "스마트 요약",
        description: "50페이지를 다 읽지 않아도 핵심을 파악합니다.",
        chips: ["PDF", "이미지", "OCR"]
      },
      {
        icon: FileText,
        title: "실전 테스트",
        description: "내 노트를 바탕으로 만들어지는 퀴즈와 카드.",
        chips: ["능동 회상", "해설 제공"]
      },
      {
        icon: Map,
        title: "신경망 맵",
        description: "개념들이 어떻게 연결되는지 한눈에 확인하세요.",
        chips: ["시각적 학습", "갭 스캔"]
      },
      {
        icon: MessageSquare,
        title: "AI 튜터",
        description: "내 강의 내용을 완벽히 이해하는 전담 튜터.",
        chips: ["24/7 채팅", "과제 지원"]
      },
      {
        icon: Mic,
        title: "학습 팟캐스트",
        description: "교재 내용을 듣기 편한 팟캐스트로 변환.",
        chips: ["듣는 공부", "TTS"]
      },
      {
        icon: Library,
        title: "간편한 내보내기",
        description: "공부한 내용을 즉시 Notion이나 PDF로 전송.",
        chips: ["Notion", "Markdown", "PDF"]
      },
    ],
  },
  ru: {
    contact: "Контакт",
    help: "Помощь",
    signIn: "Войти",
    trustedBy: "Aide выбирают студенты и специалисты из...",
    heroEyebrow: "Ваш AI-помощник в учебе",
    heroTitle: "Хватит переписывать. Пора запоминать.",
    heroSubtitle: "Aide превращает гору заметок в тесты, карты знаний и подкасты. Учись за 10 минут, а не за 2 часа.",
    startNow: "Начать учиться",
    seeFlow: "Как это работает",
    freeBadge: "Бесплатно каждый день",
    langBadge: "4 языка",
    uploadBadge: "PDF + Фото + Голос",
    previewTitle: "Твой кабинет",
    previewSubtitle: "Все инструменты под рукой",
    previewTab1: "Разбор",
    previewTab2: "Карта знаний",
    previewTab3: "AI-Тьютор",
    previewStream: "Анализирую...",
    previewWidgetQuizNotes: "Тесты и заметки",
    previewWidgetPodcast: "Подкаст",
    previewNodeCore: "Главное",
    previewNodeQuiz: "Вопрос",
    previewNodeChat: "Совет тьютора",
    flowTitle: "Учись проще",
    flowSubtitle: "Три шага к успеху.",
    transitionTitle: "Режим фокуса",
    transitionSubtitle: "Смотри, как Aide подстраивается под твой ритм при скролле.",
    step1Title: "Загрузи",
    step1Desc: "PDF, текст или просто наговори голосом. Остальное за Aide.",
    step2Title: "Настрой",
    step2Desc: "Выбери: карта, карточки или аудио-подкаст.",
    step3Title: "Выучи",
    step3Desc: "Сдавай экзамены на отлично с личным AI-наставником.",
    featuresTitle: "Твои суперсилы",
    featuresSubtitle: "Инструменты для победы над любым предметом.",
    capabilitiesTitle: "Функции Aide",
    capabilitiesSubtitle: "Что умеет твой помощник.",
    capabilityIngestionTitle: "Мультимодальный старт",
    capabilityIngestionDesc: "Говори, загружай или вставляй материал и начинай сразу.",
    capabilityControlsTitle: "Адаптивный движок тестов",
    capabilityControlsDesc: "Настраивай количество вопросов, карточки и цикл активного повторения.",
    capabilityTutorTitle: "AI-тьютор 24/7",
    capabilityTutorDesc: "Контекстный помощник, который знает твои материалы и объясняет ошибки сразу.",
    capabilityMapTitle: "Интерактивные карты знаний",
    capabilityMapDesc: "Визуализируй связи между темами, находи пробелы и строй целостную картину.",
    capabilityPodcastTitle: "AI-подкасты",
    capabilityPodcastDesc: "Преобразуй конспекты в удобный аудиоформат для повторения в дороге.",
    capabilityLibraryExportTitle: "Библиотека и Pro-экспорт",
    capabilityLibraryExportDesc: "Notion, PDF и Markdown из единого структурированного архива.",
    capabilityLanguagesTitle: "4 языка",
    capabilityLanguagesDesc: "RU, EN, HY, KO",
    capabilityOneClickTitle: "Экспорт в один клик",
    capabilityOneClickDesc: "Мгновенно делись готовыми материалами",
    capabilityItems: [
      "Загрузка PDF, текста и фото (через OCR).",
      "Голосовой ввод: превращай слова в учебные материалы.",
      "Тесты, карточки и интерактивные карты знаний.",
      "Ты сам выбираешь сложность и количество вопросов.",
      "Готовые планы подготовки на 7 дней.",
      "Умные тесты с объяснением каждой ошибки.",
      "Карточки, которые следят за твоим прогрессом.",
      "AI-Тьютор 24/7, который знает твой материал.",
      "Карты связей для визуального обучения.",
      "Поиск пробелов: Aide найдет, что ты упустил.",
      "Экспорт в PDF, Notion или Markdown одним кликом.",
      "Удобная библиотека для всех предметов.",
      "AI-подкасты: слушай лекции в дороге.",
      "Поддержка: RU, EN, HY, KO."
    ],
    ctaTitle: "Готов сдать всё на отлично?",
    ctaSubtitle: "Учись в 5 раз быстрее вместе с Aide.",
    readGuide: "Как пользоваться",
    footer: "© 2026 Aide. Создано для студентов.",
    plans: "Тарифы",
    shipped: "Уже работает",
    featureCards: [
      {
        icon: Sparkles,
        title: "Умные итоги",
        description: "Пойми суть темы без чтения 50 страниц.",
        chips: ["PDF", "Фото", "OCR"]
      },
      {
        icon: FileText,
        title: "Тесты для практики",
        description: "Вопросы по твоим же конспектам.",
        chips: ["Запоминание", "Объяснения"]
      },
      {
        icon: Map,
        title: "Карты знаний",
        description: "Визуализируй связи между идеями.",
        chips: ["Карты", "Пробелы"]
      },
      {
        icon: MessageSquare,
        title: "AI-Тьютор",
        description: "Наставник, который знает твои лекции лучше всех.",
        chips: ["Чат 24/7", "Помощь"]
      },
      {
        icon: Mic,
        title: "Подкасты",
        description: "Твои конспекты в формате аудио.",
        chips: ["Слушай", "TTS"]
      },
      {
        icon: Library,
        title: "Экспорт",
        description: "Мгновенно переноси всё в Notion или PDF.",
        chips: ["Notion", "Markdown", "PDF"]
      },
    ],
  },
  hy: {
    contact: "Կապ",
    help: "Օգնություն",
    signIn: "Մուտք",
    trustedBy: "Aide-ին վստահում են ուսանողներն ու մասնագետները",
    heroEyebrow: "AI ուսումնական օգնական",
    heroTitle: "Մի՛ արտագրիր: Սկսի՛ հիշել:",
    heroSubtitle: "Aide-ը քո նշումները վերածում է թեստերի, քարտեզների և պոդկաստների: Սովորիր 10 րոպեում, ոչ թե 2 ժամում:",
    startNow: "Սկսել հիմա",
    seeFlow: "Ինչպես է աշխատում",
    freeBadge: "Անվճար վերլուծություն ամեն օր",
    langBadge: "4 լեզու",
    uploadBadge: "PDF + Նկար + Ձայն",
    previewTitle: "Քո աշխատասեղանը",
    previewSubtitle: "Այն ամենը, ինչ պետք է սովորելու համար",
    previewTab1: "Ամփոփում",
    previewTab2: "Գիտելիքի քարտեզ",
    previewTab3: "AI ուսուցիչ",
    previewStream: "Վերլուծում եմ...",
    previewWidgetQuizNotes: "Թեստեր և նշումներ",
    previewWidgetPodcast: "Պոդկաստ",
    previewNodeCore: "Գլխավոր միտք",
    previewNodeQuiz: "Թեստի հարց",
    previewNodeChat: "Օգնություն",
    flowTitle: "Սովորիր ավելի հեշտ",
    flowSubtitle: "3 քայլ դեպի հաջողություն:",
    transitionTitle: "Կենտրոնացման ռեժիմ",
    transitionSubtitle: "Տես, թե ինչպես է Aide-ին փոխում մտածելակերպդ դպրոցի մասին այն օգտագործելիս:",
    step1Title: "Վերբեռնիր",
    step1Desc: "PDF, տեքստ կամ պարզապես ձայնագրիր քո խոսքը: Aide-ին կանի մնացածը:",
    step2Title: "Ընտրիր",
    step2Desc: "Ի՞նչ է պետք՝ թեստե՞ր, քարտեզնե՞ր, թե՞ աուդիո պոդկաստ:",
    step3Title: "Յուրացրու",
    step3Desc: "Պատրաստվիր քննություններին քո անձնական AI ուսուցչի հետ:",
    featuresTitle: "Հզոր գործիքներ",
    featuresSubtitle: "Այն ամենը, ինչ պետք է ցանկացած առարկա հաղթահարելու համար:",
    capabilitiesTitle: "Aide-ի հնարավորությունները",
    capabilitiesSubtitle: "Տեխնոլոգիաներ, որոնք կօգնեն քեզ սովորել:",
    capabilityIngestionTitle: "Բազմամոդալ մեկնարկ",
    capabilityIngestionDesc: "Խոսիր, վերբեռնիր կամ տեղադրիր տեքստը և անմիջապես սկսիր:",
    capabilityControlsTitle: "Հարմարվող թեստային շարժիչ",
    capabilityControlsDesc: "Կառավարիր հարցերի քանակը, քարտերը և ակտիվ հիշողության ցիկլը:",
    capabilityTutorTitle: "24/7 AI ուսուցիչ",
    capabilityTutorDesc: "Քո նյութը հասկանում է և սխալները բացատրում է իրական ժամանակում:",
    capabilityMapTitle: "Ինտերակտիվ գիտելիքի քարտեզներ",
    capabilityMapDesc: "Տես գաղափարների կապերը, գտիր բացթողումները և կառուցիր ամբողջական պատկեր:",
    capabilityPodcastTitle: "AI պոդկաստներ",
    capabilityPodcastDesc: "Նշումները փոխակերպիր աուդիո դասերի՝ ճանապարհին կրկնելու համար:",
    capabilityLibraryExportTitle: "Գրադարան և Pro արտահանում",
    capabilityLibraryExportDesc: "Notion, PDF և Markdown՝ մեկ որոնելի ուսումնական արխիվից:",
    capabilityLanguagesTitle: "4 լեզու",
    capabilityLanguagesDesc: "Հայերեն, անգլերեն, ռուսերեն, կորեերեն",
    capabilityOneClickTitle: "Արտահանում մեկ քլիքով",
    capabilityOneClickDesc: "Կիսվիր պատրաստ նյութերով ակնթարթորեն",
    capabilityItems: [
      "PDF-ի, տեքստի և նկարների վերբեռնում:",
      "Ձայնային մուտք. խոսիր նշումներիդ հետ և ստացիր նյութեր:",
      "Ինտերակտիվ թեստեր, քարտեր և գիտելիքի քարտեզներ:",
      "Դու ես որոշում բարդությունը և հարցերի քանակը:",
      "7-օրյա պատրաստի ուսումնական պլաններ:",
      "Խելացի թեստեր, որոնք բացատրում են սխալները:",
      "Ֆլեշքարտեր, որոնք հետևում են քո առաջընթացին:",
      "AI ուսուցիչ 24/7, որը գիտի քո նյութը ամբողջությամբ:",
      "Գիտելիքի նեյրոնային քարտեզներ՝ տեսողական սովորելու համար:",
      "Բացթողումների որոնում. Aide-ին կգտնի այն, ինչ բաց ես թողել:",
      "Արտահանում դեպի PDF, Notion կամ Markdown մեկ հպումով:",
      "Հարմար գրադարան բոլոր առարկաները կազմակերպելու համար:",
      "AI պոդկաստներ. լսիր դասերդ ճանապարհին:",
      "Հասանելի է հայերենով, անգլերենով, ռուսերենով և կորեերենով:"
    ],
    ctaTitle: "Պատրա՞ստ ես փայլել քննություններին:",
    ctaSubtitle: "Սովորիր 5 անգամ ավելի արագ Aide-ի հետ:",
    readGuide: "Ինչպես օգտվել",
    footer: "© 2026 Aide. Ստեղծված է ուսանողների համար:",
    plans: "Պլաններ",
    shipped: "Արդեն աշխատում է",
    featureCards: [
      {
        icon: Sparkles,
        title: "Խելացի ամփոփում",
        description: "Հասկացիր թեման՝ առանց 50 էջ կարդալու:",
        chips: ["PDF", "Նկար", "OCR"]
      },
      {
        icon: FileText,
        title: "Թեստեր",
        description: "Հարցեր հենց քո դասախոսություններից:",
        chips: ["Հիշողություն", "Բացատրություն"]
      },
      {
        icon: Map,
        title: "Գիտելիքի քարտեզ",
        description: "Տես կապը գաղափարների միջև:",
        chips: ["Վիզուալ", "Բացթողումներ"]
      },
      {
        icon: MessageSquare,
        title: "AI ուսուցիչ",
        description: "Օգնական, որը երբեք չի քնում և գիտի քո դասերը:",
        chips: ["Չատ 24/7", "Օգնություն"]
      },
      {
        icon: Mic,
        title: "Պոդկաստներ",
        description: "Քո նշումները՝ աուդիո ձևաչափով:",
        chips: ["Լսիր", "TTS"]
      },
      {
        icon: Library,
        title: "Արտահանում",
        description: "Տեղափոխիր ամեն ինչ Notion կամ PDF վայրկյանների ընթացքում:",
        chips: ["Notion", "Markdown", "PDF"]
      },
    ],
  },
};
const trustedLogos = [
  { name: "Harvard", src: "/trusted-logos/logo-01.png" },
  { name: "Princeton", src: "/trusted-logos/logo-02.png" },
  { name: "Columbia", src: "/trusted-logos/logo-03.png" },
  { name: "Cornell", src: "/trusted-logos/logo-04.png" },
  { name: "Stanford", src: "/trusted-logos/logo-05.png" },
  { name: "MIT", src: "/trusted-logos/logo-06.png" },
  { name: "UC Berkeley", src: "/trusted-logos/logo-07.png" },
  { name: "Caltech", src: "/trusted-logos/logo-08.png" },
  { name: "UChicago", src: "/trusted-logos/logo-09.png" },
  { name: "University of California", src: "/trusted-logos/logo-10.png" },
  { name: "McGill", src: "/trusted-logos/logo-11.png" },
  { name: "University of Washington", src: "/trusted-logos/logo-12.png" },
  { name: "Yale", src: "/trusted-logos/logo-13.png" },
  { name: "University of Maryland", src: "/trusted-logos/logo-14.png" },
  { name: "University of Oxford", src: "/trusted-logos/logo-15.png" },
  { name: "University of Cambridge", src: "/trusted-logos/logo-16.png" },
];

const gpaReviews = [
  { student: "Amelia, Pre-Med", gpa: "2.8 -> 3.7", quote: "Daily recall mode stopped me from cramming." },
  { student: "Daniel, Engineering", gpa: "3.0 -> 3.8", quote: "I finally understood difficult lectures in one pass." },
  { student: "Sofia, Economics", gpa: "3.1 -> 3.9", quote: "The quiz loops made retention way easier." },
  { student: "Arman, Computer Science", gpa: "2.9 -> 3.8", quote: "Aide turned messy notes into clear exam prep." },
  { student: "Mina, Law", gpa: "3.2 -> 3.9", quote: "The AI tutor explained every missed point fast." },
  { student: "Leo, Biology", gpa: "2.7 -> 3.6", quote: "Podcast mode helped me revise on commutes." },
];

const accessCards: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Library,
    title: "Desktop Deep Work",
    description: "Upload large files, build maps, and run full exam simulations in one dashboard.",
  },
  {
    icon: MessageSquare,
    title: "Mobile AI Tutor",
    description: "Ask questions and review flashcards between classes from your phone.",
  },
  {
    icon: Mic,
    title: "Audio Anywhere",
    description: "Turn notes into podcasts for gym, commute, or late-night review sessions.",
  },
];

const comparisonRows = [
  { metric: "Prep Time", aide: "10-15 min setup", traditional: "60-120 min setup" },
  { metric: "Retention", aide: "Active recall + repetition", traditional: "Passive rereading" },
  { metric: "Feedback Speed", aide: "Instant explanation loops", traditional: "Delayed grading cycles" },
  { metric: "Personalization", aide: "Per-topic adaptive quizzes", traditional: "One-size-fits-all review" },
];

const faqItems = [
  {
    q: "Can I use my own lecture notes and PDFs?",
    a: "Yes. You can upload PDFs, paste text, and use voice input. Aide adapts output to your material.",
  },
  {
    q: "Does Aide work for different subjects?",
    a: "Yes. Students use it for STEM, medicine, business, law, and language-heavy courses.",
  },
  {
    q: "How quickly can I start seeing results?",
    a: "Most learners start with summaries and quizzes in the first session, then improve retention over the first week.",
  },
  {
    q: "Is Aide available on phone and desktop?",
    a: "Yes. The experience is fully responsive and designed for both quick mobile sessions and deeper desktop study.",
  },
];

const Landing = () => {
  const { language, theme, setLanguage, setTheme } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const t = copy[language] || copy.en;
  const heroWords = t.heroTitle.split(" ").filter(Boolean);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const initMotion = async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        smoothTouch: false,
        lerp: 0.09,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.1,
        anchors: true,
      });

      const onLenisScroll = () => ScrollTrigger.update();
      const onTick = (time: number) => {
        lenis.raf(time * 1000);
      };

      lenis.on("scroll", onLenisScroll);
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(500, 33);
      const media = ScrollTrigger.matchMedia();
      const isDarkTheme = theme === "dark";
      const baseBodyBackground = isDarkTheme ? "#050816" : "#f9fafb";
      const baseBodyColor = isDarkTheme ? "#f8fafc" : "#111827";
      const targetBodyBackground = isDarkTheme ? "#1e1b4b" : "#4338ca";
      const targetBodyColor = "#eef2ff";
      const body = document.body;
      if (!body) return;
      const previousBodyBackground = body.style.backgroundColor;
      const previousBodyColor = body.style.color;
      const previousRootColor = root.style.color;

      gsap.set(body, { backgroundColor: baseBodyBackground, color: baseBodyColor });
      gsap.set(root, { color: baseBodyColor });
      const blueSection = root.querySelector<HTMLElement>("#blue-section");
      const transitionTarget = blueSection || root;

      const ctx = gsap.context(() => {
        if (prefersReducedMotion) {
          gsap.set("[data-hero-word], [data-hero-subtitle], [data-hero-cta], [data-hero-badges], [data-preview-panel], [data-reveal], [data-capability-tile], [data-bento-card], [data-mascot-shell]", {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            clearProps: "all",
          });
          gsap.set("[data-mascot-glow]", { autoAlpha: 0 });
          return;
        }

        gsap.fromTo(
          "[data-hero-word]",
          { autoAlpha: 0, yPercent: 110, filter: "blur(10px)" },
          {
            autoAlpha: 1,
            yPercent: 0,
            filter: "blur(0px)",
            duration: 0.9,
            stagger: 0.045,
            ease: "power4.out",
          }
        );

        gsap.fromTo(
          "[data-hero-subtitle], [data-hero-cta], [data-hero-badges], [data-preview-panel]",
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            delay: 0.22,
            stagger: 0.08,
            ease: "power3.out",
          }
        );

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el, index) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 34 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.85,
              delay: Math.min(index * 0.02, 0.2),
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                end: "top 65%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        gsap.to("[data-depth='panel']", {
          yPercent: -9,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });

        gsap.to("[data-depth='halo']", {
          yPercent: -14,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        });

        if (blueSection) {
          gsap.to(body, {
            backgroundColor: targetBodyBackground,
            color: targetBodyColor,
            ease: "none",
            scrollTrigger: {
              trigger: blueSection,
              start: "top 88%",
              end: "top 12%",
              scrub: true,
            },
          });

          gsap.to("#transition-zone [data-invert]", {
            color: "#f8fbff",
            ease: "none",
            scrollTrigger: {
              trigger: transitionTarget,
              start: "top 88%",
              end: "top 18%",
              scrub: true,
            },
          });

          gsap.to("[data-nav]", {
            backgroundColor: isDarkTheme ? "rgba(22, 27, 63, 0.78)" : "rgba(42, 47, 113, 0.64)",
            borderColor: "rgba(255,255,255,0.22)",
            ease: "none",
            scrollTrigger: {
              trigger: blueSection,
              start: "top 90%",
              end: "top 15%",
              scrub: true,
            },
          });

          gsap.to("[data-nav-muted]", {
            color: "#dfe5ff",
            ease: "none",
            scrollTrigger: {
              trigger: blueSection,
              start: "top 90%",
              end: "top 15%",
              scrub: true,
            },
          });

          gsap.to("[data-nav-strong]", {
            color: "#ffffff",
            ease: "none",
            scrollTrigger: {
              trigger: blueSection,
              start: "top 90%",
              end: "top 15%",
              scrub: true,
            },
          });

          gsap.to("[data-mascot-glow]", {
            autoAlpha: 1,
            scale: 1.08,
            ease: "none",
            scrollTrigger: {
              trigger: blueSection,
              start: "top 86%",
              end: "top 24%",
              scrub: true,
            },
          });

          gsap.to("[data-mascot-shell]", {
            filter: "drop-shadow(0 0 42px rgba(139,92,246,0.66)) saturate(1.22)",
            scale: 1.035,
            ease: "none",
            scrollTrigger: {
              trigger: blueSection,
              start: "top 86%",
              end: "top 24%",
              scrub: true,
            },
          });
        }

        media.add("(max-width: 1023px)", () => {
          gsap.utils.toArray<HTMLElement>("[data-bento-card]").forEach((card, index) => {
            gsap.fromTo(
              card,
              { autoAlpha: 0, y: 36, scale: 0.985 },
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                delay: Math.min(index * 0.03, 0.2),
                ease: "power3.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 88%",
                  end: "top 60%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          });
        });

        media.add("(min-width: 1024px)", () => {
          const bentoCards = gsap.utils.toArray<HTMLElement>("[data-bento-card]");
          if (bentoCards.length > 0 && blueSection) {
            gsap.fromTo(
              bentoCards,
              { autoAlpha: 0, y: 46, scale: 0.96 },
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.82,
                ease: "power3.out",
                stagger: 0.11,
                scrollTrigger: {
                  trigger: blueSection,
                  start: "top 76%",
                  end: "top 44%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
            const speed = Number(el.dataset.speed || "1");
            const amplitude = (speed - 1) * 420;
            gsap.to(el, {
              y: amplitude,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
              },
            });
          });
        });

        const capabilityTiles = gsap.utils.toArray<HTMLElement>("[data-capability-tile]");
        if (capabilityTiles.length > 0) {
          gsap.fromTo(
            capabilityTiles,
            { autoAlpha: 0, y: 38, scale: 0.985 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.82,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: "#capability-bento",
                start: "top 82%",
                end: "top 42%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      }, root);

      const handleResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", handleResize);
      ScrollTrigger.refresh();

      cleanup = () => {
        window.removeEventListener("resize", handleResize);
        ctx.revert();
        lenis.off("scroll", onLenisScroll);
        lenis.destroy();
        media.kill();
        gsap.ticker.remove(onTick);
        body.style.backgroundColor = previousBodyBackground;
        body.style.color = previousBodyColor;
        root.style.color = previousRootColor;
      };
    };

    void initMotion().catch((error) => {
      console.error("Failed to initialize landing motion runtime:", error);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [language, theme]);

  return (
    <div
      ref={rootRef}
      className="min-h-screen overflow-x-hidden text-[#111827] dark:text-slate-100"
    >
      <div
        data-depth="halo"
        className="pointer-events-none fixed inset-x-0 top-[-14vh] -z-10 h-[66vh] bg-[radial-gradient(circle_at_14%_18%,rgba(196,181,253,0.42),transparent_42%),radial-gradient(circle_at_86%_8%,rgba(125,211,252,0.3),transparent_44%)] dark:bg-[radial-gradient(circle_at_12%_20%,rgba(167,139,250,0.28),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(99,102,241,0.25),transparent_46%)]"
      />

      <nav
        data-nav
        className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/82 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/58"
      >
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span data-nav-strong className="text-lg font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
              Aide
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-slate-300/90 bg-white/88 p-1 dark:border-white/15 dark:bg-white/[0.06]">
              {languageSwitch.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  data-nav-muted={language !== item.code ? "true" : undefined}
                  data-nav-strong={language === item.code ? "true" : undefined}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    language === item.code
                      ? "bg-violet-600 text-white dark:bg-violet-400/35 dark:text-violet-50"
                      : "text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-white/12 dark:hover:text-white sm:flex"
            >
              <a data-nav-muted href="mailto:myaide.study@gmail.com">
                <Mail className="h-4 w-4" />
                {t.contact}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-white/12 dark:hover:text-white sm:flex"
            >
              <Link data-nav-muted to="/help">
                <HelpCircle className="h-4 w-4" />
                {t.help}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="rounded-full border-slate-300/90 bg-white/85 text-slate-700 hover:bg-slate-100 dark:border-white/18 dark:bg-white/[0.06] dark:text-zinc-200 dark:hover:bg-white/12"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" className="rounded-full bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-400">
              <Link data-nav-strong to="/auth">{t.signIn}</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="container mx-auto max-w-7xl px-4 pb-14 pt-16 md:pt-20">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-slate-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#f9fafb_48%,#f4f6ff_100%)] p-6 shadow-[0_28px_80px_rgba(79,70,229,0.14)] md:p-10 dark:border-white/10 dark:bg-[radial-gradient(circle_at_14%_16%,rgba(167,139,250,0.22),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(99,102,241,0.2),transparent_45%),linear-gradient(145deg,#050816_0%,#0a1230_58%,#111b45_100%)] dark:shadow-[0_30px_90px_rgba(2,6,23,0.72)]">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-48 dark:[background-image:linear-gradient(to_right,rgba(216,180,254,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(216,180,254,0.12)_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-violet-200/55 blur-3xl dark:bg-violet-400/20" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-sky-200/55 blur-3xl dark:bg-indigo-400/20" />

          <div className="relative grid items-center gap-8 lg:grid-cols-12 xl:gap-10">
            <div className="lg:col-span-6 xl:col-span-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200/90 bg-white/62 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-violet-100/75 backdrop-blur-xl dark:border-white/18 dark:bg-slate-900/58 dark:text-slate-100 dark:shadow-black/35">
                <Brain className="h-3.5 w-3.5 text-violet-600 dark:text-violet-200" />
                {t.heroEyebrow}
              </div>

              <h1 className="max-w-[14ch] text-[clamp(2.4rem,7vw,5.5rem)] font-black leading-[0.93] tracking-[-0.042em] text-[#111827] dark:text-white">
                {heroWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    data-hero-word
                    className="mr-[0.17em] inline-block last:mr-0"
                  >
                    {word}
                  </span>
                ))}
              </h1>

              <p
                data-hero-subtitle
                className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-slate-300/92"
              >
                {t.heroSubtitle}
              </p>

              <div data-hero-cta className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-violet-600 px-7 text-base text-white shadow-lg shadow-violet-500/35 transition-all hover:bg-violet-500 hover:shadow-violet-400/35 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-400"
                >
                  <Link to="/auth">
                    {t.startNow}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-violet-300/80 bg-white/60 px-7 text-base text-violet-700 transition-colors hover:bg-white/88 dark:border-violet-200/40 dark:bg-slate-900/58 dark:text-violet-100 dark:hover:bg-slate-900/86"
                >
                  <a href="#how-it-works">{t.seeFlow}</a>
                </Button>
              </div>

              <div data-hero-badges className="mt-6 flex flex-wrap gap-2.5">
                {[t.freeBadge, t.langBadge, t.uploadBadge].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-slate-300/85 bg-white/74 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200/75 backdrop-blur-xl dark:border-white/16 dark:bg-slate-900/54 dark:text-slate-100"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div data-preview-panel data-depth="panel" className="lg:col-span-6 xl:col-span-5">
              <div className="relative mx-auto w-full max-w-[27rem]">
                <div
                  data-mascot-glow
                  className="pointer-events-none absolute inset-x-12 top-10 h-44 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.82)_0%,rgba(99,102,241,0.5)_44%,rgba(42,34,109,0)_80%)] opacity-0 blur-3xl"
                />
                <Card className="relative overflow-hidden rounded-[1.85rem] border border-slate-200/90 bg-white/56 p-5 shadow-[0_36px_100px_rgba(15,23,42,0.14)] backdrop-blur-3xl dark:border-white/16 dark:bg-slate-950/48 dark:shadow-[0_36px_100px_rgba(2,6,23,0.72)]">
                  <div className="pointer-events-none absolute -top-20 right-[-5.5rem] h-44 w-44 rounded-full bg-violet-200/45 blur-3xl dark:bg-violet-400/22" />
                  <div className="pointer-events-none absolute bottom-0 left-[-5rem] h-40 w-40 rounded-full bg-indigo-200/45 blur-3xl dark:bg-indigo-400/22" />

                  <div className="relative mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.previewTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300/86">{t.previewSubtitle}</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-200">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {t.previewStream}
                    </div>
                  </div>

                  <img
                    data-mascot-shell
                    src="/aide-mascot.svg"
                    alt="Aide mascot"
                    className="relative mx-auto w-full max-w-[16.5rem] drop-shadow-[0_24px_40px_rgba(79,70,229,0.28)] dark:drop-shadow-[0_24px_44px_rgba(15,23,42,0.72)] md:max-w-[18rem]"
                  />

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[t.previewTab1, t.previewTab2, t.previewTab3].map((tab, idx) => (
                      <div
                        key={tab}
                        className={`rounded-xl px-2 py-1.5 text-center text-[11px] font-medium ${
                          idx === 0
                            ? "bg-violet-600 text-white dark:bg-violet-500/35 dark:text-violet-50"
                            : "bg-white/82 text-slate-600 dark:bg-slate-900/78 dark:text-zinc-200"
                        }`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/84 p-2 text-[11px] text-slate-700 dark:border-white/12 dark:bg-slate-900/74 dark:text-zinc-200">
                      <FileText className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
                      {t.previewWidgetQuizNotes}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/84 p-2 text-[11px] text-slate-700 dark:border-white/12 dark:bg-slate-900/74 dark:text-zinc-200">
                      <Mic className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
                      {t.previewWidgetPodcast}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-14">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[1.9rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_50%_-22%,rgba(34,211,238,0.16),transparent_46%),linear-gradient(180deg,#020c16_0%,#041321_54%,#020d18_100%)] px-5 py-8 shadow-[0_22px_70px_rgba(2,12,26,0.45)] dark:border-white/12 dark:bg-[radial-gradient(circle_at_50%_-22%,rgba(125,211,252,0.15),transparent_48%),linear-gradient(180deg,#020b14_0%,#03101d_52%,#020910_100%)] dark:shadow-[0_26px_78px_rgba(2,6,23,0.66)] sm:px-8"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#020d18] to-transparent dark:from-[#020910]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#020d18] to-transparent dark:from-[#020910]" />

          <p className="text-center text-[0.96rem] font-semibold text-slate-100/92">
            {t.trustedBy}
          </p>

          <div className="trusted-logo-marquee mt-6">
            <div className="trusted-logo-track">
              {[...trustedLogos, ...trustedLogos].map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className="trusted-logo-item"
                  aria-hidden={index >= trustedLogos.length}
                >
                  <img
                    src={logo.src}
                    alt={`${logo.name} logo`}
                    loading="lazy"
                    className="trusted-logo-image"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section id="how-it-works" className="container mx-auto max-w-7xl px-4 pb-16">
        <div data-reveal className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-4xl dark:text-zinc-50">
            {t.flowTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-zinc-300">{t.flowSubtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Upload, title: t.step1Title, desc: t.step1Desc },
            { icon: WandSparkles, title: t.step2Title, desc: t.step2Desc },
            { icon: Bot, title: t.step3Title, desc: t.step3Desc },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                data-reveal
                className="h-full rounded-2xl border border-slate-200/85 bg-white/84 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_42px_rgba(79,70,229,0.14)] dark:border-white/14 dark:bg-slate-950/52 dark:shadow-[0_16px_36px_rgba(2,6,23,0.5)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/22 dark:text-violet-100">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="rounded-full border border-violet-200/85 bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-600 dark:border-white/18 dark:bg-white/[0.05] dark:text-violet-100">
                    Step {index + 1}
                  </span>
                </div>
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">{item.title}</p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="gpa-reviews" className="container mx-auto max-w-7xl px-4 pb-16">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[2rem] border border-indigo-200/35 bg-[linear-gradient(145deg,#eef2ff_0%,#f8fafc_45%,#ffffff_100%)] p-6 shadow-[0_24px_60px_rgba(79,70,229,0.14)] dark:border-white/14 dark:bg-[radial-gradient(circle_at_18%_12%,rgba(167,139,250,0.2),transparent_38%),radial-gradient(circle_at_90%_18%,rgba(56,189,248,0.18),transparent_36%),linear-gradient(160deg,#0a1026_0%,#111b3e_54%,#1a2550_100%)] dark:shadow-[0_24px_60px_rgba(2,6,23,0.65)] md:p-8"
        >
          <h3 className="text-center text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl">
            Trusted by 1,000,000+ students
          </h3>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-blue-100/82 md:text-base">
            Real GPA jumps shared by learners who use Aide every week.
          </p>

          <div className="gpa-review-marquee mt-6">
            <div className="gpa-review-track">
              {[...gpaReviews, ...gpaReviews].map((review, index) => (
                <article key={`${review.student}-${index}`} className="gpa-review-card" aria-hidden={index >= gpaReviews.length}>
                  <p className="gpa-review-gpa">{review.gpa}</p>
                  <p className="gpa-review-student">{review.student}</p>
                  <p className="gpa-review-quote">{review.quote}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="blue-section" className="relative pb-16 pt-6 text-slate-50">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(167,139,250,0.26),transparent_45%),radial-gradient(circle_at_84%_8%,rgba(56,189,248,0.28),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.35)_0%,rgba(9,15,40,0.78)_100%)]" />

        <section id="what-you-can-do" className="container mx-auto max-w-7xl px-4 pb-16">
          <div data-reveal className="mb-8 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-4xl">What you can do with Aide</h2>
            <p className="mt-3 text-blue-100/82">{t.featuresSubtitle}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {t.featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  data-bento-card
                  className="h-full rounded-2xl border border-white/18 bg-white/[0.08] p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-violet-200/55 hover:bg-white/[0.14]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/14">
                    <Icon className="h-5 w-5 text-violet-100" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-slate-50">{card.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-blue-100/85">{card.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {card.chips.map((chip) => (
                      <span key={chip} className="rounded-full border border-white/18 bg-black/20 px-2.5 py-1 text-[11px] text-blue-50/92">
                        {chip}
                      </span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="access-anywhere" className="container mx-auto max-w-7xl px-4 pb-16">
          <div
            data-reveal
            className="relative overflow-hidden rounded-[2rem] border border-white/18 bg-white/[0.08] p-6 backdrop-blur-xl md:p-10"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              Access the Aide AI Study Tool Anywhere, Anytime
            </h2>
            <p className="mt-3 max-w-3xl text-blue-100/84">
              Start on desktop, continue on mobile, and keep your progress synced across every study session.
            </p>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {accessCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="h-full rounded-2xl border border-white/16 bg-black/20 p-4 backdrop-blur-xl">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                      <Icon className="h-4.5 w-4.5 text-blue-100" />
                    </div>
                    <p className="mb-1.5 text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-blue-100/82">{item.description}</p>
                  </Card>
                );
              })}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                <Link to="/auth">
                  {t.startNow}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/28 bg-white/5 text-slate-50 hover:bg-white/16"
              >
                <Link to="/help">
                  <HelpCircle className="mr-2 h-5 w-5" />
                  {t.readGuide}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="transition-zone" className="container mx-auto max-w-7xl px-4 pb-16">
          <div
            data-reveal
            className="rounded-[2rem] border border-white/18 bg-white/[0.08] p-6 backdrop-blur-xl md:p-10"
          >
            <h2 data-invert className="text-2xl font-bold tracking-tight text-slate-50 md:text-4xl">
              Why Our AI Study Tool Outperforms Traditional Methods
            </h2>
            <p data-invert className="mt-3 max-w-4xl text-sm leading-relaxed text-blue-100/84 md:text-base">
              Experience the advantages of AI-powered studying compared to conventional methods. Our approach is
              designed to save you time, boost retention, and make learning more effective.
            </p>

            <div className="mt-7 overflow-hidden rounded-2xl border border-white/16">
              <div className="hidden grid-cols-3 bg-white/[0.1] text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/85 md:grid">
                <div className="px-4 py-3">Category</div>
                <div className="px-4 py-3">Aide AI</div>
                <div className="px-4 py-3">Traditional Methods</div>
              </div>
              {comparisonRows.map((row) => (
                <div key={row.metric} className="grid border-t border-white/12 md:grid-cols-3 md:items-center">
                  <div className="px-4 pt-4 text-sm font-semibold text-slate-50 md:py-4">{row.metric}</div>
                  <div className="px-4 py-2 text-sm text-emerald-200 md:py-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      {row.aide}
                    </span>
                  </div>
                  <div className="px-4 pb-4 text-sm text-blue-100/80 md:py-4">{row.traditional}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="container mx-auto max-w-7xl px-4 pb-16">
          <div data-reveal className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-4xl">FAQ&apos;s</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                data-reveal
                className="group rounded-2xl border border-white/16 bg-white/[0.08] backdrop-blur-xl"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-slate-50">
                  <span>{item.q}</span>
                  <span className="text-lg leading-none text-blue-100 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-blue-100/85">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="container mx-auto max-w-7xl px-4 pb-10">
          <div className="rounded-3xl border-t border-[rgba(255,255,255,0.1)] bg-gradient-to-b from-slate-950/88 via-slate-950/92 to-blue-950/92 px-6 py-8 shadow-[0_-18px_45px_rgba(2,6,23,0.28)] md:px-8 md:py-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Product</h4>
                <div className="mt-4 flex flex-col gap-2.5 text-sm font-medium">
                  <Link to="/help" className="text-white/60 transition-colors duration-300 hover:text-white">
                    About Page
                  </Link>
                  <a href="#how-it-works" className="text-white/60 transition-colors duration-300 hover:text-white">
                    How it Works
                  </a>
                  <a href="#what-you-can-do" className="text-white/60 transition-colors duration-300 hover:text-white">
                    What You Can Do
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Support</h4>
                <div className="mt-4 flex flex-col gap-2.5 text-sm font-medium">
                  <Link to="/help" className="text-white/60 transition-colors duration-300 hover:text-white">
                    Help Center
                  </Link>
                  <a
                    href="mailto:myaide.study@gmail.com?subject=Aide%20Support"
                    className="text-white/60 transition-colors duration-300 hover:text-white"
                  >
                    Support
                  </a>
                  <a
                    href="mailto:myaide.study@gmail.com"
                    className="text-white/60 transition-colors duration-300 hover:text-white"
                  >
                    Contact Us
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Legal</h4>
                <div className="mt-4 flex flex-col gap-2.5 text-sm font-medium">
                  <Link to="/help#privacy-policy" className="text-white/60 transition-colors duration-300 hover:text-white">
                    Privacy Policy
                  </Link>
                  <Link to="/help#terms-of-service" className="text-white/60 transition-colors duration-300 hover:text-white">
                    Terms of Service
                  </Link>
                  <Link to="/help#community-guidelines" className="text-white/60 transition-colors duration-300 hover:text-white">
                    Community Guidelines
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Social</h4>
                <div className="mt-4 flex flex-col gap-2.5 text-sm font-medium">
                  <a
                    href="https://www.instagram.com/myaide.study/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/60 transition-colors duration-300 hover:text-white"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61587146428880"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/60 transition-colors duration-300 hover:text-white"
                  >
                    Facebook
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-4 text-xs tracking-wide text-white/70">
              © 2026 Aide. All rights reserved.
            </div>
          </div>
        </footer>
      </section>

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
