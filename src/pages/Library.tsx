import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Eye, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContentItem {
  id: string;
  title: string | null;
  original_text: string;
  analysis_data: unknown;
  language: string | null;
  created_at: string | null;
  user_id: string;
}

const Library = () => {
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchContent = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_content')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent((data as ContentItem[]) || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      fetchContent(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate, fetchContent]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContent(prev => prev.filter(item => item.id !== id));
      toast({ title: 'Deleted', description: 'Content removed from library' });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }, []);

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return content;
    const query = searchQuery.toLowerCase();
    return content.filter(
      item =>
        item.title?.toLowerCase().includes(query) ||
        item.original_text?.toLowerCase().includes(query)
    );
  }, [content, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Library
            </h1>
          </div>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your content..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredContent.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No content matches your search.' : 'No content saved yet. Analyze some text to get started!'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContent.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer"
                onClick={() => navigate(`/library/${item.id}`)}
              >
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg line-clamp-2">{item.title || 'Untitled'}</h3>
                    {item.language && (
                      <span className="text-xs px-2 py-1 bg-muted rounded-full whitespace-nowrap ml-2">
                        {item.language}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {item.original_text}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete content"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Content?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this content from your library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => itemToDelete && handleDelete(itemToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Library;
