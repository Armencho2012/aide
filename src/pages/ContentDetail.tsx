import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { ContentChat } from '@/components/ContentChat';
import type { User } from '@supabase/supabase-js';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface ContentItem {
  id: string;
  title: string | null;
  original_text: string;
  analysis_data: any;
  language: string | null;
  created_at: string | null;
  user_id: string;
}

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      if (id) fetchContent(id);
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

  const fetchContent = async (contentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;
      setContent(data as ContentItem);
    } catch (error) {
      console.error('Error fetching content:', error);
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Content not found</p>
          <Button asChild>
            <Link to="/library">Back to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  const language = (content.language as Language) || 'en';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild>
            <Link to="/library">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Link>
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
            {content.title || 'Untitled'}
          </h1>
        </div>

        {/* Main content layout - Analysis on left, Chat on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Analysis Output */}
          <div className="lg:col-span-2 space-y-6">
            {content.analysis_data && (
              <AnalysisOutput data={content.analysis_data} language={language} />
            )}
          </div>

          {/* Right side - AI Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ContentChat 
                contentText={content.original_text}
                analysisData={content.analysis_data}
                language={language}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
