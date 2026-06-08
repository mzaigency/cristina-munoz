import { useState, useEffect } from 'react';
import { MessageCircle, Send, ArrowLeft, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
        const newConv = conversations.find(c => c.id === conversationId);
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

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count_salon, 0);

  const newMsgDialog = (
    <Dialog open={newMessageDialog} onOpenChange={setNewMessageDialog}>
      <DialogContent className={isMobile ? "mx-4 max-w-[calc(100vw-32px)]" : undefined}>
        <DialogHeader>
          <DialogTitle>Iniciar conversación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Buscar cliente por nombre o username
            </label>
            <Input
              type="text"
              placeholder="Nombre o @username"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
            {searching && <p className="text-xs text-muted-foreground">Buscando...</p>}
            <p className="text-xs text-muted-foreground mt-2">El cliente debe tener una cuenta registrada</p>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Resultados:</p>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectUser(profile)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--gp-chip)", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  >
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div className="gp-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                        {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {profile.full_name || profile.username || 'Usuario'}
                      </p>
                      {profile.username && (
                        <p style={{ fontSize: 12, color: "var(--gp-muted-c)", margin: 0 }}>@{profile.username}</p>
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", background: "var(--gp-surface)", borderRadius: 12, border: "1px solid var(--gp-line2)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--gp-line2)", background: "var(--gp-surface)" }}>
          {selectedConversation ? (
            <>
              <button className="gp-icon-btn" onClick={handleBack} aria-label="Volver a conversaciones">
                <ArrowLeft style={{ width: 18, height: 18 }} />
              </button>
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1, marginLeft: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedConversation.user?.full_name || selectedConversation.user?.email || 'Usuario'}
              </span>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageCircle style={{ width: 18, height: 18, color: "var(--gp-accent)" }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Mensajes</span>
                {totalUnread > 0 && (
                  <span className="gp-badge accent">{totalUnread}</span>
                )}
              </div>
              <button className="gp-btn primary sm" onClick={() => setNewMessageDialog(true)} aria-label="Nuevo mensaje">
                <Plus style={{ width: 14, height: 14 }} /> Nuevo
              </button>
            </>
          )}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} messages={messages} loading={loadingMessages} onSendMessage={handleSendMessage} currentUserId={user?.id || ''} role="salon" />
          ) : (
            <ConversationList conversations={conversations} loading={loadingConversations} selectedId={null} onSelect={setSelectedConversation} role="salon" />
          )}
        </div>
        {newMsgDialog}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="gp-card" style={{ overflow: "hidden" }}>
      <div className="gp-page-h" style={{ padding: "16px 20px", borderBottom: "1px solid var(--gp-line2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0 }}>Mensajes Directos</h2>
          {totalUnread > 0 && <span className="gp-badge accent">{totalUnread}</span>}
        </div>
        <div className="gp-page-actions">
          <button className="gp-btn primary sm" onClick={() => setNewMessageDialog(true)}>
            <Send style={{ width: 14, height: 14 }} /> Nuevo mensaje
          </button>
        </div>
      </div>
      <div className="gp-msg-layout">
        <div className="gp-msg-list">
          <ConversationList conversations={conversations} loading={loadingConversations} selectedId={selectedConversation?.id || null} onSelect={setSelectedConversation} role="salon" />
        </div>
        <div className="gp-msg-thread">
          <ChatWindow conversation={selectedConversation} messages={messages} loading={loadingMessages} onSendMessage={handleSendMessage} currentUserId={user?.id || ''} role="salon" />
        </div>
      </div>
      {newMsgDialog}
    </div>
  );
}
