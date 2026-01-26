import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Calendar, PlayCircle, Menu, MessageCircle, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useContent } from '@/hooks/useContent';
import { LibrarySkeleton } from '@/components/ui/skeleton-loader';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

const Library = () => {
  const { contentList, isLoading, isAuthChecked, deleteContent } = useContent();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'analyse' | 'chat'>('all');
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    deleteContent(id);
    toast({ title: 'Deleted', description: 'Content removed from library' });
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const filteredContent = useMemo(() => {
    let filtered = contentList;
    
    // Filter by content type tab
    if (activeTab === 'analyse') {
      filtered = filtered.filter(item => item.content_type !== 'chat');
    } else if (activeTab === 'chat') {
      filtered = filtered.filter(item => item.content_type === 'chat');
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title?.toLowerCase().includes(query) ||
          item.original_text?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [contentList, searchQuery, activeTab]);

  // Show skeleton while loading OR while auth is not yet checked
  if (!isAuthChecked || isLoading) {
    return <LibrarySkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Mobile Hamburger Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="text-left">My Library</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-2">
            <Button variant="ghost" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2 px-2">Recent Content</p>
              {filteredContent.slice(0, 5).map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => {
                    navigate(`/library/${item.id}`);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="truncate">{item.title || 'Untitled'}</span>
                </Button>
              ))}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger menu for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Library
            </h1>
          </div>
        </div>

        {/* Tabs for filtering content type */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'analyse' | 'chat')} className="mb-4 sm:mb-6">
          <TabsList className="bg-card/50">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
            </TabsTrigger>
            <TabsTrigger value="analyse" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Analyses</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chats</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full max-w-md mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your content..."
            className="pl-10 text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredContent.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchQuery ? 'No content matches your search.' : 'No content saved yet. Analyze some text to get started!'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContent.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer group"
                onClick={() => navigate(`/library/${item.id}`)}
              >
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-medium text-base sm:text-lg line-clamp-2 flex-1">{item.title || 'Untitled'}</h3>
                    {item.language && (
                      <span className="text-xs px-2 py-1 bg-muted rounded-full whitespace-nowrap flex-shrink-0">
                        {item.language}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-3 flex-1">
                    {item.original_text}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
                    </div>
                    <div className="flex items-center space-x-1">
                      {/* Start Course Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/library/${item.id}`);
                        }}
                        title="Start Course"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline text-xs">Start</span>
                      </Button>
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
