import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { useConversations, useMessages, Conversation, getOrCreateConversation } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface MessagesManagerProps {
  tenantId: string;
}

export function MessagesManager({ tenantId }: MessagesManagerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessageDialog, setNewMessageDialog] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { conversations, loading: loadingConversations, refetch } = useConversations('salon', tenantId);
  const { messages, loading: loadingMessages, sendMessage, markAsRead } = useMessages(
    selectedConversation?.id || null
  );

  useEffect(() => {
    if (selectedConversation) {
      markAsRead('salon');
    }
  }, [selectedConversation?.id]);

  // Hide admin bottom nav on mobile when chat is open (Instagram-style fullscreen)
  useEffect(() => {
    if (!isMobile) return;
    if (selectedConversation) {
      document.body.classList.add('msg-chat-open');
    } else {
      document.body.classList.remove('msg-chat-open');
    }
    return () => {
      document.body.classList.remove('msg-chat-open');
    };
  }, [isMobile, selectedConversation]);

  const handleSendMessage = (content: string) => {
    if (user) {
      sendMessage(content, 'salon', user.id);
    }
  };

  // Real-time search as user types
  useEffect(() => {
    const searchUsers = async () => {
      const term = searchUsername.trim();
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, email, avatar_url')
          .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(profiles || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchUsername]);

  const handleSelectUser = async (profile: any) => {
    try {
      const conversationId = await getOrCreateConversation(tenantId, profile.id);

      if (conversationId) {
        await refetch();
        const newConv = conversations.find((c) => c.id === conversationId);
        if (newConv) {
          setSelectedConversation(newConv);
        }
        setNewMessageDialog(false);
        setSearchUsername('');
        setSearchResults([]);
        toast({
          title: 'Conversación creada',
          description: `Ahora puedes enviar mensajes a ${profile.full_name || profile.username || profile.email}`,
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
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
            {searching && <p className="text-xs text-muted-foreground mt-2">Buscando...</p>}
            <p className="text-xs text-muted-foreground mt-2">El cliente debe tener una cuenta registrada</p>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Resultados:</p>
              <div className="max-h-[260px] overflow-y-auto space-y-1">
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectUser(profile)}
                    className="msg-newchat-result"
                  >
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="msg-newchat-avatar" />
                    ) : (
                      <div className="msg-newchat-avatar msg-newchat-avatar-fb">
                        {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-semibold truncate">
                        {profile.full_name || profile.username || 'Usuario'}
                      </p>
                      {profile.username && (
                        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
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

  // ─────────────────────── Mobile Layout ───────────────────────
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

    return (
      <>
        <div className="msg-mobile-shell">
          <header className="msg-mobile-list-header">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 gp-text-brand" />
              <h2 className="text-base font-bold">Mensajes</h2>
              {totalUnread > 0 && (
                <span className="msg-unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
            </div>
            <button onClick={() => setNewMessageDialog(true)} className="msg-new-btn" aria-label="Nuevo mensaje">
              <Plus className="h-4 w-4" />
            </button>
          </header>
          <div className="msg-mobile-list-body">
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedId={null}
              onSelect={setSelectedConversation}
              role="salon"
            />
          </div>
        </div>

        {/* Fullscreen overlay above admin bottom nav */}
        {chatOverlay && createPortal(chatOverlay, document.body)}

        {newMsgDialog}
      </>
    );
  }

  // ─────────────────────── Desktop Layout ───────────────────────
  return (
    <div className="msg-desktop">
      <aside className="msg-desktop-sidebar">
        <header className="msg-desktop-sidebar-header">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">Mensajes</h2>
            {totalUnread > 0 && (
              <span className="msg-unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
            )}
          </div>
          <button onClick={() => setNewMessageDialog(true)} className="msg-new-btn" aria-label="Nuevo mensaje">
            <Plus className="h-4 w-4" />
          </button>
        </header>
        <div className="msg-desktop-sidebar-body">
          <ConversationList
            conversations={conversations}
            loading={loadingConversations}
            selectedId={selectedConversation?.id || null}
            onSelect={setSelectedConversation}
            role="salon"
          />
        </div>
      </aside>
      <main className="msg-desktop-thread">
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          loading={loadingMessages}
          onSendMessage={handleSendMessage}
          currentUserId={user?.id || ''}
          role="salon"
        />
      </main>
      {newMsgDialog}
    </div>
  );
}
