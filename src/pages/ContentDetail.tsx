import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Layers, Bot, Download, Map, PlayCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/hooks/useContent';
import { ContentDetailSkeleton } from '@/components/ui/skeleton-loader';
import { KnowledgeMap } from '@/components/KnowledgeMap';
import jsPDF from 'jspdf';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface LessonSection {
  title: string;
  summary: string;
}

const uiLabels = {
  en: {
    backToLibrary: 'Back to Library',
    summary: 'Key Summary',
    sections: 'Lesson Sections',
    terms: 'Key Terms',
    studyTools: 'Study Tools',
    quiz: 'Quiz',
    flashcards: 'Flashcards',
    chat: 'Ask AI',
    neuralMap: 'Neural Map',
    exportPdf: 'Export PDF',
    exporting: 'Exporting...',
    notFound: 'Content not found',
    commandCenter: 'Command Center',
    startCourse: 'Start Course',
    overview: 'Overview'
  },
  ru: {
    backToLibrary: 'Назад в библиотеку',
    summary: 'Ключевое Резюме',
    sections: 'Разделы урока',
    terms: 'Ключевые Термины',
    studyTools: 'Инструменты обучения',
    quiz: 'Тест',
    flashcards: 'Карточки',
    chat: 'Спросить ИИ',
    neuralMap: 'Нейронная карта',
    exportPdf: 'Экспорт PDF',
    exporting: 'Экспортируем...',
    notFound: 'Контент не найден',
    commandCenter: 'Центр управления',
    startCourse: 'Начать курс',
    overview: 'Обзор'
  },
  hy: {
    backToLibrary: 'Վdelays delays delays',
    summary: 'delays delays delays',
    sections: 'delays delays delays',
    terms: 'delays delays delays',
    studyTools: 'delays delays delays',
    quiz: 'delays',
    flashcards: 'delays delays',
    chat: 'delays delays',
    neuralMap: 'delays delays',
    exportPdf: 'delays delays',
    exporting: 'delays delays...',
    notFound: 'delays delays delays',
    commandCenter: 'delays delays',
    startCourse: 'delays delays',
    overview: 'delays'
  },
  ko: {
    backToLibrary: '라이브러리로 돌아가기',
    summary: '주요 요약',
    sections: '수업 구성',
    terms: '주요 용어',
    studyTools: '학습 도구',
    quiz: '퀴즈',
    flashcards: '플래시카드',
    chat: 'AI에게 질문',
    neuralMap: '신경망 맵',
    exportPdf: 'PDF 내보내기',
    exporting: '내보내는 중...',
    notFound: '콘텐츠를 찾을 수 없습니다',
    commandCenter: '명령 센터',
    startCourse: '코스 시작',
    overview: '개요'
  }
};

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { content, isLoading, isAuthChecked } = useContent({ id });
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleExportPdf = async () => {
    if (!content || !content.analysis_data) return;

    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let y = 20;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const title = content.title || 'Analysis';
      doc.text(title, margin, y);
      y += 15;

      if (content.analysis_data.three_bullet_summary) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Summary', margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        content.analysis_data.three_bullet_summary.forEach((point: string) => {
          const lines = doc.splitTextToSize(`• ${point}`, maxWidth);
          if (y + lines.length * 6 > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(lines, margin, y);
          y += lines.length * 6 + 3;
        });
        y += 10;
      }

      if (content.analysis_data.key_terms && content.analysis_data.key_terms.length > 0) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Terms', margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const termsText = content.analysis_data.key_terms.map((t: any) =>
          typeof t === 'string' ? t : t.term
        ).join(', ');
        const termsLines = doc.splitTextToSize(termsText, maxWidth);
        doc.text(termsLines, margin, y);
        y += termsLines.length * 6 + 10;
      }

      if (content.analysis_data.lesson_sections && content.analysis_data.lesson_sections.length > 0) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Lesson Sections', margin, y);
        y += 10;

        content.analysis_data.lesson_sections.forEach((section: LessonSection) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          const sectionTitleLines = doc.splitTextToSize(section.title, maxWidth);
          doc.text(sectionTitleLines, margin, y);
          y += sectionTitleLines.length * 6 + 3;

          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          const summaryLines = doc.splitTextToSize(section.summary, maxWidth);
          if (y + summaryLines.length * 6 > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(summaryLines, margin, y);
          y += summaryLines.length * 6 + 8;
        });
      }

      if (content.analysis_data.quiz_questions && content.analysis_data.quiz_questions.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Quiz Questions', margin, y);
        y += 10;

        content.analysis_data.quiz_questions.forEach((q: any, idx: number) => {
          if (y > 240) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          const questionLines = doc.splitTextToSize(`${idx + 1}. ${q.question}`, maxWidth);
          doc.text(questionLines, margin, y);
          y += questionLines.length * 6 + 3;

          doc.setFont('helvetica', 'normal');
          q.options.forEach((opt: string, optIdx: number) => {
            const prefix = optIdx === q.correct_answer_index ? '✓ ' : '  ';
            const optLines = doc.splitTextToSize(`${prefix}${String.fromCharCode(65 + optIdx)}. ${opt}`, maxWidth - 5);
            doc.text(optLines, margin + 5, y);
            y += optLines.length * 5 + 2;
          });
          y += 5;
        });
      }

      if (content.analysis_data.flashcards && content.analysis_data.flashcards.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Flashcards', margin, y);
        y += 10;

        content.analysis_data.flashcards.forEach((card: any, idx: number) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          const frontLines = doc.splitTextToSize(`${idx + 1}. ${card.front}`, maxWidth);
          doc.text(frontLines, margin, y);
          y += frontLines.length * 6 + 2;

          doc.setFont('helvetica', 'normal');
          const backLines = doc.splitTextToSize(`→ ${card.back}`, maxWidth);
          doc.text(backLines, margin + 5, y);
          y += backLines.length * 6 + 8;
        });
      }

      doc.save(`${content.title || 'analysis'}.pdf`);
      toast({
        title: 'Success',
        description: 'PDF exported successfully'
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  // Show skeleton while loading OR while auth is not yet checked
  if (!isAuthChecked || isLoading) {
    return <ContentDetailSkeleton />;
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4 text-sm md:text-base">Content not found</p>
          <Button asChild size="sm">
            <Link to="/library">Back to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  const language = (content.language as Language) || 'en';
  const labels = uiLabels[language];
  const analysisData = content.analysis_data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Button variant="ghost" asChild size="sm" className="w-fit">
              <Link to="/library">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="text-sm">{labels.backToLibrary}</span>
              </Link>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate max-w-[280px] sm:max-w-none">
              {content.title || 'Untitled'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportPdf} disabled={exporting} variant="outline" size="sm" className="w-fit">
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">{exporting ? labels.exporting : labels.exportPdf}</span>
            </Button>
          </div>
        </div>

        {/* Command Center - Study Tools Grid (2x2 on mobile, 4 on desktop) */}
        <Card className="mb-6 border-primary/20 shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {labels.commandCenter}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                onClick={() => setActiveTab('map')}
                variant={activeTab === 'map' ? 'default' : 'outline'}
                className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-sm"
              >
                <Map className="h-6 w-6 sm:h-8 sm:w-8" />
                <span>{labels.neuralMap}</span>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-sm"
              >
                <Link to={`/library/${id}/chat`}>
                  <Bot className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span>{labels.chat}</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-sm"
              >
                <Link to={`/library/${id}/flashcards`}>
                  <Layers className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span>{labels.flashcards}</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-sm"
              >
                <Link to={`/library/${id}/quiz`}>
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span>{labels.quiz}</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-card/50 p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.overview}</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.neuralMap}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {analysisData?.three_bullet_summary && (
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-primary text-base sm:text-lg">{labels.summary}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisData.three_bullet_summary.map((point: string, index: number) => (
                      <li key={index} className="flex gap-2 text-sm sm:text-base">
                        <span className="text-primary font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analysisData?.lesson_sections && analysisData.lesson_sections.length > 0 && (
              <Card className="border-secondary/20 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-secondary-foreground text-base sm:text-lg">{labels.sections}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisData.lesson_sections.map((section: LessonSection, index: number) => (
                    <div key={index} className="space-y-1">
                      <p className="font-semibold text-base sm:text-lg text-primary">{section.title}</p>
                      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{section.summary}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysisData?.key_terms && analysisData.key_terms.length > 0 && (
              <Card className="border-accent/20 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-accent text-base sm:text-lg">{labels.terms}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.key_terms.map((termItem: string | { term: string }, index: number) => {
                      const term = typeof termItem === 'string' ? termItem : termItem.term;
                      return (
                        <Badge key={index} variant="secondary" className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base">
                          {term}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Neural Map Tab - Dedicated Full Space */}
          <TabsContent value="map" className="mt-0">
            <Card className="border-primary/20 shadow-lg overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Map className="h-5 w-5 text-primary" />
                  {labels.neuralMap}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] sm:h-[600px] md:h-[700px]">
                  <KnowledgeMap 
                    data={analysisData?.knowledge_map}
                    onNodeClick={(label, description) => {
                      toast({
                        title: label,
                        description: description || 'No additional details'
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentDetail;
