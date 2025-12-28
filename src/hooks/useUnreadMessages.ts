import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('unread_count_user')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = (data || []).reduce((sum, conv) => sum + (conv.unread_count_user || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Also listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUnreadCount();
    });

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  return { unreadCount, loading, refetch: fetchUnreadCount };
}
