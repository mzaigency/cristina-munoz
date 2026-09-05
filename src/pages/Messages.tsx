import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { SEO } from '@/components/SEO';
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
      <AppLayout hideNavigation={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count_user, 0);

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
    <AppLayout hideNavigation={isMobile && !!selectedConversation}>
      <SEO
        title="Mensajes"
        description="Conversaciones directas con tus salones y estilistas"
        canonicalUrl="/mensajes"
        noindex={true}
      />

      {/* Standard Consistent Sticky Header */}
      <div className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-line/60 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
                Mensajes
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight hidden sm:block mt-0.5">
                Conversaciones directas con tus salones y estilistas
              </p>
            </div>
            {totalUnread > 0 && (
              <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                {totalUnread > 99 ? '99+' : totalUnread} sin leer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Clean, natural scrolling conversation list */}
      {isMobile ? (
        <div className="max-w-2xl mx-auto py-4 px-4 pb-20">
          <div className="msg-sidebar-mobile">
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedId={null}
              onSelect={handleSelectConversation}
              role="user"
              showSearch={conversations.length > 3}
            />
          </div>
          {chatOverlay && createPortal(chatOverlay, document.body)}
        </div>
      ) : (
        /* Desktop: 2-column split shell */
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
        </div>
      )}
    </AppLayout>
  );
}

