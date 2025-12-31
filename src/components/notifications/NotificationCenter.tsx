import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Calendar, MessageCircle, Star, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'review' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface NotificationCenterProps {
  onClose?: () => void;
}

// Generate notifications from various sources
async function generateNotifications(userId: string): Promise<Notification[]> {
  const notifications: Notification[] = [];

  try {
    // Get upcoming bookings as reminders
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];

    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select('id, Fecha, Hora, stylist, tenant_id')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('Fecha', new Date().toISOString().split('T')[0])
      .lte('Fecha', formattedDate)
      .order('Fecha', { ascending: true })
      .limit(5);

    upcomingBookings?.forEach((booking) => {
      const isToday = booking.Fecha === new Date().toISOString().split('T')[0];
      notifications.push({
        id: `booking-${booking.id}`,
        type: 'reminder',
        title: isToday ? '¡Tu cita es hoy!' : 'Recordatorio de cita',
        message: `Tienes cita ${isToday ? 'hoy' : 'mañana'} a las ${booking.Hora.slice(0, 5)} con ${booking.stylist}`,
        read: false,
        created_at: new Date().toISOString(),
        metadata: { booking_id: booking.id },
      });
    });

    // Get unread messages count
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, unread_count_user, tenant_id')
      .eq('user_id', userId)
      .gt('unread_count_user', 0);

    if (conversations && conversations.length > 0) {
      const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count_user || 0), 0);
      notifications.push({
        id: 'messages-unread',
        type: 'message',
        title: 'Mensajes sin leer',
        message: `Tienes ${totalUnread} mensaje${totalUnread > 1 ? 's' : ''} sin leer`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Check for recent completed bookings that could use a review
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, Fecha, tenant_id')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .lt('Fecha', new Date().toISOString().split('T')[0])
      .gte('Fecha', weekAgo.toISOString().split('T')[0])
      .limit(3);

    if (recentBookings && recentBookings.length > 0) {
      // Check if user already reviewed these
      const { data: reviews } = await supabase
        .from('reviews')
        .select('tenant_id')
        .eq('user_id', userId);

      const reviewedTenants = new Set(reviews?.map(r => r.tenant_id) || []);
      const unreviewedBookings = recentBookings.filter(b => !reviewedTenants.has(b.tenant_id));

      if (unreviewedBookings.length > 0) {
        notifications.push({
          id: 'review-request',
          type: 'review',
          title: '¿Qué te pareció tu visita?',
          message: 'Deja una valoración para ayudar a otros usuarios',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error generating notifications:', error);
  }

  return notifications.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
    case 'reminder':
      return Calendar;
    case 'message':
      return MessageCircle;
    case 'review':
      return Star;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
    case 'reminder':
      return 'text-primary bg-primary/10';
    case 'message':
      return 'text-blue-500 bg-blue-500/10';
    case 'review':
      return 'text-amber-500 bg-amber-500/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const notifs = await generateNotifications(user.id);
        setNotifications(notifs);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Marcar todas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-foreground mb-1">Sin notificaciones</p>
              <p className="text-sm text-muted-foreground">
                Aquí verás tus recordatorios y avisos
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClasses = getNotificationColor(notification.type);

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'relative flex gap-3 p-3 rounded-xl mb-2 transition-colors',
                      notification.read
                        ? 'bg-transparent hover:bg-muted/50'
                        : 'bg-primary/5 hover:bg-primary/10'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorClasses)}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={cn(
                        'text-sm font-medium text-foreground line-clamp-1',
                        !notification.read && 'font-semibold'
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="absolute top-3 right-8 p-1 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
