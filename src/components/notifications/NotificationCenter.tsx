import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, Trash2, Loader2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

interface NotificationCenterProps {
  onClose?: () => void;
  forTenant?: boolean;
}

export function NotificationCenter({ onClose, forTenant = false }: NotificationCenterProps) {
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useNotifications({ forTenant });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Mobile optimized */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold truncate">Notificaciones</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs gap-1 hidden sm:flex"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar leídas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Limpiar todas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 sm:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick actions bar for mobile */}
        {unreadCount > 0 && (
          <div className="px-3 pb-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="w-full h-8 text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como leídas
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-foreground mb-1">
              Sin notificaciones
            </h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Te avisaremos cuando tengas nuevas actualizaciones
            </p>
          </motion.div>
        ) : (
          <div className="divide-y divide-border/50">
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Footer hint */}
      {notifications.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/30">
          <p className="text-[10px] text-center text-muted-foreground">
            Las notificaciones expiran automáticamente tras 30 días
          </p>
        </div>
      )}
    </div>
  );
}
