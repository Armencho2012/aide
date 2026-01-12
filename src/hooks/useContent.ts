import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'aide_user_content';

export interface ContentItem {
  id: string;
  title: string | null;
  original_text: string;
  analysis_data: any;
  language: string | null;
  created_at: string | null;
  user_id: string;
}

interface UseContentOptions {
  id?: string;
  redirectOnNotFound?: boolean;
}

interface UseContentResult {
  user: User | null;
  content: ContentItem | null;
  contentList: ContentItem[];
  isLoading: boolean;
  isAuthChecked: boolean;
  deleteContent: (id: string) => void;
  refetch: () => void;
}

export const useContent = (options: UseContentOptions = {}): UseContentResult => {
  const { id, redirectOnNotFound = true } = options;
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const navigate = useNavigate();

  const fetchContent = useCallback((userId: string, contentId?: string) => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      const items: ContentItem[] = stored ? JSON.parse(stored) : [];
      
      // Sort by date
      const sortedItems = items.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      
      setContentList(sortedItems);

      if (contentId) {
        const item = sortedItems.find(i => i.id === contentId);
        if (!item && redirectOnNotFound) {
          navigate('/library');
          return;
        }
        setContent(item || null);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      if (redirectOnNotFound && id) {
        navigate('/library');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, redirectOnNotFound, id]);

  const deleteContent = useCallback((contentId: string) => {
    if (!user) return;
    
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      const items: ContentItem[] = stored ? JSON.parse(stored) : [];
      const updatedItems = items.filter(item => item.id !== contentId);
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(updatedItems));
      
      setContentList(prev => prev.filter(item => item.id !== contentId));
      if (content?.id === contentId) {
        setContent(null);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  }, [user, content]);

  const refetch = useCallback(() => {
    if (user) {
      setIsLoading(true);
      fetchContent(user.id, id);
    }
  }, [user, id, fetchContent]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (!session) {
          setIsAuthChecked(true);
          setIsLoading(false);
          navigate('/auth');
          return;
        }

        setUser(session.user);
        setIsAuthChecked(true);
        fetchContent(session.user.id, id);
      } catch (error) {
        console.error('Auth error:', error);
        if (isMounted) {
          setIsAuthChecked(true);
          setIsLoading(false);
          navigate('/auth');
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, id, fetchContent]);

  return {
    user,
    content,
    contentList,
    isLoading,
    isAuthChecked,
    deleteContent,
    refetch,
  };
};
