import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import {
  useConversations,
  useMessages,
  Conversation,
  getOrCreateConversation,
} from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppLayout } from '@/components/navigation/AppLayout';

export default function Messages() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

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
    if (authLoading) return;
    if (!user) navigate('/auth?redirect=/mensajes');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (selectedConversation) markAsRead('user');
  }, [selectedConversation?.id]);

  // Auto-open from booking link ?tenant=
  useEffect(() => {
    if (!user?.id || !tenantFromUrl) return;
    let cancelled = false;
    (async () => {
      const id = await getOrCreateConversation(tenantFromUrl, user.id);
      if (cancelled || !id) return;
      setPendingConversationId(id);
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

  // Hide bottom nav on mobile while chat open
  useEffect(() => {
    if (!isMobile) return;
    if (selectedConversation) document.body.classList.add('msg-chat-open');
    else document.body.classList.remove('msg-chat-open');
    return () => {
      document.body.classList.remove('msg-chat-open');
    };
  }, [isMobile, selectedConversation]);

  const handleSendMessage = (content: string) => {
    if (user) sendMessage(content, 'user', user.id);
  };

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  // Escape closes chat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedConversation) handleBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedConversation, handleBack]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count_user, 0);

  // ── Mobile ────────────────────────────────────────────────
  if (isMobile) {
    const chatOverlay = selectedConversation && (
      <div className="msg-mobile-overlay">
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          loading={loadingMessages}
          onSendMessage={handleSendMessage}
          currentUserId={user.id}
          role="user"
          onBack={handleBack}
        />
      </div>
    );

    return (
      <AppLayout hideNavigation={!!selectedConversation}>
        {/* Full-viewport column: no page scroll — list scrolls internally */}
        <div
          className="flex flex-col bg-background overflow-hidden"
          style={{ height: '100dvh' }}
        >
          {/* Page header */}
          <div className="liquid-glass-solid flex-shrink-0 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center h-14 px-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent active:opacity-60"
                aria-label="Volver al inicio"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="text-[17px]">Atrás</span>
              </Button>
              <h1 className="flex-1 text-center text-[17px] font-semibold truncate pr-10">
                Mensajes
              </h1>
            </div>
          </div>

          {/* Shell fills remaining space */}
          <div className="flex-1 min-h-0 px-3 py-3 pb-[calc(12px+env(safe-area-inset-bottom)+80px)] flex flex-col">
            <div className="msg-shell-mobile">
              <header className="msg-sidebar-header">
                <span className="msg-sidebar-title">
                  <MessageCircle className="h-5 w-5" style={{ color: 'var(--glow-brand)' }} />
                  Chats
                  {totalUnread > 0 && (
                    <span className="msg-unread-badge">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </span>
              </header>
              <div className="msg-sidebar">
                <ConversationList
                  conversations={conversations}
                  loading={loadingConversations}
                  selectedId={null}
                  onSelect={handleSelectConversation}
                  role="user"
                  showSearch={false}
                />
              </div>
            </div>
          </div>

          {chatOverlay && createPortal(chatOverlay, document.body)}
        </div>
      </AppLayout>
    );
  }

  // ── Desktop ───────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'var(--glow-bg)' }}>
      <div className="sticky top-0 z-10 liquid-glass-solid border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent active:opacity-60"
          >
            <ChevronLeft className="h-6 w-6" />
            <span>Atrás</span>
          </Button>
          <h1 className="text-lg font-semibold">Mensajes</h1>
          <span className="w-[72px]" />
        </div>
      </div>

      <main className="container mx-auto py-6 px-4">
        <div className="msg-shell-desktop">
          <aside className="msg-sidebar">
            <header className="msg-sidebar-header">
              <span className="msg-sidebar-title">
                Chats
                {totalUnread > 0 && (
                  <span className="msg-unread-badge">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </span>
            </header>
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedId={selectedConversation?.id || null}
              onSelect={handleSelectConversation}
              role="user"
            />
            <div className="msg-sidebar-hint">
              <span>
                <kbd>↑↓</kbd> Navegar
              </span>
              <span>
                <kbd>Enter</kbd> Abrir
              </span>
              <span>
                <kbd>Esc</kbd> Cerrar
              </span>
            </div>
          </aside>
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            loading={loadingMessages}
            onSendMessage={handleSendMessage}
            currentUserId={user.id}
            role="user"
          />
        </div>
      </main>
    </div>
  );
}
