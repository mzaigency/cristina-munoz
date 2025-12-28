import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronLeft } from 'lucide-react';
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

  // Mobile layout - iOS style
  if (isMobile) {
    return (
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
                onClick={() => navigate(-1)}
                className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent active:opacity-60"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="text-[17px]">Atrás</span>
              </Button>
            )}
            <h1 className="flex-1 text-center text-[17px] font-semibold truncate pr-10">
              {selectedConversation
                ? selectedConversation.tenant?.name || 'Chat'
                : 'Mensajes'}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-56px-env(safe-area-inset-top))]">
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

  // Desktop layout - iOS inspired
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto flex items-center h-16 px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent active:opacity-60"
          >
            <ChevronLeft className="h-6 w-6" />
            <span>Atrás</span>
          </Button>
          <h1 className="flex-1 text-center text-lg font-semibold">
            Mensajes
          </h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-6 px-4">
        <div className="bg-background rounded-2xl border border-border/50 shadow-lg overflow-hidden h-[calc(100vh-120px)]">
          <div className="grid md:grid-cols-[380px_1fr] h-full">
            {/* Conversation list */}
            <div className="border-r border-border/50 bg-background">
              <div className="p-4 border-b border-border/30">
                <h2 className="text-xl font-bold">Chats</h2>
              </div>
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
