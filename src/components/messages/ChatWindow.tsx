import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, MessageCircle, CheckCheck, Check, CalendarCheck, Bell, XCircle, Star, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-b from-muted/20 to-muted/5">
        <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">Mensajes</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Selecciona una conversación para ver los mensajes
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
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-muted/10 to-background">
      {/* Header estilo iOS */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-xl shrink-0">
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[15px] truncate">{displayName}</h2>
          {role === 'user' && conversation.tenant?.slug && (
            <p className="text-xs text-muted-foreground">En línea</p>
          )}
        </div>
      </div>

      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-3">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
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
                      <div className="flex justify-center my-6">
                        <span className="text-xs font-medium text-muted-foreground bg-muted/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
                          {format(new Date(message.created_at), "EEEE, d 'de' MMMM", { locale: es })}
                        </span>
                      </div>
                    )}

                    <div className={cn(
                      'flex gap-2 mb-1',
                      isOwn ? 'justify-end' : 'justify-start'
                    )}>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-card border border-border/50 rounded-bl-md',
                          isSystemMessage && !isOwn && 'bg-muted/80 border-primary/20'
                        )}
                      >
                        {/* Story reply preview */}
                        {isStoryReply && storyId && (
                          <StoryReplyPreview storyId={storyId} isOwn={isOwn} />
                        )}

                        {isSystemMessage && messageLabel && (
                          <div className={cn(
                            'flex items-center gap-1.5 text-xs font-semibold mb-1.5',
                            isOwn ? 'text-primary-foreground/80' : 'text-primary'
                          )}>
                            {messageIcon}
                            {messageLabel}
                          </div>
                        )}
                        
                        <p className={cn(
                          'text-[15px] leading-relaxed whitespace-pre-wrap break-words',
                          isOwn ? 'text-primary-foreground' : 'text-foreground'
                        )}>
                          {message.content}
                        </p>
                        
                        <div className={cn(
                          'flex items-center gap-1 mt-1',
                          isOwn ? 'justify-end' : ''
                        )}>
                          <span className={cn(
                            'text-[10px]',
                            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {isOwn && (
                            message.is_read ? (
                              <CheckCheck className={cn(
                                'h-3.5 w-3.5',
                                isOwn ? 'text-primary-foreground/60' : 'text-primary'
                              )} />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-primary-foreground/60" />
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

      {/* Input estilo iOS - siempre visible */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-background shrink-0">
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Mensaje"
            className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 px-4 h-11"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim()}
            className="h-11 w-11 rounded-full shrink-0 shadow-lg shadow-primary/20 disabled:shadow-none transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
