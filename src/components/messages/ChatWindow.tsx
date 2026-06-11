import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, MessageCircle, CheckCheck, Check, CalendarCheck, Bell, XCircle, Star, Camera, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message, Conversation } from '@/hooks/useConversations';
import { StoryReplyPreview } from './StoryReplyPreview';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  currentUserId: string;
  role: 'user' | 'salon';
  onBack?: () => void;
}

const getMessageIcon = (type: string) => {
  switch (type) {
    case 'booking_confirmation':
      return <CalendarCheck className="h-4 w-4" />;
    case 'booking_reminder':
      return <Bell className="h-4 w-4" />;
    case 'booking_cancelled':
    case 'booking_cancellation':
      return <XCircle className="h-4 w-4" />;
    case 'review_request':
      return <Star className="h-4 w-4" />;
    case 'story_reply':
      return <Camera className="h-4 w-4" />;
    default:
      return null;
  }
};

const getMessageLabel = (type: string) => {
  switch (type) {
    case 'booking_confirmation':
      return 'Cita confirmada';
    case 'booking_reminder':
      return 'Recordatorio';
    case 'booking_cancelled':
    case 'booking_cancellation':
      return 'Cita cancelada';
    case 'review_request':
      return 'Valoración';
    case 'story_reply':
      return null; // Don't show label, preview handles it
    default:
      return null;
  }
};

export function ChatWindow({
  conversation,
  messages,
  loading,
  onSendMessage,
  currentUserId,
  role,
  onBack,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when conversation changes
    if (conversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation?.id]);

  // Typing indicator - realtime presence
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase.channel(`typing:${conversation.id}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state).flat() as unknown as Array<{ is_typing?: boolean; user_type?: string }>;
        const otherUserTyping = typingUsers.some(
          (u) => u?.is_typing && u?.user_type !== role
        );
        setOtherTyping(otherUserTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ is_typing: false, user_type: role });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, role]);

  // Broadcast typing status
  const broadcastTyping = async (typing: boolean) => {
    if (!conversation?.id) return;
    
    const channel = supabase.channel(`typing:${conversation.id}`);
    await channel.track({ is_typing: typing, user_type: role });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Broadcast typing status
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTyping(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Stop typing indicator
    setIsTyping(false);
    broadcastTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  if (!conversation) {
    return (
      <div className="msg-empty-thread">
        <div className="msg-empty-thread-icon">
          <MessageCircle className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Tus mensajes</h3>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          Selecciona una conversación para empezar a chatear con tus clientes.
        </p>
      </div>
    );
  }

  const displayName =
    role === 'user'
      ? conversation.tenant?.name || 'Salón'
      : conversation.user?.full_name || conversation.user?.email || 'Cliente';

  const avatarUrl = role === 'user' ? conversation.tenant?.logo_url : null;

  return (
    <div className="msg-chat">
      {/* Header: WhatsApp/Instagram-style */}
      <header className="msg-chat-header">
        {onBack && (
          <button onClick={onBack} className="msg-chat-back" aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar className="msg-chat-header-avatar">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="msg-chat-header-avatar-fb">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-tight truncate">{displayName}</h2>
          {otherTyping ? (
            <p className="text-[11px] gp-text-brand font-medium">escribiendo…</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">En línea</p>
          )}
        </div>
      </header>

      {/* Messages area - scrollable */}
      <div className="msg-chat-body">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="msg-chat-msglist">
          {loading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-foreground mb-1">Inicia la conversación</p>
              <p className="text-sm text-muted-foreground">Envía un mensaje para comenzar</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn =
                  (role === 'user' && message.sender_type === 'user') ||
                  (role === 'salon' && message.sender_type === 'salon');

                const showDate =
                  index === 0 ||
                  format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd') !==
                    format(new Date(message.created_at), 'yyyy-MM-dd');

                const isSystemMessage = message.message_type !== 'text' && message.message_type !== 'story_reply';
                const isStoryReply = message.message_type === 'story_reply';
                const storyId = isStoryReply && message.metadata?.story_id ? message.metadata.story_id : null;
                const messageIcon = getMessageIcon(message.message_type);
                const messageLabel = getMessageLabel(message.message_type);

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="msg-date-sep">
                        <span>
                          {format(new Date(message.created_at), "EEEE, d 'de' MMMM", { locale: es })}
                        </span>
                      </div>
                    )}

                    <div className={cn('msg-row', isOwn ? 'msg-row-own' : 'msg-row-other')}>
                      <div
                        className={cn(
                          'msg-bubble',
                          isOwn ? 'msg-bubble-own' : 'msg-bubble-other',
                          isSystemMessage && !isOwn && 'msg-bubble-system'
                        )}
                      >
                        {/* Story reply preview */}
                        {isStoryReply && storyId && (
                          <StoryReplyPreview storyId={storyId} isOwn={isOwn} />
                        )}

                        {isSystemMessage && messageLabel && (
                          <div className="msg-bubble-syslabel">
                            {messageIcon}
                            {messageLabel}
                          </div>
                        )}

                        <p className="msg-bubble-text">{message.content}</p>

                        <div className="msg-bubble-meta">
                          <span className="msg-bubble-time">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {isOwn && (
                            message.is_read ? (
                              <CheckCheck className="h-3.5 w-3.5 msg-bubble-read" />
                            ) : (
                              <Check className="h-3.5 w-3.5 msg-bubble-sent" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          </div>
        </ScrollArea>
        
        {/* Typing indicator */}
        <AnimatePresence>
          {otherTyping && (
            <TypingIndicator name={displayName} />
          )}
        </AnimatePresence>
      </div>

      {/* Input - WhatsApp/Instagram-style */}
      <form onSubmit={handleSubmit} className="msg-chat-input-wrap">
        <input
          ref={inputRef}
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Mensaje…"
          className="msg-chat-input"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newMessage.trim()}
          className="msg-chat-send"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
