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
  FileText,
  Globe,
  HelpCircle,
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
    signIn: "Sign In",
    heroEyebrow: "Codex-Grade Study Engine",
    heroTitle: "Turn Notes Into Quizzes, Maps, and Tutor Chat in Seconds",
    heroSubtitle:
      "Aide converts notes, PDFs, and images into structured study systems with summaries, flashcards, neural maps, course plans, and AI podcast audio.",
    startNow: "Start Free Analysis",
    seeFlow: "See Product Flow",
    freeBadge: "1 free analysis/day",
    langBadge: "4 languages",
    uploadBadge: "PDF + image + voice input",
    previewTitle: "Live Codex Workspace",
    previewSubtitle: "Product-first interface preview",
    previewTab1: "Analysis",
    previewTab2: "Neural Map",
    previewTab3: "Tutor Chat",
    previewStream: "AI stream active",
    previewWidgetQuizNotes: "Quiz + Notes",
    previewWidgetPodcast: "Podcast",
    previewNodeCore: "Core Concept",
    previewNodeQuiz: "Quiz Node",
    previewNodeChat: "Chat Node",
    flowTitle: "How It Works",
    flowSubtitle: "Three steps. No setup friction.",
    step1Title: "Drop Material",
    step1Desc: "Paste text, upload PDF/image, or dictate with voice input.",
    step2Title: "Select Outputs",
    step2Desc: "Toggle quiz, flashcards, map, course, podcast, and question counts.",
    step3Title: "Train Faster",
    step3Desc: "Study with active recall, AI tutor chat, map gap scanning, and exports.",
    featuresTitle: "Bento Feature Grid",
    featuresSubtitle: "Shipped capabilities already in the codebase.",
    capabilitiesTitle: "Full Capability Matrix",
    capabilitiesSubtitle: "Every shipped workflow surfaced from the current codebase.",
    capabilityItems: [
      "Text, PDF, and image ingestion with drag-and-drop upload",
      "Browser voice dictation (Web Speech API) mapped to app language",
      "Per-run generation toggles: quiz, flashcards, map, course, podcast",
      "Question and flashcard count sliders by plan limits (Free/Pro/Class)",
      "Key summaries, key terms, lesson sections, and 7-day study plan outputs",
      "Interactive quiz mode with explanations and retry loop",
      "Flashcard deck with confidence tracking and fast review controls",
      "Streaming tutor chat for both content sessions and general chat sessions",
      "Neural map studio with radial/force layouts, edge filters, and label toggles",
      "Gap scan workflow with ghost-node suggestions and accept/dismiss controls",
      "Exports: PDF, map image (.png), structured outline (.md), Notion-ready copy",
      "Library search/filter tabs, course views, and missing-asset regeneration",
      "AI podcast generation with playback, seeking, mute, and download",
      "Multilingual UI in English, Russian, Armenian, and Korean",
    ],
    ctaTitle: "Study Like It’s 2026",
    ctaSubtitle:
      "Replace scattered notes with one focused AI study workspace that actually trains retention.",
    readGuide: "Read Prompting Guide",
    footer: "© 2026 Aide. AI-native study workflows.",
    plans: "Plans",
    shipped: "shipped",
    featureCards: [
      {
        icon: Sparkles,
        title: "AI Analysis Core",
        description: "3-bullet summaries, key terms, lesson sections, and multilingual generation.",
        chips: ["Summaries", "Key Terms", "Lesson Sections", "Markdown"]
      },
      {
        icon: FileText,
        title: "Quiz + Flashcards",
        description: "Auto quiz with explanations and flashcards with adjustable quantity controls.",
        chips: ["Question Slider", "Answer Explanations", "Confidence Tracking"]
      },
      {
        icon: Map,
        title: "Neural Maps",
        description: "Interactive knowledge graph with edge filters, layouts, zen mode, and gap scanning.",
        chips: ["Radial/Force", "Ghost Nodes", "Outline Export"]
      },
      {
        icon: MessageSquare,
        title: "Tutor Chat",
        description: "Streaming contextual chat for both content-based and general sessions.",
        chips: ["Streaming", "Context Memory", "Math Support"]
      },
      {
        icon: Mic,
        title: "Podcast Engine",
        description: "Two-speaker AI podcast generation with playback, seek, and download.",
        chips: ["Audio TTS", "Download", "Content-linked"]
      },
      {
        icon: Library,
        title: "Library + Export",
        description: "Searchable archive with content-type filters, PDF export, and asset regeneration.",
        chips: ["Analyses", "Chats", "Courses", "Regenerate Missing"]
      },
    ],
  },
  ru: {
    contact: "Контакт",
    help: "Помощь",
    signIn: "Войти",
    heroEyebrow: "Учебный движок уровня Codex",
    heroTitle: "Превращайте заметки в тесты, карты и AI-чат за секунды",
    heroSubtitle:
      "Aide преобразует заметки, PDF и изображения в структурированную систему обучения: конспекты, карточки, нейрокарты, планы курса и AI-подкасты.",
    startNow: "Начать бесплатно",
    seeFlow: "Посмотреть процесс",
    freeBadge: "1 бесплатный анализ в день",
    langBadge: "4 языка",
    uploadBadge: "PDF + изображения + голос",
    previewTitle: "Рабочее пространство Codex",
    previewSubtitle: "Превью интерфейса продукта",
    previewTab1: "Анализ",
    previewTab2: "Нейрокарта",
    previewTab3: "AI-чат",
    previewStream: "AI поток активен",
    previewWidgetQuizNotes: "Тест + Конспект",
    previewWidgetPodcast: "Подкаст",
    previewNodeCore: "Ключевая идея",
    previewNodeQuiz: "Узел теста",
    previewNodeChat: "Узел чата",
    flowTitle: "Как это работает",
    flowSubtitle: "Три шага. Без сложной настройки.",
    step1Title: "Загрузите материал",
    step1Desc: "Вставьте текст, загрузите PDF/изображение или используйте голос.",
    step2Title: "Выберите результаты",
    step2Desc: "Включайте тесты, карточки, карту, курс, подкаст и количество вопросов.",
    step3Title: "Учитесь быстрее",
    step3Desc: "Практикуйтесь через активное повторение, AI-чат и экспорт материалов.",
    featuresTitle: "Bento-сетка функций",
    featuresSubtitle: "Все возможности уже реализованы в коде.",
    capabilitiesTitle: "Полная матрица возможностей",
    capabilitiesSubtitle: "Список всех рабочих функций, которые уже есть в текущей кодовой базе.",
    capabilityItems: [
      "Прием текста, PDF и изображений с drag-and-drop загрузкой",
      "Голосовой ввод в браузере (Web Speech API) с учетом выбранного языка",
      "Переключатели генерации: тест, карточки, карта, курс, подкаст",
      "Слайдеры количества вопросов и карточек по лимитам Free/Pro/Class",
      "Ключевые конспекты, термины, разделы урока и 7-дневный учебный план",
      "Интерактивный режим теста с объяснениями и повторной попыткой",
      "Колода карточек с трекингом уверенности и быстрым повторением",
      "Потоковый чат-тьютор для контента и для общих диалоговых сессий",
      "Нейрокарта с radial/force layout, фильтрами связей и переключением ярлыков",
      "Gap scan с ghost-узлами и действиями принять/скрыть",
      "Экспорт: PDF, карта (.png), структурный outline (.md), копирование для Notion",
      "Поиск и фильтры библиотеки, режим курсов и регенерация недостающих активов",
      "Генерация AI-подкаста с воспроизведением, перемоткой, mute и загрузкой",
      "Мультиязычный интерфейс: EN, RU, HY, KO",
    ],
    ctaTitle: "Учитесь в стиле 2026",
    ctaSubtitle:
      "Замените разрозненные заметки на единое AI-пространство, которое реально улучшает запоминание.",
    readGuide: "Гайд по промптам",
    footer: "© 2026 Aide. AI-нативные учебные процессы.",
    plans: "Тарифы",
    shipped: "готово",
    featureCards: [
      {
        icon: Sparkles,
        title: "AI-анализ",
        description: "3 ключевых вывода, термины, разделы урока и многоязычная генерация.",
        chips: ["Конспект", "Термины", "Разделы", "Markdown"]
      },
      {
        icon: FileText,
        title: "Тесты и карточки",
        description: "Авто-вопросы с объяснениями и карточки с настройкой количества.",
        chips: ["Слайдер вопросов", "Объяснения", "Уверенность"]
      },
      {
        icon: Map,
        title: "Нейрокарты",
        description: "Интерактивный граф знаний с фильтрами, режимами и поиском пробелов.",
        chips: ["Radial/Force", "Ghost-ноды", "Экспорт"]
      },
      {
        icon: MessageSquare,
        title: "AI-тьютор чат",
        description: "Потоковый контекстный чат для материалов и общих сессий.",
        chips: ["Streaming", "Память", "Математика"]
      },
      {
        icon: Mic,
        title: "Подкаст-движок",
        description: "Генерация двухспикерных AI-подкастов с воспроизведением и скачиванием.",
        chips: ["TTS", "Скачивание", "Привязка к контенту"]
      },
      {
        icon: Library,
        title: "Библиотека и экспорт",
        description: "Поиск, фильтры по типам контента, PDF-экспорт и регенерация ассетов.",
        chips: ["Анализы", "Чаты", "Курсы", "Восстановление"]
      },
    ],
  },
  hy: {
    contact: "Կապ",
    help: "Օգնություն",
    signIn: "Մուտք",
    heroEyebrow: "Codex մակարդակի ուսումնական շարժիչ",
    heroTitle: "Վերածեք նշումները թեստերի, քարտեզների և AI զրույցի՝ վայրկյանների ընթացքում",
    heroSubtitle:
      "Aide-ը փոխակերպում է նշումները, PDF-երը և պատկերները կառուցվածքային ուսուցման համակարգի՝ ամփոփումներ, քարտեր, նեյրոնային քարտեզներ, դասընթացի պլան և AI պոդկաստ:",
    startNow: "Սկսել անվճար",
    seeFlow: "Տեսնել հոսքը",
    freeBadge: "Օրական 1 անվճար վերլուծություն",
    langBadge: "4 լեզու",
    uploadBadge: "PDF + պատկեր + ձայն",
    previewTitle: "Codex աշխատանքային տարածք",
    previewSubtitle: "Արտադրանքի ինտերֆեյսի նախադիտում",
    previewTab1: "Վերլուծություն",
    previewTab2: "Նեյրոնային քարտեզ",
    previewTab3: "AI զրույց",
    previewStream: "AI հոսքը ակտիվ է",
    previewWidgetQuizNotes: "Թեստ + Նշումներ",
    previewWidgetPodcast: "Պոդկաստ",
    previewNodeCore: "Հիմնական գաղափար",
    previewNodeQuiz: "Թեստի հանգույց",
    previewNodeChat: "Զրույցի հանգույց",
    flowTitle: "Ինչպես է աշխատում",
    flowSubtitle: "3 քայլ։ Առանց բարդ կարգավորման։",
    step1Title: "Ավելացրեք նյութը",
    step1Desc: "Տեղադրեք տեքստ, վերբեռնեք PDF/պատկեր կամ օգտագործեք ձայնային մուտք:",
    step2Title: "Ընտրեք ելքերը",
    step2Desc: "Միացրեք թեստ, քարտեր, քարտեզ, դասընթաց, պոդկաստ և քանակները:",
    step3Title: "Սովորեք արագ",
    step3Desc: "Սովորեք ակտիվ հիշողությամբ, AI զրույցով և արտահանմամբ:",
    featuresTitle: "Bento հնարավորությունների ցանց",
    featuresSubtitle: "Այս բոլորը արդեն կոդային բազայում են:",
    capabilitiesTitle: "Ամբողջական հնարավորությունների մատրիցա",
    capabilitiesSubtitle: "Ընթացիկ կոդային բազայում առկա բոլոր գործառույթների ամբողջ ցուցակը.",
    capabilityItems: [
      "Տեքստ, PDF և պատկերների մուտք՝ drag-and-drop վերբեռնմամբ",
      "Բրաուզերի ձայնային մուտք (Web Speech API) ընտրված լեզվով",
      "Սերնդման ընտրանքներ՝ թեստ, քարտեր, քարտեզ, դասընթաց, պոդկաստ",
      "Հարցերի և քարտերի քանակի սլայդերներ ըստ Free/Pro/Class պլանի",
      "Ամփոփումներ, տերմիններ, դասի բաժիններ և 7-օրյա ուսումնական պլան",
      "Ինտերակտիվ թեստ՝ բացատրություններով և կրկնակի փորձով",
      "Քարտերի տախտակ՝ վստահության նշումով և արագ կրկնությամբ",
      "Հոսքային tutor chat՝ ինչպես նյութի, այնպես էլ ընդհանուր զրույցի համար",
      "Neural map՝ radial/force դասավորությամբ, կապերի ֆիլտրերով և label control-ով",
      "Gap scan workflow՝ ghost node առաջարկներով և accept/dismiss գործողություններով",
      "Արտահանում՝ PDF, քարտեզի պատկեր (.png), structured outline (.md), Notion copy",
      "Գրադարանի որոնում/ֆիլտրեր, course view և missing-assets regeneration",
      "AI պոդկաստի գեներացում՝ playback, seek, mute և download հնարավորությամբ",
      "Բազմալեզու UI՝ EN, RU, HY, KO",
    ],
    ctaTitle: "Սովորեք 2026-ի ոճով",
    ctaSubtitle:
      "Փոխարինեք ցրված նշումները մեկ կենտրոնացված AI միջավայրով, որը իրականում ամրացնում է գիտելիքը:",
    readGuide: "Prompt ուղեցույց",
    footer: "© 2026 Aide. AI-առաջնային ուսումնական հոսքեր:",
    plans: "Պլաններ",
    shipped: "պատրաստ",
    featureCards: [
      {
        icon: Sparkles,
        title: "AI վերլուծության միջուկ",
        description: "3 կետանոց ամփոփում, հիմնական տերմիններ, բաժիններ և բազմալեզու արդյունք:",
        chips: ["Ամփոփում", "Տերմիններ", "Բաժիններ", "Markdown"]
      },
      {
        icon: FileText,
        title: "Թեստեր և քարտեր",
        description: "Ավտոմատ հարցեր բացատրություններով և քարտերի քանակի կառավարում:",
        chips: ["Սլայդեր", "Բացատրություն", "Վստահություն"]
      },
      {
        icon: Map,
        title: "Նեյրոնային քարտեզներ",
        description: "Ինտերակտիվ գիտելիքի գրաֆ՝ զտիչներով, դասավորությամբ և բացթողումների սկանով:",
        chips: ["Radial/Force", "Ghost հանգույցներ", "Արտահանում"]
      },
      {
        icon: MessageSquare,
        title: "AI դասատու զրույց",
        description: "Հոսքային համատեքստային զրույց ինչպես նյութերի, այնպես էլ ընդհանուր հարցերի համար:",
        chips: ["Streaming", "Հիշողություն", "Մաթ"]
      },
      {
        icon: Mic,
        title: "Պոդկաստ շարժիչ",
        description: "Երկխոսային AI պոդկաստի ստեղծում՝ լսելու և ներբեռնելու հնարավորությամբ:",
        chips: ["TTS", "Ներբեռնում", "Կապ բովանդակության հետ"]
      },
      {
        icon: Library,
        title: "Գրադարան և արտահանում",
        description: "Որոնում, տեսակային զտիչներ, PDF արտահանում և բացակա ակտիվների վերագեներացում:",
        chips: ["Վերլուծություն", "Զրույց", "Դասընթաց", "Վերագեներացում"]
      },
    ],
  },
  ko: {
    contact: "문의",
    help: "도움말",
    signIn: "로그인",
    heroEyebrow: "Codex급 학습 엔진",
    heroTitle: "노트를 몇 초 만에 퀴즈, 맵, 튜터 채팅으로 전환",
    heroSubtitle:
      "Aide는 노트, PDF, 이미지를 요약, 플래시카드, 신경망 맵, 코스 플랜, AI 팟캐스트로 변환합니다.",
    startNow: "무료로 시작",
    seeFlow: "플로우 보기",
    freeBadge: "하루 1회 무료 분석",
    langBadge: "4개 언어",
    uploadBadge: "PDF + 이미지 + 음성 입력",
    previewTitle: "Codex 워크스페이스",
    previewSubtitle: "제품 UI 미리보기",
    previewTab1: "분석",
    previewTab2: "신경망 맵",
    previewTab3: "튜터 채팅",
    previewStream: "AI 스트림 활성",
    previewWidgetQuizNotes: "퀴즈 + 노트",
    previewWidgetPodcast: "팟캐스트",
    previewNodeCore: "핵심 개념",
    previewNodeQuiz: "퀴즈 노드",
    previewNodeChat: "채팅 노드",
    flowTitle: "작동 방식",
    flowSubtitle: "3단계. 설정 부담 없음.",
    step1Title: "자료 입력",
    step1Desc: "텍스트 붙여넣기, PDF/이미지 업로드, 음성 입력 사용.",
    step2Title: "출력 선택",
    step2Desc: "퀴즈, 카드, 맵, 코스, 팟캐스트와 수량을 선택.",
    step3Title: "더 빠른 학습",
    step3Desc: "능동 회상, AI 튜터 채팅, 맵 갭 스캔, 내보내기로 학습.",
    featuresTitle: "Bento 기능 그리드",
    featuresSubtitle: "코드베이스에 이미 구현된 기능들.",
    capabilitiesTitle: "전체 기능 매트릭스",
    capabilitiesSubtitle: "현재 코드베이스에서 실제로 동작 중인 모든 워크플로우.",
    capabilityItems: [
      "텍스트, PDF, 이미지 입력 + 드래그 앤 드롭 업로드",
      "브라우저 음성 입력(Web Speech API)과 언어 매핑",
      "생성 토글: 퀴즈, 플래시카드, 맵, 코스, 팟캐스트",
      "플랜별 문제/카드 수량 슬라이더(Free/Pro/Class)",
      "핵심 요약, 핵심 용어, 레슨 섹션, 7일 학습 플랜 생성",
      "해설 및 재시도를 포함한 인터랙티브 퀴즈 모드",
      "자신감 추적을 포함한 플래시카드 리뷰 덱",
      "콘텐츠형/일반형 세션 모두 지원하는 스트리밍 튜터 채팅",
      "Radial/Force 레이아웃, 엣지 필터, 라벨 토글을 지원하는 Neural Map",
      "Ghost 노드 제안 + 수락/제외 제어가 있는 갭 스캔 워크플로우",
      "내보내기: PDF, 맵 이미지(.png), 구조화 아웃라인(.md), Notion 복사",
      "라이브러리 검색/필터 탭, 코스 보기, 누락 자산 재생성",
      "AI 팟캐스트 생성 + 재생, 탐색, 음소거, 다운로드",
      "다국어 UI 지원: EN, RU, HY, KO",
    ],
    ctaTitle: "2026 방식으로 공부하세요",
    ctaSubtitle:
      "흩어진 노트를 실제 기억력을 높이는 단일 AI 학습 워크스페이스로 교체하세요.",
    readGuide: "프롬프트 가이드",
    footer: "© 2026 Aide. AI-네이티브 학습 워크플로우.",
    plans: "요금제",
    shipped: "배포됨",
    featureCards: [
      {
        icon: Sparkles,
        title: "AI 분석 코어",
        description: "3줄 요약, 핵심 용어, 레슨 섹션, 다국어 생성.",
        chips: ["요약", "핵심 용어", "섹션", "Markdown"]
      },
      {
        icon: FileText,
        title: "퀴즈 + 플래시카드",
        description: "해설 포함 자동 퀴즈와 수량 조절 가능한 카드 생성.",
        chips: ["문항 슬라이더", "해설", "난이도 체감"]
      },
      {
        icon: Map,
        title: "신경망 맵",
        description: "필터/레이아웃/갭 스캔이 가능한 인터랙티브 지식 그래프.",
        chips: ["Radial/Force", "Ghost 노드", "아웃라인 내보내기"]
      },
      {
        icon: MessageSquare,
        title: "튜터 채팅",
        description: "콘텐츠 기반/일반 모드 모두 지원하는 스트리밍 채팅.",
        chips: ["Streaming", "문맥 기억", "수식 지원"]
      },
      {
        icon: Mic,
        title: "팟캐스트 엔진",
        description: "2인 대화형 AI 팟캐스트 생성, 재생/탐색/다운로드.",
        chips: ["TTS", "다운로드", "콘텐츠 연동"]
      },
      {
        icon: Library,
        title: "라이브러리 + 내보내기",
        description: "검색형 아카이브, 유형 필터, PDF 내보내기, 누락 자산 재생성.",
        chips: ["분석", "채팅", "코스", "재생성"]
      },
    ],
  },
};

const bentoClasses = [
  "xl:col-span-2",
  "xl:col-span-1",
  "xl:col-span-1 xl:row-span-2",
  "xl:col-span-2",
  "xl:col-span-1",
  "xl:col-span-1",
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

      const ctx = gsap.context(() => {
        if (prefersReducedMotion) {
          gsap.set("[data-hero-word], [data-hero-subtitle], [data-hero-cta], [data-hero-badges], [data-preview-panel], [data-reveal], [data-sticky-card], [data-bento-card]", {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            clearProps: "all",
          });
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

        media.add("(min-width: 1024px)", () => {
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
      };
    };

    void initMotion().catch((error) => {
      console.error("Failed to initialize landing motion runtime:", error);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [language]);

  return (
    <div
      ref={rootRef}
      className="min-h-screen overflow-x-hidden bg-[#05070b] text-zinc-100"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.12),transparent_45%),linear-gradient(180deg,#05070b_0%,#090d14_100%)]" />
      <div data-depth="halo" className="pointer-events-none fixed inset-x-0 top-[-25vh] -z-10 h-[55vh] bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.22),transparent_58%)]" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-50">Aide</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1">
              {languageSwitch.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    language === item.code
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-white"
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
              className="hidden text-zinc-300 hover:bg-white/10 hover:text-white sm:flex"
            >
              <a href="mailto:myaide.study@gmail.com">
                <Mail className="h-4 w-4" />
                {t.contact}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden text-zinc-300 hover:bg-white/10 hover:text-white sm:flex"
            >
              <Link to="/help">
                <HelpCircle className="h-4 w-4" />
                {t.help}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="border-white/20 bg-white/5 hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200">
              <Link to="/auth">{t.signIn}</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="container mx-auto max-w-7xl px-4 pb-14 pt-16 md:pt-20">
        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
              <Brain className="h-3.5 w-3.5 text-blue-400" />
              {t.heroEyebrow}
            </div>

            <h1 className="text-[clamp(2.35rem,7vw,5.65rem)] font-black leading-[0.94] tracking-[-0.045em] text-zinc-50">
              {heroWords.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  data-hero-word
                  className="mr-[0.18em] inline-block last:mr-0"
                >
                  {word}
                </span>
              ))}
            </h1>

            <p
              data-hero-subtitle
              className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg"
            >
              {t.heroSubtitle}
            </p>

            <div data-hero-cta className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400"
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
                className="border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
              >
                <a href="#flow">{t.seeFlow}</a>
              </Button>
            </div>

            <div data-hero-badges className="mt-6 flex flex-wrap gap-2">
              {[t.freeBadge, t.langBadge, t.uploadBadge].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div data-preview-panel data-depth="panel" className="lg:col-span-6">
            <div className="relative rounded-3xl border border-white/15 bg-white/[0.045] p-4 shadow-2xl shadow-black/45 backdrop-blur-2xl md:p-5">
              <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-blue-500/30 via-transparent to-cyan-400/30" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{t.previewTitle}</p>
                    <p className="text-xs text-zinc-500">{t.previewSubtitle}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    {t.previewStream}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[t.previewTab1, t.previewTab2, t.previewTab3].map((tab, idx) => (
                    <div
                      key={tab}
                      className={`rounded-xl px-3 py-2 text-center text-xs ${
                        idx === 0 ? "bg-white/15 text-white" : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <Card className="rounded-2xl border-white/10 bg-black/25 p-4 md:col-span-3">
                    <div className="space-y-3">
                      <div className="h-2 w-3/4 rounded bg-white/15" />
                      <div className="h-2 rounded bg-white/10" />
                      <div className="h-2 w-5/6 rounded bg-white/10" />
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-zinc-300">
                          <FileText className="h-3.5 w-3.5 text-blue-400" /> {t.previewWidgetQuizNotes}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-zinc-300">
                          <Mic className="h-3.5 w-3.5 text-cyan-300" /> {t.previewWidgetPodcast}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-2xl border-white/10 bg-black/25 p-4 md:col-span-2">
                    <div className="relative h-full min-h-[150px]">
                      <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-blue-400/40 bg-blue-500/20 px-2 py-1 text-[10px] text-blue-200">
                        {t.previewNodeCore}
                      </div>
                      <div className="absolute bottom-10 left-4 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-1 text-[10px] text-cyan-100">
                        {t.previewNodeQuiz}
                      </div>
                      <div className="absolute bottom-8 right-4 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">
                        {t.previewNodeChat}
                      </div>
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 170" fill="none" aria-hidden="true">
                        <path d="M120 30 L70 112" stroke="rgba(148,163,184,0.5)" strokeWidth="1.2" />
                        <path d="M120 30 L168 110" stroke="rgba(148,163,184,0.5)" strokeWidth="1.2" />
                      </svg>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="flow" className="container mx-auto max-w-7xl px-4 pb-14">
        <div data-reveal className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">{t.flowTitle}</h2>
          <p className="mt-2 text-zinc-400">{t.flowSubtitle}</p>
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
                  className="h-full rounded-2xl border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-transform duration-500 hover:scale-[1.02] hover:bg-white/[0.07]"
                >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4.5 w-4.5 text-blue-300" />
                </div>
                <p className="mb-2 text-sm font-medium text-zinc-100">{item.title}</p>
                <p className="text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-16">
        <div data-reveal className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">{t.featuresTitle}</h2>
          <p className="mt-2 text-zinc-400">{t.featuresSubtitle}</p>
        </div>

        <div className="grid auto-rows-[minmax(220px,1fr)] gap-3 md:grid-cols-2 xl:grid-cols-4">
          {t.featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                data-bento-card
                className={`group ${bentoClasses[idx % bentoClasses.length]}`}
              >
                <Card className="h-full rounded-2xl border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-cyan-300/30 hover:bg-white/[0.08]">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-4.5 w-4.5 text-blue-300" />
                    </div>
                    <div className="inline-flex items-center text-[10px] uppercase tracking-wider text-zinc-500">
                      <Check className="mr-1 h-3 w-3" />
                      {t.shipped}
                    </div>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-zinc-100">{card.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-zinc-400">{card.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {card.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-zinc-300"
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
        <div className="grid items-start gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div
              ref={stickyPinRef}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:top-28"
            >
              <h3 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">
                {t.capabilitiesTitle}
              </h3>
              <p className="mt-3 text-sm text-zinc-400 md:text-base">
                {t.capabilitiesSubtitle}
              </p>
            </div>
          </div>

          <div ref={stickyTrackRef} className="space-y-3 lg:col-span-8">
            {t.capabilityItems.map((item) => (
              <div
                key={item}
                data-sticky-card
                className="flex items-start gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl transition-all duration-500 hover:scale-[1.01] hover:border-cyan-300/35 hover:bg-black/45"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-sm leading-relaxed text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-16">
        <div
          data-reveal
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl md:p-10"
        >
          <div className="max-w-3xl">
            <h3 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
              {t.ctaTitle}
            </h3>
            <p className="mt-4 text-base text-zinc-400">{t.ctaSubtitle}</p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200">
              <Link to="/auth">
                {t.startNow}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
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
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-zinc-500 sm:flex-row">
          <p>{t.footer}</p>
          <div className="flex items-center gap-4">
            <Link
              to="/billing"
              className="flex items-center gap-1.5 transition-colors hover:text-zinc-300"
            >
              <Globe className="h-4 w-4" /> {t.plans}
            </Link>
            <a
              href="mailto:myaide.study@gmail.com"
              className="flex items-center gap-1.5 transition-colors hover:text-zinc-300"
            >
              <Mail className="h-4 w-4" /> {t.contact}
            </a>
            <Link
              to="/help"
              className="flex items-center gap-1.5 transition-colors hover:text-zinc-300"
            >
              <HelpCircle className="h-4 w-4" /> {t.help}
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
    </div>
  );
};

export default Landing;
