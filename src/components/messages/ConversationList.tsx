import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, MessageCircle, Search } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const displayName =
        role === 'user'
          ? conv.tenant?.name || 'Salón'
          : conv.user?.full_name || conv.user?.email || 'Cliente';
      return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [conversations, role, searchTerm]);

  // Update focused index when selected changes
  useEffect(() => {
    if (!selectedId) return;
    const index = filteredConversations.findIndex((c) => c.id === selectedId);
    if (index !== -1) setFocusedIndex(index);
  }, [selectedId, filteredConversations]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (filteredConversations.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < filteredConversations.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredConversations.length - 1;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < filteredConversations.length) {
          e.preventDefault();
          onSelect(filteredConversations[focusedIndex]);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        itemRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        const lastIndex = filteredConversations.length - 1;
        setFocusedIndex(lastIndex);
        itemRefs.current[lastIndex]?.focus();
        break;
    }
  };

  // No mostrar skeleton, mostrar lista vacía mientras carga
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
        <p className="text-xs text-muted-foreground/60 max-w-[220px]">
          {role === 'user'
            ? 'Tus conversaciones aparecerán aquí'
            : 'Los mensajes con clientes aparecerán aquí'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Search bar (desktop) */}
      <div className="p-3 border-b border-border/20 hidden md:block shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/40"
            aria-label="Buscar conversaciones"
          />
        </div>
      </div>

      {/* Conversation count for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {filteredConversations.length} conversaciones disponibles
        {searchTerm && ` para "${searchTerm}"`}
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div
            ref={listRef}
            role="listbox"
            aria-label="Lista de conversaciones"
            aria-activedescendant={selectedId ? `conversation-${selectedId}` : undefined}
            onKeyDown={handleKeyDown}
          >
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground/70">
                <p>No se encontraron conversaciones</p>
              </div>
            ) : (
              filteredConversations.map((conv, index) => {
                const unreadCount = role === 'user' ? conv.unread_count_user : conv.unread_count_salon;
                const hasUnread = unreadCount > 0;

                const displayName =
                  role === 'user'
                    ? conv.tenant?.name || 'Salón'
                    : conv.user?.full_name || conv.user?.email || 'Cliente';

                const avatarUrl = role === 'user' ? conv.tenant?.logo_url : conv.user?.avatar_url;

                const isSelected = selectedId === conv.id;
                const isFocused = focusedIndex === index;

                return (
                  <button
                    key={conv.id}
                    ref={(el) => (itemRefs.current[index] = el)}
                    id={`conversation-${conv.id}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`Conversación con ${displayName}${hasUnread ? `, ${unreadCount} mensajes sin leer` : ''}`}
                    onClick={() => {
                      setFocusedIndex(index);
                      onSelect(conv);
                    }}
                    onFocus={() => setFocusedIndex(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left overflow-hidden',
                      'border-b border-border/10 last:border-b-0',
                      'transition-colors duration-150 active:bg-muted/50',
                      'focus:outline-none focus-visible:bg-muted/30',
                      isSelected ? 'bg-muted/40' : 'hover:bg-muted/20',
                      isFocused && !isSelected && 'bg-muted/15'
                    )}
                  >
                    {/* Avatar estilo Instagram */}
                    <div className="relative shrink-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} className="object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium text-base">
                          {role === 'user' ? <Building2 className="h-5 w-5" /> : displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Content - con overflow controlado */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {/* Fila 1: Nombre + Tiempo */}
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'flex-1 truncate text-[15px] leading-tight',
                            hasUnread ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'
                          )}
                        >
                          {displayName}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 text-[11px] tabular-nums',
                            hasUnread ? 'text-foreground/70' : 'text-muted-foreground/50'
                          )}
                        >
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: false,
                            locale: es,
                          })}
                        </span>
                      </div>

                      {/* Fila 2: Mensaje */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p
                          className={cn(
                            'flex-1 truncate text-[13px] leading-tight',
                            hasUnread ? 'text-foreground/70' : 'text-muted-foreground/50'
                          )}
                        >
                          {conv.last_message ? (
                            <>
                              {conv.last_message.sender_type === (role === 'user' ? 'user' : 'salon') && (
                                <span className="text-muted-foreground/40">Tú: </span>
                              )}
                              {conv.last_message.content}
                            </>
                          ) : (
                            <span className="text-muted-foreground/40">Sin mensajes</span>
                          )}
                        </p>

                        {/* Badge de no leídos estilo Instagram */}
                        {hasUnread && (
                          <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Keyboard shortcuts hint (desktop) */}
      <div className="hidden md:flex items-center justify-center gap-4 p-2 border-t border-border/20 text-xs text-muted-foreground/70 shrink-0">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd> Navegar
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Enter</kbd> Abrir
        </span>
      </div>
    </div>
  );
}
