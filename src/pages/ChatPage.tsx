import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, Bot, User, Map } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KnowledgeMapPanel } from '@/components/KnowledgeMap';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useContent } from '@/hooks/useContent';
import { ContentDetailSkeleton } from '@/components/ui/skeleton-loader';

type Language = 'en' | 'ru' | 'hy' | 'ko';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
    title: 'AI Chat',
    placeholder: 'Ask a question about this material...',
    send: 'Send',
    thinking: 'Thinking...',
    error: 'Failed to get response. Please try again.',
    welcome: 'Hi! I can answer questions about this content. What would you like to know?',
    backToContent: 'Back to Content'
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
  const { content, isLoading, isAuthChecked } = useContent({ id });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showKnowledgeMap, setShowKnowledgeMap] = useState(false);
  const [activeNode, setActiveNode] = useState<string | undefined>();
  const [activeNodeContext, setActiveNodeContext] = useState<{ description?: string; category?: string } | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim() || isSending || !content) return;

    const userMessage = input.trim();
    const language = (content.language as Language) || 'en';
    const labels = uiLabels[language];

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          contentText: content.original_text,
          analysisData: content.analysis_data,
          language,
          chatHistory: messages,
          activeNodeContext
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      setActiveNodeContext(null);
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantAnswer += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: assistantAnswer
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const language = (content.language as Language) || 'en';
      const labels = uiLabels[language];
      setMessages(prev => [...prev, { role: 'assistant', content: labels.error }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (messages.length > 0 && content?.analysis_data?.knowledge_map?.nodes) {
      const latestMessage = messages[messages.length - 1];
      const nodes = content.analysis_data.knowledge_map.nodes;
      const mentionedNodes = new Set<string>();

      nodes.forEach((node: any) => {
        const nodeLabel = node.label?.toLowerCase() || '';
        const messageContent = latestMessage.content.toLowerCase();

        const mentionRegex = new RegExp(`\\b${nodeLabel}\\b`, 'i');
        if (nodeLabel && (messageContent.includes(nodeLabel) || mentionRegex.test(messageContent))) {
          mentionedNodes.add(node.id);
        }
      });

      if (mentionedNodes.size > 0) {
        setHighlightedNodes(mentionedNodes);
        setTimeout(() => {
          setHighlightedNodes(new Set());
        }, 3000);
      }
    }
  }, [messages, content]);

  const handleKnowledgeMapNodeClick = (question: string, description?: string, category?: string) => {
    setInput(question);
    setActiveNodeContext({ description, category });

    const match = question.match(/Tell me more about (.+?)(?:\s|\.|$)/);
    if (match) {
      const nodeName = match[1].trim().replace(/[.,!?]$/, "");

      if (content?.analysis_data?.knowledge_map?.nodes) {
        const node = content.analysis_data.knowledge_map.nodes.find(
          (n: any) => n.label?.toLowerCase() === nodeName.toLowerCase()
        );
        if (node) {
          setActiveNode(node.id);
        }
      }
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="h-screen flex flex-col">
        <div className="flex flex-col gap-3 px-3 sm:px-4 py-3 sm:py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
          </div>
          <div className="flex justify-end">
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
        </div>

        <div className="flex-1 flex overflow-hidden">
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
                          className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 ${message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                            }`}
                        >
                          <MarkdownRenderer content={message.content} />
                        </div>
                        {message.role === 'user' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isSending && messages[messages.length - 1]?.content === '' && (
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
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    className="px-3 sm:px-4"
                    size="default"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {showKnowledgeMap && (
            <div className="hidden lg:block w-[400px] xl:w-[500px] border-l border-border">
              <KnowledgeMapPanel
                onAskAboutNode={handleKnowledgeMapNodeClick}
                activeNodeId={activeNode}
                data={content?.analysis_data?.knowledge_map}
                highlightedNodes={highlightedNodes}
              />
            </div>
          )}

          <div className="lg:hidden">
            <KnowledgeMapPanel
              onAskAboutNode={handleKnowledgeMapNodeClick}
              activeNodeId={activeNode}
              data={content?.analysis_data?.knowledge_map}
              highlightedNodes={highlightedNodes}
              isMobile={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;