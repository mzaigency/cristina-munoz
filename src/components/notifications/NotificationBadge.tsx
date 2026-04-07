import { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { useHaptic } from '@/hooks/useHaptic';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBadgeProps {
  className?: string;
  forTenant?: boolean;
}

export function NotificationBadge({ className, forTenant = false }: NotificationBadgeProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount, markAllAsRead } = useNotifications({ forTenant });
  const { light } = useHaptic();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      light();
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
    setOpen(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={cn(
            "relative p-2 rounded-full transition-colors",
            "hover:bg-muted active:bg-muted/80",
            className
          )}
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell className="h-5 w-5 text-foreground" />
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                  "min-w-[18px] h-[18px] px-1 text-[10px] font-bold",
                  "bg-destructive text-destructive-foreground rounded-full"
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 border-l border-border"
      >
        <NotificationCenter 
          forTenant={forTenant} 
          onClose={() => setOpen(false)} 
        />
      </SheetContent>
    </Sheet>
  );
}
