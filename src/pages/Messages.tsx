import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { useConversations, useMessages, Conversation, getOrCreateConversation } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/navigation/AppLayout';

export default function Messages() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  const tenantFromUrl = searchParams.get('tenant');

  const {
    conversations,
    loading: loadingConversations,
    refetch: refetchConversations,
  } = useConversations('user');

  const { messages, loading: loadingMessages, sendMessage, markAsRead } = useMessages(
    selectedConversation?.id || null
  );

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth?redirect=/mensajes');
        return;
      }
      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Mark messages as read when conversation is selected
    if (selectedConversation) {
      markAsRead('user');
    }
  }, [selectedConversation?.id]);

  // Auto-open chat from a booking link (?tenant=...)
  useEffect(() => {
    if (!user?.id || !tenantFromUrl) return;

    let cancelled = false;

    (async () => {
      const conversationId = await getOrCreateConversation(tenantFromUrl, user.id);
      if (cancelled || !conversationId) return;

      setPendingConversationId(conversationId);
      await refetchConversations();
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, tenantFromUrl, refetchConversations]);

  useEffect(() => {
    if (!pendingConversationId) return;

    const found = conversations.find((c) => c.id === pendingConversationId);
    if (found) {
      setSelectedConversation(found);
      setPendingConversationId(null);
      navigate('/mensajes', { replace: true });
    }
  }, [pendingConversationId, conversations, navigate]);

  const handleSendMessage = (content: string) => {
    if (user) {
      sendMessage(content, 'user', user.id);
    }
  };

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedConversation) {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConversation, handleBack]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Mobile layout - iOS style
  if (isMobile) {
    return (
      <AppLayout hideNavigation={!!selectedConversation}>
        <div className="min-h-screen bg-background">
          {/* Header iOS style */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center h-14 px-2">
              {selectedConversation ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent active:opacity-60"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="text-[17px]">Atrás</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent active:opacity-60"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="text-[17px]">Atrás</span>
                </Button>
              )}
              <h1 className="flex-1 text-center text-[17px] font-semibold truncate pr-10">
                {selectedConversation ? selectedConversation.tenant?.name || 'Chat' : 'Mensajes'}
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className={selectedConversation ? "h-[calc(100vh-56px-env(safe-area-inset-top))]" : "h-[calc(100vh-56px-env(safe-area-inset-top)-80px)]"}>
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                loading={loadingMessages}
                onSendMessage={handleSendMessage}
                currentUserId={user?.id || ''}
                role="user"
              />
            ) : (
              <ConversationList
                conversations={conversations}
                loading={loadingConversations}
                selectedId={null}
                onSelect={handleSelectConversation}
                role="user"
              />
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Desktop layout - iOS inspired with better accessibility
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Skip link for keyboard users */}
        <a
          href="#chat-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground"
        >
          Saltar a la conversación
        </a>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent active:opacity-60"
              aria-label="Ir al inicio"
            >
              <ChevronLeft className="h-6 w-6" />
              <span>Atrás</span>
            </Button>
            <h1 className="text-lg font-semibold">Mensajes</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Atajos de teclado">
                  <Keyboard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Atajos de teclado</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>
                      <kbd className="px-1 rounded bg-muted">↑↓</kbd> Navegar
                    </span>
                    <span>
                      <kbd className="px-1 rounded bg-muted">Enter</kbd> Abrir
                    </span>
                    <span>
                      <kbd className="px-1 rounded bg-muted">Esc</kbd> Cerrar chat
                    </span>
                    <span>
                      <kbd className="px-1 rounded bg-muted">Home/End</kbd> Ir al inicio/fin
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <main className="container mx-auto py-6 px-4" role="main" aria-label="Centro de mensajes">
          <div
            className="bg-background rounded-2xl border border-border/50 shadow-lg overflow-hidden"
            style={{ height: 'calc(100vh - 120px)' }}
          >
            <div className="grid md:grid-cols-[380px_1fr] h-full">
              {/* Conversation list */}
              <nav
                className="border-r border-border/50 bg-background flex flex-col h-full overflow-hidden"
                role="navigation"
                aria-label="Lista de conversaciones"
              >
                <div className="p-4 border-b border-border/30 shrink-0">
                  <h2 className="text-xl font-bold" id="chats-heading">
                    Chats
                  </h2>
                </div>
                <div className="flex-1 overflow-hidden" aria-labelledby="chats-heading">
                  <ConversationList
                    conversations={conversations}
                    loading={loadingConversations}
                    selectedId={selectedConversation?.id || null}
                    onSelect={handleSelectConversation}
                    role="user"
                  />
                </div>
              </nav>

              {/* Chat window */}
              <section
                id="chat-content"
                className="flex flex-col h-full overflow-hidden"
                role="region"
                aria-label={
                  selectedConversation
                    ? `Chat con ${selectedConversation.tenant?.name || 'salón'}`
                    : 'Selecciona una conversación'
                }
              >
                <ChatWindow
                  conversation={selectedConversation}
                  messages={messages}
                  loading={loadingMessages}
                  onSendMessage={handleSendMessage}
                  currentUserId={user?.id || ''}
                  role="user"
                />
              </section>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

