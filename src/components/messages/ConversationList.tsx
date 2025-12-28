import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Building2, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Conversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

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
  if (loading) {
    return (
      <div className="space-y-0 divide-y divide-border/50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <p className="font-semibold text-lg text-foreground mb-1">Sin conversaciones</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {role === 'user'
            ? 'Cuando reserves una cita, podrás chatear con el salón desde aquí'
            : 'Los mensajes con tus clientes aparecerán aquí'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border/30">
        {conversations.map((conv) => {
          const unreadCount = role === 'user' ? conv.unread_count_user : conv.unread_count_salon;
          const displayName =
            role === 'user'
              ? conv.tenant?.name || 'Salón'
              : conv.user?.full_name || conv.user?.email || 'Cliente';
          const avatarUrl = role === 'user' ? conv.tenant?.logo_url : null;
          const isSelected = selectedId === conv.id;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                'w-full flex items-center gap-3 p-4 text-left transition-all duration-200 active:bg-accent/80',
                isSelected ? 'bg-accent' : 'hover:bg-accent/50',
                unreadCount > 0 && 'bg-primary/5'
              )}
            >
              {/* Avatar con indicador de no leído */}
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-lg">
                    {role === 'user' ? (
                      <Building2 className="h-6 w-6" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 shadow-lg animate-in zoom-in-50 duration-200">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className={cn(
                    'font-semibold truncate text-[15px]',
                    unreadCount > 0 && 'text-foreground'
                  )}>
                    {displayName}
                  </p>
                  <span className={cn(
                    'text-xs shrink-0',
                    unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}>
                    {formatDistanceToNow(new Date(conv.last_message_at), {
                      addSuffix: false,
                      locale: es,
                    })}
                  </span>
                </div>

                {conv.last_message && (
                  <p className={cn(
                    'text-sm truncate leading-relaxed',
                    unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {conv.last_message.sender_type === (role === 'user' ? 'user' : 'salon')
                      ? 'Tú: '
                      : ''}
                    {conv.last_message.content}
                  </p>
                )}
              </div>

              {/* Flecha iOS */}
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
