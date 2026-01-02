import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, Bot, User, Map } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KnowledgeMapPanel } from '@/components/KnowledgeMap';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

const uiLabels = {
  en: {
    title: 'AI Chat',
    placeholder: 'Ask a question about this material...',
    send: 'Send',
    thinking: 'Thinking...',
    error: 'Failed to get response. Please try again.',
    welcome: 'Hi! I can answer questions about this content. What would you like to know?',
    backToContent: 'Back to Content'
  },
  ru: {
    title: 'ИИ Чат',
    placeholder: 'Задайте вопрос об этом материале...',
    send: 'Отправить',
    thinking: 'Думаю...',
    error: 'Не удалось получить ответ. Попробуйте снова.',
    welcome: 'Привет! Я могу ответить на вопросы об этом контенте. Что бы вы хотели узнать?',
    backToContent: 'Назад к контенту'
  },
  hy: {
    title: 'ԱԲ Զրույց',
    placeholder: 'Հարց տվեք այս նյութի մասին...',
    send: 'Ուղարկել',
    thinking: 'Մտածում եմ...',
    error: 'Չհաջողվեց պատասխան ստանալ: Խնդրում ենք կրկին փորձել:',
    welcome: 'Բարև: Ես կարող եմ պատասխանել այս բովանդակության վերաբերյալ հարցերին: Ի՞նչ կցանկանայիք իմանալ:',
    backToContent: 'Հետ դեպի բովանդակություն'
  },
  ko: {
    title: 'AI 채팅',
    placeholder: '이 자료에 대해 질문하세요...',
    send: '전송',
    thinking: '생각 중...',
    error: '응답을 받지 못했습니다. 다시 시도하세요.',
    welcome: '안녕하세요! 이 콘텐츠에 대한 질문에 답변해 드릴 수 있습니다. 무엇을 알고 싶으신가요?',
    backToContent: '콘텐츠로 돌아가기'
  }
};

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKnowledgeMap, setShowKnowledgeMap] = useState(false);
  const [activeNode, setActiveNode] = useState<string | undefined>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (content) {
      const language = (content.language as Language) || 'en';
      const labels = uiLabels[language];
      setMessages([{ role: 'assistant', content: labels.welcome }]);
    }
  }, [content]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !content) return;

    const userMessage = input.trim();
    const language = (content.language as Language) || 'en';
    const labels = uiLabels[language];
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('content-chat', {
        body: { 
          question: userMessage, 
          contentText: content.original_text,
          analysisData: content.analysis_data,
          language,
          chatHistory: messages
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || labels.error }]);
    } catch (error) {
      console.error('Chat error:', error);
      const language = (content.language as Language) || 'en';
      const labels = uiLabels[language];
      setMessages(prev => [...prev, { role: 'assistant', content: labels.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleKnowledgeMapNodeClick = (question: string) => {
    setInput(question);
    // Extract node name from the question for highlighting
    const match = question.match(/Tell me more about (.+)/);
    if (match) {
      setActiveNode(match[1].toLowerCase().replace(/\s+/g, '-'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm md:text-base">Loading chat...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-4 py-3 sm:py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button variant="ghost" asChild size="sm" className="w-fit">
              <Link to={`/library/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="text-sm">{labels.backToContent}</span>
              </Link>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
              {labels.title}
            </h1>
          </div>
          <Button
            variant={showKnowledgeMap ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowKnowledgeMap(!showKnowledgeMap)}
            className="gap-2 hidden lg:flex"
          >
            <Map className="h-4 w-4" />
            Knowledge Map
          </Button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat section */}
          <div className="flex-1 flex flex-col p-2 sm:p-4 min-w-0">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg truncate">
                  {content.title || 'Untitled'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-2 sm:p-4 pt-0 overflow-hidden">
                <ScrollArea className="flex-1 pr-2 sm:pr-4 mb-3 sm:mb-4" ref={scrollAreaRef}>
                  <div className="space-y-3 sm:space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg p-2.5 sm:p-3">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            {labels.thinking}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={labels.placeholder}
                    className="min-h-[50px] sm:min-h-[60px] resize-none text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-3 sm:px-4"
                    size="default"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Map Panel - Hidden on mobile/tablet */}
          {showKnowledgeMap && (
            <div className="hidden lg:block w-[400px] xl:w-[500px] border-l border-border">
              <KnowledgeMapPanel 
                onAskAboutNode={handleKnowledgeMapNodeClick}
                activeNodeId={activeNode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
