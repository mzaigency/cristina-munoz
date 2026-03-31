import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string | null;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  action_url: string | null;
  created_at: string;
  expires_at: string | null;
}

interface UseNotificationsOptions {
  forTenant?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);

      if (options.forTenant) {
        query = query.not("tenant_id", "is", null);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const notifs = (data || []) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [options.forTenant, user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const notification = notifications.find((n) => n.id === notificationId);
        const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
        if (error) throw error;
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifications],
  );

  const clearAll = useCallback(async () => {
    try {
      if (!user) return;
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
      if (error) throw error;
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
  };
}
