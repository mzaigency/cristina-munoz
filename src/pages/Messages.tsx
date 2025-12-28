import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { useConversations, useMessages, Conversation } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Messages() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const { conversations, loading: loadingConversations } = useConversations('user');
  const { messages, loading: loadingMessages, sendMessage, markAsRead } = useMessages(
    selectedConversation?.id || null
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  const handleSendMessage = (content: string) => {
    if (user) {
      sendMessage(content, 'user', user.id);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            {selectedConversation ? (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedConversation
                ? selectedConversation.tenant?.name || 'Chat'
                : 'Mensajes'}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-65px)]">
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
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Mensajes
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-6">
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden h-[calc(100vh-150px)]">
          <div className="grid md:grid-cols-[350px_1fr] h-full">
            {/* Conversation list */}
            <div className="border-r">
              <ConversationList
                conversations={conversations}
                loading={loadingConversations}
                selectedId={selectedConversation?.id || null}
                onSelect={handleSelectConversation}
                role="user"
              />
            </div>

            {/* Chat window */}
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              loading={loadingMessages}
              onSendMessage={handleSendMessage}
              currentUserId={user?.id || ''}
              role="user"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
