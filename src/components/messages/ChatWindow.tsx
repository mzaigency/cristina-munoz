import { useState, useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Send,
  MessageCircle,
  CheckCheck,
  Check,
  CalendarCheck,
  Bell,
  XCircle,
  Star,
  Camera,
  ArrowLeft,
  Bell,
} from 'lucide-react';
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
    default:
      return null;
  }
};

const formatDateLabel = (date: Date) => {
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, "EEEE, d 'de' MMMM", { locale: es });
};

export function ChatWindow({
  conversation,
  messages: allMessages,
  loading,
  onSendMessage,
  role,
  onBack,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [showAutomatic, setShowAutomatic] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // En el panel del salón ocultamos por defecto los avisos automáticos (recordatorios, etc.)
  const isAuto = (t: string) => t !== 'text' && t !== 'story_reply';
  const automaticCount = allMessages.filter((m) => isAuto(m.message_type)).length;
  const hideAutomatic = role === 'salon' && !showAutomatic && automaticCount > 0;
  const messages = hideAutomatic
    ? allMessages.filter((m) => !isAuto(m.message_type))
    : allMessages;

  useEffect(() => {
    setShowAutomatic(false);
  }, [conversation?.id]);

  // Autoscroll to bottom on message change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation && inputRef.current) inputRef.current.focus();
  }, [conversation?.id]);

  // Single shared presence channel for typing per conversation
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase.channel(`typing:${conversation.id}`, {
      config: { presence: { key: role } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<
          string,
          Array<{ is_typing?: boolean; user_type?: string }>
        >;
        const someoneElseTyping = Object.entries(state).some(
          ([key, entries]) =>
            key !== role && entries.some((e) => e?.is_typing === true)
        );
        setOtherTyping(someoneElseTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ is_typing: false, user_type: role });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      isTypingRef.current = false;
    };
  }, [conversation?.id, role]);

  const broadcastTyping = (typing: boolean) => {
    if (!channelRef.current) return;
    channelRef.current.track({ is_typing: typing, user_type: role });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      broadcastTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      broadcastTyping(false);
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    broadcastTyping(false);
    onSendMessage(trimmed);
    setNewMessage('');
  };

  // Placeholder for desktop when no conversation
  if (!conversation) {
    return (
      <div className="msg-thread">
        <div className="msg-thread-placeholder">
          <div className="msg-thread-placeholder-icon">
            <MessageCircle className="h-10 w-10" />
          </div>
          <h3 className="msg-thread-placeholder-title">Tus mensajes</h3>
          <p className="msg-thread-placeholder-text">
            Selecciona una conversación para empezar a chatear.
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    role === 'user'
      ? conversation.tenant?.name || 'Salón'
      : conversation.user?.full_name || conversation.user?.email || 'Cliente';

  const avatarUrl =
    role === 'user'
      ? conversation.tenant?.logo_url
      : conversation.user?.avatar_url;

  return (
    <div className="msg-thread">
      {/* Header */}
      <header className="msg-thread-header">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="msg-thread-back"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar className="msg-thread-avatar">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="msg-thread-avatar-fb">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="msg-thread-info">
          <p className="msg-thread-name">{displayName}</p>
          <p
            className={cn(
              'msg-thread-status',
              otherTyping && 'msg-thread-status-typing'
            )}
          >
            {otherTyping ? 'escribiendo…' : 'En línea'}
          </p>
        </div>
      </header>

      {/* Body */}
      <div ref={bodyRef} className="msg-thread-body">
        {role === 'salon' && automaticCount > 0 && (
          <div className="msg-auto-toggle-wrap">
            <button
              type="button"
              onClick={() => setShowAutomatic((v) => !v)}
              className="msg-auto-toggle"
            >
              <Bell className="h-3.5 w-3.5" />
              {showAutomatic
                ? 'Ocultar avisos automáticos'
                : `Ver ${automaticCount} aviso${automaticCount > 1 ? 's' : ''} automático${
                    automaticCount > 1 ? 's' : ''
                  }`}
            </button>
          </div>
        )}
        {loading && messages.length === 0 ? (
          <div className="msg-thread-loading">
            <p className="msg-thread-empty-text">Cargando mensajes…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="msg-thread-empty">
            <div className="msg-thread-empty-icon">
              <MessageCircle className="h-8 w-8" />
            </div>
            <p className="msg-thread-empty-title">Inicia la conversación</p>
            <p className="msg-thread-empty-text">
              Envía el primer mensaje para empezar.
            </p>
          </div>
        ) : (
          <div className="msg-thread-list">
            {messages.map((m, i) => {
              const isOwn =
                (role === 'user' && m.sender_type === 'user') ||
                (role === 'salon' && m.sender_type === 'salon');

              const date = new Date(m.created_at);
              const prevDate = i > 0 ? new Date(messages[i - 1].created_at) : null;
              const showDate =
                !prevDate ||
                format(prevDate, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd');

              const isStoryReply = m.message_type === 'story_reply';
              const storyId =
                isStoryReply && m.metadata?.story_id ? m.metadata.story_id : null;
              const isSystem =
                m.message_type !== 'text' && m.message_type !== 'story_reply';

              const icon = getMessageIcon(m.message_type);
              const label = getMessageLabel(m.message_type);

              return (
                <div key={m.id}>
                  {showDate && (
                    <div className="msg-date">
                      <span>{formatDateLabel(date)}</span>
                    </div>
                  )}
                  <div className={cn('msg-row', isOwn ? 'msg-row-own' : 'msg-row-other')}>
                    <div
                      className={cn(
                        'msg-bubble',
                        isOwn ? 'msg-bubble-own' : 'msg-bubble-other',
                        isSystem && 'msg-bubble-system'
                      )}
                    >
                      {storyId && <StoryReplyPreview storyId={storyId} />}

                      {isSystem && label && (
                        <div className="msg-syslabel">
                          {icon}
                          {label}
                        </div>
                      )}

                      <p className="msg-text">{m.content}</p>

                      <div className="msg-meta">
                        <span className="msg-time">{format(date, 'HH:mm')}</span>
                        {isOwn &&
                          (m.is_read ? (
                            <CheckCheck className="h-3.5 w-3.5 msg-tick msg-tick-read" />
                          ) : (
                            <Check className="h-3.5 w-3.5 msg-tick" />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <AnimatePresence>{otherTyping && <TypingIndicator />}</AnimatePresence>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="msg-input-wrap">
        <input
          ref={inputRef}
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Mensaje…"
          className="msg-input"
          aria-label="Mensaje"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="msg-send"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
