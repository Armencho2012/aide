import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Layers, Bot, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import type { User } from '@supabase/supabase-js';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface LessonSection {
  title: string;
  summary: string;
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

const STORAGE_KEY = 'aide_user_content';

const uiLabels = {
  en: {
    backToLibrary: 'Back to Library',
    summary: 'Key Summary',
    sections: 'Lesson Sections',
    terms: 'Key Terms',
    studyTools: 'Study Tools',
    quiz: 'Practice Quiz',
    flashcards: 'Flashcards',
    chat: 'Ask AI',
    exportPdf: 'Export as PDF',
    exporting: 'Exporting...'
  },
  ru: {
    backToLibrary: 'Назад в библиотеку',
    summary: 'Ключевое Резюме',
    sections: 'Разделы урока',
    terms: 'Ключевые Термины',
    studyTools: 'Инструменты обучения',
    quiz: 'Практический тест',
    flashcards: 'Карточки',
    chat: 'Спросить ИИ',
    exportPdf: 'Экспорт в PDF',
    exporting: 'Экспортируем...'
  },
  hy: {
    backToLibrary: 'Հdelays դdelays delays',
    summary: 'Հdelays delays',
    sections: 'Delays delays',
    terms: 'Հdelays delays',
    studyTools: 'Delays delays',
    quiz: 'Delays delays',
    flashcards: 'Delays',
    chat: 'Delays Delays-ին',
    exportPdf: 'Delays PDF',
    exporting: 'Delays...'
  },
  ko: {
    backToLibrary: '라이브러리로 돌아가기',
    summary: '주요 요약',
    sections: '수업 구성',
    terms: '주요 용어',
    studyTools: '학습 도구',
    quiz: '연습 퀴즈',
    flashcards: '플래시카드',
    chat: 'AI에게 질문',
    exportPdf: 'PDF로 내보내기',
    exporting: '내보내는 중...'
  }
};

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      if (id) fetchContent(id, session.user.id);
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

  const fetchContent = (contentId: string, userId: string) => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      const items: ContentItem[] = stored ? JSON.parse(stored) : [];
      const item = items.find(i => i.id === contentId);
      
      if (!item) {
        navigate('/library');
        return;
      }
      
      setContent(item);
    } catch (error) {
      console.error('Error fetching content:', error);
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

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
        const termsText = content.analysis_data.key_terms.join(', ');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm md:text-base">Loading content...</p>
        </div>
      </div>
    );
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
      <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
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
          <Button onClick={handleExportPdf} disabled={exporting} variant="outline" size="sm" className="w-fit">
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            <span className="text-sm">{exporting ? labels.exporting : labels.exportPdf}</span>
          </Button>
        </div>

        <Card className="mb-6 sm:mb-8 border-primary/20 shadow-md">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">{labels.studyTools}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Button asChild size="default" className="flex-1 min-w-[120px] text-sm sm:text-base">
                <Link to={`/library/${id}/quiz`}>
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {labels.quiz}
                </Link>
              </Button>
              <Button asChild size="default" variant="secondary" className="flex-1 min-w-[120px] text-sm sm:text-base">
                <Link to={`/library/${id}/flashcards`}>
                  <Layers className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {labels.flashcards}
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="flex-1 min-w-[120px] text-sm sm:text-base">
                <Link to={`/library/${id}/chat`}>
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {labels.chat}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {analysisData?.three_bullet_summary && (
          <Card className="mb-4 sm:mb-6 border-primary/20 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
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
          <Card className="mb-4 sm:mb-6 border-secondary/20 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-secondary-foreground text-base sm:text-lg">{labels.sections}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {analysisData.lesson_sections.map((section: LessonSection, index: number) => (
                <div key={index} className="space-y-1 sm:space-y-2">
                  <p className="font-semibold text-base sm:text-lg text-primary">{section.title}</p>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{section.summary}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {analysisData?.key_terms && analysisData.key_terms.length > 0 && (
          <Card className="border-accent/20 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-accent text-base sm:text-lg">{labels.terms}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysisData.key_terms.map((term: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base">
                    {term}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContentDetail;