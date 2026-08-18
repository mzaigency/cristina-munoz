import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, MailOpen, Mail, MessageCircle, Search } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Conversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  role: 'user' | 'salon';
  showSearch?: boolean;
  onToggleUnread?: (conversation: Conversation, markUnread: boolean) => void;
}


export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
  role,
  showSearch = true,
  onToggleUnread,

}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const q = searchTerm.toLowerCase();
    return conversations.filter((conv) => {
      const name =
        role === 'user'
          ? conv.tenant?.name || 'Salón'
          : conv.user?.full_name || conv.user?.email || 'Cliente';
      return name.toLowerCase().includes(q);
    });
  }, [conversations, role, searchTerm]);

  useEffect(() => {
    if (!selectedId) return;
    const idx = filteredConversations.findIndex((c) => c.id === selectedId);
    if (idx !== -1) setFocusedIndex(idx);
  }, [selectedId, filteredConversations]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const len = filteredConversations.length;
    if (len === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((p) => {
        const n = p < len - 1 ? p + 1 : 0;
        itemRefs.current[n]?.focus();
        return n;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((p) => {
        const n = p > 0 ? p - 1 : len - 1;
        itemRefs.current[n]?.focus();
        return n;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (focusedIndex >= 0 && focusedIndex < len) {
        e.preventDefault();
        onSelect(filteredConversations[focusedIndex]);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
      itemRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = len - 1;
      setFocusedIndex(last);
      itemRefs.current[last]?.focus();
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="msg-list-empty">
        <div className="msg-list-empty-icon">
          <MessageCircle className="h-7 w-7" />
        </div>
        <p className="msg-list-empty-text">Cargando…</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="msg-list-empty">
        <div className="msg-list-empty-icon">
          <MessageCircle className="h-7 w-7" />
        </div>
        <p className="msg-list-empty-title">Sin mensajes</p>
        <p className="msg-list-empty-text">
          {role === 'user'
            ? 'Tus conversaciones con salones aparecerán aquí.'
            : 'Los mensajes con tus clientes aparecerán aquí.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {showSearch && (
        <div className="msg-sidebar-search">
          <Search className="msg-sidebar-search-icon h-4 w-4" />
          <input
            type="search"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="msg-sidebar-search-input"
            aria-label="Buscar conversaciones"
          />
        </div>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {filteredConversations.length} conversaciones
        {searchTerm && ` para "${searchTerm}"`}
      </div>

      <div
        className="msg-sidebar-body"
        role="listbox"
        aria-label="Lista de conversaciones"
        aria-activedescendant={selectedId ? `msg-item-${selectedId}` : undefined}
        onKeyDown={handleKeyDown}
      >
        {filteredConversations.length === 0 ? (
          <div className="msg-list-empty">
            <p className="msg-list-empty-text">Sin resultados para «{searchTerm}»</p>
          </div>
        ) : (
          filteredConversations.map((conv, index) => {
            const unread = role === 'user' ? conv.unread_count_user : conv.unread_count_salon;
            const hasUnread = unread > 0;
            const name =
              role === 'user'
                ? conv.tenant?.name || 'Salón'
                : conv.user?.full_name || conv.user?.email || 'Cliente';
            const avatarUrl = role === 'user' ? conv.tenant?.logo_url : conv.user?.avatar_url;
            const isSelected = selectedId === conv.id;
            const ownLast =
              conv.last_message?.sender_type === (role === 'user' ? 'user' : 'salon');

            return (
              <div key={conv.id} className="relative group">
              <button
                ref={(el) => (itemRefs.current[index] = el)}
                id={`msg-item-${conv.id}`}
                role="option"
                aria-selected={isSelected}
                aria-label={`Conversación con ${name}${
                  hasUnread ? `, ${unread} sin leer` : ''
                }`}
                onClick={() => {
                  setFocusedIndex(index);
                  onSelect(conv);
                }}
                onFocus={() => setFocusedIndex(index)}
                className={cn(
                  'msg-item w-full',
                  isSelected && 'msg-item-active',
                  !isSelected && hasUnread && 'msg-item-unread'
                )}
              >
                <span className="msg-item-avatar-wrap">
                  <Avatar
                    className={cn('msg-item-avatar', hasUnread && 'msg-item-avatar-ring')}
                  >
                    <AvatarImage src={avatarUrl || undefined} alt={name} />
                    <AvatarFallback className="msg-item-avatar-fb">
                      {role === 'user' ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                </span>

                <span className="msg-item-body">
                  <span className="msg-item-row">
                    <span className={cn('msg-item-name', hasUnread && 'msg-item-name-unread')}>
                      {name}
                    </span>
                    <span className={cn('msg-item-time', hasUnread && 'msg-item-time-unread')}>
                      {formatDistanceToNowStrict(new Date(conv.last_message_at), {
                        locale: es,
                      })}
                    </span>
                  </span>
                  <span className="msg-item-row">
                    <span
                      className={cn(
                        'msg-item-preview',
                        hasUnread && 'msg-item-preview-unread'
                      )}
                    >
                      {conv.last_message ? (
                        <>
                          {ownLast && <span className="msg-item-prefix">Tú: </span>}
                          {conv.last_message.content}
                        </>
                      ) : (
                        <span className="msg-item-prefix">Sin mensajes</span>
                      )}
                    </span>
                    {hasUnread && (
                      <span className="msg-item-badge">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>

              {onToggleUnread && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleUnread(conv, !hasUnread);
                  }}
                  aria-label={hasUnread ? 'Marcar como leído' : 'Marcar como no leído'}
                  title={hasUnread ? 'Marcar como leído' : 'Marcar como no leído'}
                  className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                >
                  {hasUnread ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </button>
              )}
              </div>
            );

          })
        )}
      </div>
    </>
  );
}
