import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, MessageCircle, CheckCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Message, Conversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  currentUserId: string;
  role: 'user' | 'salon';
}

export function ChatWindow({
  conversation,
  messages,
  loading,
  onSendMessage,
  currentUserId,
  role,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when conversation changes
    if (conversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">Selecciona una conversación</h3>
        <p className="text-sm max-w-sm">
          Elige una conversación de la lista para ver los mensajes
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur">
        <Avatar>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{displayName}</h2>
          {role === 'user' && conversation.tenant?.slug && (
            <p className="text-xs text-muted-foreground">@{conversation.tenant.slug}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                <Skeleton className="h-16 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p>No hay mensajes aún</p>
            <p className="text-sm">¡Envía el primer mensaje!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn =
                (role === 'user' && message.sender_type === 'user') ||
                (role === 'salon' && message.sender_type === 'salon');

              const showDate =
                index === 0 ||
                format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd') !==
                  format(new Date(message.created_at), 'yyyy-MM-dd');

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {format(new Date(message.created_at), "d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                  )}

                  <div className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2',
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md',
                        message.message_type !== 'text' && 'border-l-4 border-primary/50'
                      )}
                    >
                      {message.message_type !== 'text' && (
                        <p className="text-xs font-medium opacity-70 mb-1">
                          {message.message_type === 'booking_confirmation' && '✅ Confirmación de cita'}
                          {message.message_type === 'booking_reminder' && '🔔 Recordatorio'}
                          {message.message_type === 'booking_cancelled' && '❌ Cancelación'}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : '')}>
                        <span className="text-[10px] opacity-60">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                        {isOwn && (
                          message.is_read ? (
                            <CheckCheck className="h-3 w-3 opacity-60" />
                          ) : (
                            <Check className="h-3 w-3 opacity-60" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
