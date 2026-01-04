import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Bell, 
  Calendar, 
  MessageCircle, 
  Star, 
  Clock,
  Trash2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useHaptic } from '@/hooks/useHaptic';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking_confirmed':
    case 'booking_reminder':
    case 'booking_cancelled':
    case 'new_booking':
      return Calendar;
    case 'new_message':
      return MessageCircle;
    case 'new_review':
    case 'review_approved':
      return Star;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'booking_confirmed':
    case 'new_booking':
      return 'text-green-500 bg-green-500/10';
    case 'booking_reminder':
      return 'text-amber-500 bg-amber-500/10';
    case 'booking_cancelled':
      return 'text-red-500 bg-red-500/10';
    case 'new_message':
      return 'text-blue-500 bg-blue-500/10';
    case 'new_review':
    case 'review_approved':
      return 'text-yellow-500 bg-yellow-500/10';
    default:
      return 'text-primary bg-primary/10';
  }
};

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const navigate = useNavigate();
  const { light, medium } = useHaptic();
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);

  const handleClick = () => {
    light();
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    light();
    onMarkAsRead(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    medium();
    onDelete(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors",
        "hover:bg-muted/50 active:bg-muted",
        !notification.read && "bg-primary/5 border-l-2 border-primary"
      )}
    >
      {/* Icon */}
      <div className={cn("p-2 rounded-full shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "text-sm line-clamp-1",
            !notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
          )}>
            {notification.title}
          </h4>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
          
          <div className="flex items-center gap-1 ml-auto">
            {!notification.read && (
              <button
                onClick={handleMarkAsRead}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                title="Marcar como leída"
              >
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
