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
const bentoClasses = [
  "lg:col-span-5 lg:row-span-2",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-5",
];

const Landing = () => {
  const { language, theme, setLanguage, setTheme } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stickySectionRef = useRef<HTMLElement | null>(null);
  const stickyPinRef = useRef<HTMLDivElement | null>(null);
  const stickyTrackRef = useRef<HTMLDivElement | null>(null);
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
      const baseBodyBackground = isDarkTheme ? "#05070b" : "#ffffff";
      const baseBodyColor = isDarkTheme ? "#f4f4f5" : "#0f172a";
      const targetBodyBackground = isDarkTheme ? "#0e3cc8" : "#1459ff";
      const targetBodyColor = "#eef4ff";
      const previousBodyBackground = document.body.style.backgroundColor;
      const previousBodyColor = document.body.style.color;
      const previousRootColor = root.style.color;

      gsap.set(document.body, { backgroundColor: baseBodyBackground, color: baseBodyColor });
      gsap.set(root, { color: baseBodyColor });
      const blueSection = root.querySelector<HTMLElement>("#blue-section");
      const transitionTarget = blueSection || root;

      const ctx = gsap.context(() => {
        if (prefersReducedMotion) {
          gsap.set("[data-hero-word], [data-hero-subtitle], [data-hero-cta], [data-hero-badges], [data-preview-panel], [data-reveal], [data-sticky-card], [data-bento-card], [data-mascot-shell]", {
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
          gsap.to("body", {
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
            backgroundColor: isDarkTheme ? "rgba(7, 26, 74, 0.7)" : "rgba(7, 26, 74, 0.58)",
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
            color: "#d6e4ff",
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
            filter: "drop-shadow(0 0 42px rgba(63,150,255,0.68)) saturate(1.28)",
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

          if (!stickySectionRef.current || !stickyPinRef.current || !stickyTrackRef.current) {
            return;
          }

          const stickyPinTrigger = ScrollTrigger.create({
            trigger: stickySectionRef.current,
            start: "top top+=110",
            end: () =>
              `+=${Math.max(
                stickyTrackRef.current!.offsetHeight -
                  stickyPinRef.current!.offsetHeight +
                  140,
                420
              )}`,
            pin: stickyPinRef.current,
            pinSpacing: false,
            invalidateOnRefresh: true,
          });

          return () => {
            stickyPinTrigger.kill();
          };
        });

        gsap.utils.toArray<HTMLElement>("[data-sticky-card]").forEach((card) => {
          gsap.fromTo(
            card,
            { autoAlpha: 0, x: 20, y: 44, scale: 0.985 },
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 82%",
                end: "top 58%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
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
        document.body.style.backgroundColor = previousBodyBackground;
        document.body.style.color = previousBodyColor;
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
      className="min-h-screen overflow-x-hidden text-slate-900 dark:text-zinc-100"
    >
      <div
        data-depth="halo"
        className="pointer-events-none fixed inset-x-0 top-[-10vh] -z-10 h-[56vh] bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.26),transparent_58%)]"
      />

      <nav
        data-nav
        className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/78 backdrop-blur-xl dark:border-white/10 dark:bg-black/45"
      >
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span data-nav-strong className="text-lg font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
              Aide
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-slate-300/90 bg-white/90 p-1 dark:border-white/10 dark:bg-white/5">
              {languageSwitch.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  data-nav-muted={language !== item.code ? "true" : undefined}
                  data-nav-strong={language === item.code ? "true" : undefined}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    language === item.code
                      ? "bg-slate-900 text-white dark:bg-white/20 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
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
              className="hidden text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white sm:flex"
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
              className="hidden text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white sm:flex"
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
              className="border-slate-300/90 bg-white/85 text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/12"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-500 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              <Link data-nav-strong to="/auth">{t.signIn}</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="container mx-auto max-w-7xl px-4 pb-14 pt-16 md:pt-20">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-slate-200/90 bg-[linear-gradient(120deg,#d8ecff_0%,#eff6ff_45%,#f7f2db_100%)] p-6 shadow-[0_24px_70px_rgba(59,130,246,0.16)] md:p-10 dark:border-white/12 dark:bg-[radial-gradient(circle_at_76%_25%,rgba(56,189,248,0.2),transparent_45%),radial-gradient(circle_at_18%_16%,rgba(59,130,246,0.22),transparent_40%),linear-gradient(145deg,#041024_0%,#081c3f_56%,#0d2a59_100%)] dark:shadow-[0_24px_70px_rgba(2,6,23,0.65)]">
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-55 dark:[background-image:linear-gradient(to_right,rgba(191,219,254,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(191,219,254,0.15)_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-300/28 blur-3xl dark:bg-cyan-300/18" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-amber-300/26 blur-3xl dark:bg-blue-400/18" />

          <div className="relative grid items-center gap-8 lg:grid-cols-12 xl:gap-10">
            <div className="lg:col-span-6 xl:col-span-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/70 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-blue-100/60 dark:border-cyan-300/35 dark:bg-slate-900/85 dark:text-cyan-50 dark:shadow-black/30">
                <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-200" />
                {t.heroEyebrow}
              </div>

              <h1 className="max-w-[14ch] text-[clamp(2.4rem,7vw,5.5rem)] font-black leading-[0.93] tracking-[-0.042em] text-slate-900 dark:text-slate-50">
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
                className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-blue-100/88"
              >
                {t.heroSubtitle}
              </p>

              <div data-hero-cta className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-blue-600 px-7 text-base text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 hover:shadow-blue-400/35 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
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
                  className="h-12 rounded-full border-blue-500/65 bg-white/65 px-7 text-base text-blue-700 transition-colors hover:bg-white/90 dark:border-cyan-200/45 dark:bg-slate-900/65 dark:text-cyan-100 dark:hover:bg-slate-900/90"
                >
                  <a href="#flow">{t.seeFlow}</a>
                </Button>
              </div>

              <div data-hero-badges className="mt-6 flex flex-wrap gap-2.5">
                {[t.freeBadge, t.langBadge, t.uploadBadge].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-slate-300/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200/75 dark:border-blue-200/25 dark:bg-slate-900/72 dark:text-blue-50/95"
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
                  className="pointer-events-none absolute inset-x-12 top-10 h-44 rounded-full bg-[radial-gradient(circle,rgba(84,169,255,0.82)_0%,rgba(66,124,255,0.52)_42%,rgba(35,56,145,0)_78%)] opacity-0 blur-3xl"
                />
                <Card className="relative overflow-hidden rounded-[1.85rem] border-slate-200/80 bg-white/72 p-5 shadow-2xl shadow-blue-200/70 backdrop-blur-2xl dark:border-white/16 dark:bg-slate-950/72 dark:shadow-black/55">
                  <div className="pointer-events-none absolute -top-20 right-[-5.5rem] h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-300/22" />
                  <div className="pointer-events-none absolute bottom-0 left-[-5rem] h-40 w-40 rounded-full bg-blue-300/22 blur-3xl dark:bg-blue-400/24" />

                  <div className="relative mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{t.previewTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-blue-100/80">{t.previewSubtitle}</p>
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
                    className="relative mx-auto w-full max-w-[16.5rem] drop-shadow-[0_24px_40px_rgba(15,23,42,0.24)] dark:drop-shadow-[0_24px_44px_rgba(2,6,23,0.7)] md:max-w-[18rem]"
                  />

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[t.previewTab1, t.previewTab2, t.previewTab3].map((tab, idx) => (
                      <div
                        key={tab}
                        className={`rounded-xl px-2 py-1.5 text-center text-[11px] font-medium ${
                          idx === 0
                            ? "bg-blue-600 text-white dark:bg-blue-500/35 dark:text-blue-50"
                            : "bg-white/85 text-slate-600 dark:bg-slate-900/80 dark:text-zinc-200"
                        }`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/86 p-2 text-[11px] text-slate-700 dark:border-white/12 dark:bg-slate-900/76 dark:text-zinc-200">
                      <FileText className="h-3.5 w-3.5 text-blue-500 dark:text-cyan-300" />
                      {t.previewWidgetQuizNotes}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/86 p-2 text-[11px] text-slate-700 dark:border-white/12 dark:bg-slate-900/76 dark:text-zinc-200">
                      <Mic className="h-3.5 w-3.5 text-cyan-500" />
                      {t.previewWidgetPodcast}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="flow" className="container mx-auto max-w-7xl px-4 pb-14">
        <div data-reveal className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-zinc-50">{t.flowTitle}</h2>
          <p className="mt-2 text-slate-600 dark:text-zinc-300">{t.flowSubtitle}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
            {[
              { icon: Upload, title: t.step1Title, desc: t.step1Desc },
              { icon: WandSparkles, title: t.step2Title, desc: t.step2Desc },
              { icon: Bot, title: t.step3Title, desc: t.step3Desc },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  data-reveal
                  className="h-full rounded-2xl border border-slate-200 bg-white/82 p-5 shadow-sm backdrop-blur-xl transition-transform duration-500 hover:scale-[1.02] hover:shadow-lg dark:border-white/12 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
                >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/12">
                  <Icon className="h-4.5 w-4.5 text-blue-500" />
                </div>
                <p className="mb-2 text-sm font-medium text-slate-900 dark:text-zinc-100">{item.title}</p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="transition-zone" className="container mx-auto max-w-7xl px-4 pb-16">
        <div
          data-reveal
          className="rounded-[2rem] border border-slate-300/70 bg-white/78 p-8 shadow-xl shadow-slate-200/80 backdrop-blur-xl md:p-10 dark:border-white/16 dark:bg-white/[0.06] dark:shadow-none"
        >
          <p data-invert className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-300/75">
            Aide Transition System
          </p>
          <h2 data-invert className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl dark:text-zinc-50">
            {t.transitionTitle}
          </h2>
          <p data-invert className="mt-3 max-w-3xl text-base text-slate-600 md:text-lg dark:text-zinc-300">
            {t.transitionSubtitle}
          </p>
        </div>
      </section>

      <section id="blue-section" className="relative pb-16 pt-12 text-slate-50">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.22),transparent_48%),radial-gradient(circle_at_85%_16%,rgba(122,190,255,0.3),transparent_42%),linear-gradient(180deg,rgba(9,29,80,0.42)_0%,rgba(7,22,63,0.74)_100%)]" />

        <section className="container mx-auto max-w-7xl px-4 pb-16">
          <div data-reveal className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">{t.featuresTitle}</h2>
            <p className="mt-2 text-blue-100/80">{t.featuresSubtitle}</p>
          </div>

          <div className="grid auto-rows-[minmax(220px,1fr)] gap-3 md:grid-cols-2 lg:grid-cols-12">
            {t.featureCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  data-bento-card
                  className={`group ${bentoClasses[idx % bentoClasses.length]}`}
                >
                  <Card className="h-full rounded-2xl border-white/20 bg-white/[0.08] p-5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-cyan-200/60 hover:bg-white/[0.14]">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                        <Icon className="h-4.5 w-4.5 text-blue-100" />
                      </div>
                      <div className="inline-flex items-center text-[10px] uppercase tracking-wider text-blue-100/75">
                        <Check className="mr-1 h-3 w-3" />
                        {t.shipped}
                      </div>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-50">{card.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-blue-100/85">{card.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {card.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-md border border-white/18 bg-black/20 px-2 py-1 text-[11px] text-blue-50/90"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </Card>
                </article>
              );
            })}
          </div>
        </section>

        <section
          ref={stickySectionRef}
          className="container mx-auto max-w-7xl px-4 pb-16"
        >
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div
                ref={stickyPinRef}
                className="rounded-3xl border border-white/24 bg-gradient-to-b from-white/[0.22] via-white/[0.12] to-white/[0.07] p-6 shadow-[0_18px_42px_rgba(2,12,37,0.35)] backdrop-blur-2xl lg:top-28 lg:p-7"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/75">
                  Live Capability Stack
                </p>
                <h3 className="mt-3 max-w-[18ch] break-words text-[clamp(1.85rem,3vw,2.6rem)] font-semibold leading-[1.08] tracking-tight text-slate-50">
                  {t.capabilitiesTitle}
                </h3>
                <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-blue-100/90 md:text-[15px]">
                  {t.capabilitiesSubtitle}
                </p>
              </div>
            </div>

            <div ref={stickyTrackRef} className="space-y-3 lg:col-span-7">
              {t.capabilityItems.map((item, index) => (
                <div
                  key={item}
                  data-sticky-card
                  className="flex items-start gap-3 rounded-2xl border border-white/20 bg-slate-950/35 px-4 py-4 shadow-[0_10px_28px_rgba(2,12,37,0.24)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-200/65 hover:bg-slate-900/48"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-200/45 bg-cyan-300/16 text-[11px] font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <p className="break-words text-sm leading-7 text-blue-50/95 md:text-[15px] md:leading-7">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 pb-16">
          <div
            data-reveal
            className="rounded-3xl border border-white/18 bg-white/[0.08] p-7 backdrop-blur-xl md:p-10"
          >
            <div className="max-w-3xl">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-4xl">
                {t.ctaTitle}
              </h3>
              <p className="mt-4 text-base text-blue-100/85">{t.ctaSubtitle}</p>
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

        <footer className="container mx-auto max-w-7xl px-4 pb-10">
          <div className="rounded-3xl border-t border-[rgba(255,255,255,0.1)] bg-gradient-to-b from-slate-950/88 via-slate-950/92 to-blue-950/92 px-6 py-8 shadow-[0_-18px_45px_rgba(2,6,23,0.28)] md:px-8 md:py-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Product</h4>
                <div className="mt-4 flex flex-col gap-2.5 text-sm font-medium">
                  <Link to="/help" className="text-white/60 transition-colors duration-300 hover:text-white">
                    About Page
                  </Link>
                  <a href="#flow" className="text-white/60 transition-colors duration-300 hover:text-white">
                    How it Works
                  </a>
                  <a href="#blue-section" className="text-white/60 transition-colors duration-300 hover:text-white">
                    Success Stories
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
