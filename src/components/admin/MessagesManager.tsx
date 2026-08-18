import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import {
  useConversations,
  useMessages,
  Conversation,
  getOrCreateConversation,
} from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface MessagesManagerProps {
  tenantId: string;
}

interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function MessagesManager({ tenantId }: MessagesManagerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessageDialog, setNewMessageDialog] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);

  const { conversations, loading: loadingConversations, refetch } = useConversations(
    'salon',
    tenantId
  );
  const { messages, loading: loadingMessages, sendMessage, markAsRead } = useMessages(
    selectedConversation?.id || null
  );

  useEffect(() => {
    if (selectedConversation) markAsRead('salon');
  }, [selectedConversation?.id]);

  // Hide admin bottom nav while chat is open on mobile
  useEffect(() => {
    if (!isMobile) return;
    if (selectedConversation) document.body.classList.add('msg-chat-open');
    else document.body.classList.remove('msg-chat-open');
    return () => {
      document.body.classList.remove('msg-chat-open');
    };
  }, [isMobile, selectedConversation]);

  const handleSendMessage = (content: string) => {
    if (user) sendMessage(content, 'salon', user.id);
  };

  // Marcar una conversación como no leída (o leída) desde la lista
  const handleToggleUnread = async (conv: Conversation, markUnread: boolean) => {
    try {
      if (markUnread && selectedConversation?.id === conv.id) {
        setSelectedConversation(null);
      }
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count_salon: markUnread ? Math.max(1, conv.unread_count_salon) : 0 })
        .eq('id', conv.id);
      if (error) throw error;

      if (!markUnread) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .eq('conversation_id', conv.id)
          .eq('sender_type', 'user');
      }

      await refetch();
      toast({
        title: markUnread ? 'Marcado como no leído' : 'Marcado como leído',
      });
    } catch (err) {
      console.error('Error toggling unread:', err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };


  // Live search
  useEffect(() => {
    const run = async () => {
      const term = searchUsername.trim();
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, email, avatar_url')
          .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
          .limit(10);
        if (error) throw error;
        setSearchResults((data || []) as ProfileRow[]);
      } catch (err) {
        console.error('Error searching users:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [searchUsername]);

  const handleSelectUser = async (profile: ProfileRow) => {
    try {
      const id = await getOrCreateConversation(tenantId, profile.id);
      if (!id) return;
      await refetch();
      const newConv = conversations.find((c) => c.id === id);
      if (newConv) setSelectedConversation(newConv);
      setNewMessageDialog(false);
      setSearchUsername('');
      setSearchResults([]);
      toast({
        title: 'Conversación creada',
        description: `Ahora puedes escribir a ${profile.full_name || profile.username || profile.email}`,
      });
    } catch (err) {
      console.error('Error starting conversation:', err);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conversación',
        variant: 'destructive',
      });
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count_salon, 0);

  const newMsgDialog = (
    <Dialog open={newMessageDialog} onOpenChange={setNewMessageDialog}>
      <DialogContent className={isMobile ? 'mx-4 max-w-[calc(100vw-32px)]' : undefined}>
        <DialogHeader>
          <DialogTitle>Iniciar conversación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Buscar cliente por nombre o username
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Nombre o @username"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="pl-9"
              />
            </div>
            {searching && (
              <p className="text-xs text-muted-foreground mt-2">Buscando…</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              El cliente debe tener una cuenta registrada
            </p>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Resultados</p>
              <div className="max-h-[260px] overflow-y-auto space-y-1">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectUser(p)}
                    className="msg-newchat-result"
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="msg-newchat-avatar" />
                    ) : (
                      <div className="msg-newchat-avatar msg-newchat-avatar-fb">
                        {(p.full_name || p.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-semibold truncate">
                        {p.full_name || p.username || 'Usuario'}
                      </p>
                      {p.username && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{p.username}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // ── Mobile ────────────────────────────────────────────────
  if (isMobile) {
    const chatOverlay = selectedConversation && (
      <div className="msg-mobile-overlay">
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          loading={loadingMessages}
          onSendMessage={handleSendMessage}
          currentUserId={user?.id || ''}
          role="salon"
          onBack={() => setSelectedConversation(null)}
        />
      </div>
    );

    // Admin mobile: topbar 56px + bottom nav ~64px + safe areas
    const adminMobileShellStyle: React.CSSProperties = {
      height: 'calc(100dvh - 56px - env(safe-area-inset-top) - 64px - env(safe-area-inset-bottom))',
    };

    return (
      <>
        <div className="msg-shell-mobile" style={adminMobileShellStyle}>
          <header className="msg-sidebar-header">
            <span className="msg-sidebar-title">
              <MessageCircle className="h-5 w-5" style={{ color: 'var(--gp-accent)' }} />
              Mensajes
              {totalUnread > 0 && (
                <span className="msg-unread-badge">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setNewMessageDialog(true)}
              className="msg-new-btn"
              aria-label="Nuevo mensaje"
            >
              <Plus className="h-4 w-4" />
            </button>
          </header>
          <div className="msg-sidebar">
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedId={null}
              onSelect={setSelectedConversation}
              role="salon"
              showSearch={false}
              onToggleUnread={handleToggleUnread}

            />
          </div>
        </div>

        {chatOverlay && createPortal(chatOverlay, document.body)}
        {newMsgDialog}
      </>
    );
  }

  // ── Desktop ───────────────────────────────────────────────
  return (
    <div className="msg-shell-desktop">
      <aside className="msg-sidebar">
        <header className="msg-sidebar-header">
          <span className="msg-sidebar-title">
            Mensajes
            {totalUnread > 0 && (
              <span className="msg-unread-badge">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setNewMessageDialog(true)}
            className="msg-new-btn"
            aria-label="Nuevo mensaje"
          >
            <Plus className="h-4 w-4" />
          </button>
        </header>
        <ConversationList
          conversations={conversations}
          loading={loadingConversations}
          selectedId={selectedConversation?.id || null}
          onSelect={setSelectedConversation}
          role="salon"
          onToggleUnread={handleToggleUnread}

        />
        <div className="msg-sidebar-hint">
          <span>
            <kbd>↑↓</kbd> Navegar
          </span>
          <span>
            <kbd>Enter</kbd> Abrir
          </span>
        </div>
      </aside>
      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        loading={loadingMessages}
        onSendMessage={handleSendMessage}
        currentUserId={user?.id || ''}
        role="salon"
      />
      {newMsgDialog}
    </div>
  );
}
