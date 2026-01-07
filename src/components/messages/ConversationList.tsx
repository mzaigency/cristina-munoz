import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  role: 'user' | 'salon';
}

export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
  role,
}: ConversationListProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Update focused index when selected changes
  useEffect(() => {
    if (selectedId) {
      const index = conversations.findIndex((c) => c.id === selectedId);
      if (index !== -1) {
        setFocusedIndex(index);
      }
    }
  }, [selectedId, conversations]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (conversations.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < conversations.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : conversations.length - 1;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < conversations.length) {
          e.preventDefault();
          onSelect(conversations[focusedIndex]);
        }
        break;
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground/60">Cargando...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="font-medium text-foreground/80 mb-1">Sin mensajes</p>
        <p className="text-xs text-muted-foreground/60 max-w-[200px]">
          {role === 'user'
            ? 'Tus conversaciones aparecerán aquí'
            : 'Los mensajes con clientes aparecerán aquí'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ScrollArea className="flex-1">
        <div
          ref={listRef}
          role="listbox"
          aria-label="Conversaciones"
          onKeyDown={handleKeyDown}
        >
          {conversations.map((conv, index) => {
            const unreadCount = role === 'user' ? conv.unread_count_user : conv.unread_count_salon;
            const displayName =
              role === 'user'
                ? conv.tenant?.name || 'Salón'
                : conv.user?.full_name || conv.user?.email || 'Cliente';
            const avatarUrl = role === 'user' 
              ? conv.tenant?.logo_url 
              : conv.user?.avatar_url;
            const isSelected = selectedId === conv.id;
            const hasUnread = unreadCount > 0;

            return (
              <button
                key={conv.id}
                ref={(el) => (itemRefs.current[index] = el)}
                id={`conversation-${conv.id}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setFocusedIndex(index);
                  onSelect(conv);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left',
                  'transition-colors duration-150 active:bg-muted/60',
                  'focus:outline-none focus-visible:bg-muted/40',
                  isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'
                )}
              >
                {/* Avatar minimalista estilo Instagram */}
                <div className="relative shrink-0">
                  <Avatar className={cn(
                    "h-14 w-14",
                    hasUnread && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}>
                    <AvatarImage src={avatarUrl || undefined} alt="" className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-medium text-base">
                      {role === 'user' ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      'truncate text-[15px] leading-tight',
                      hasUnread ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'
                    )}>
                      {displayName}
                    </p>
                    <span className={cn(
                      'text-[11px] shrink-0 tabular-nums',
                      hasUnread ? 'text-primary font-medium' : 'text-muted-foreground/60'
                    )}>
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: false,
                        locale: es,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {conv.last_message && (
                      <p className={cn(
                        'text-[13px] truncate flex-1 leading-tight',
                        hasUnread ? 'text-foreground/80' : 'text-muted-foreground/70'
                      )}>
                        {conv.last_message.sender_type === (role === 'user' ? 'user' : 'salon') && (
                          <span className="text-muted-foreground/50">Tú: </span>
                        )}
                        {conv.last_message.content}
                      </p>
                    )}
                    
                    {/* Badge de no leídos estilo iOS */}
                    {hasUnread && (
                      <span className="shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-primary text-primary-foreground text-[11px] font-semibold rounded-full px-1.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
