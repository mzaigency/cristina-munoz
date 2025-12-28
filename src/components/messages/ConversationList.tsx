import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Conversation } from '@/hooks/useConversations';

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
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="font-medium">Sin conversaciones</p>
        <p className="text-sm">
          {role === 'user'
            ? 'Aún no tienes mensajes con ningún salón'
            : 'Aún no tienes mensajes con ningún cliente'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conv) => {
          const unreadCount = role === 'user' ? conv.unread_count_user : conv.unread_count_salon;
          const displayName =
            role === 'user'
              ? conv.tenant?.name || 'Salón'
              : conv.user?.full_name || conv.user?.email || 'Cliente';
          const avatarUrl = role === 'user' ? conv.tenant?.logo_url : null;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-accent ${
                selectedId === conv.id ? 'bg-accent' : ''
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>
                  {role === 'user' ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{displayName}</p>
                  {unreadCount > 0 && (
                    <Badge variant="default" className="shrink-0">
                      {unreadCount}
                    </Badge>
                  )}
                </div>

                {conv.last_message && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message.sender_type === (role === 'user' ? 'user' : 'salon')
                      ? 'Tú: '
                      : ''}
                    {conv.last_message.content}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(conv.last_message_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
