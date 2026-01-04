import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminNotificationCounts {
  agenda: number;
  clients: number;
  business: number;
  messages: number;
  reviews: number;
}

export function useAdminNotifications(tenantId: string | null) {
  const [counts, setCounts] = useState<AdminNotificationCounts>({
    agenda: 0,
    clients: 0,
    business: 0,
    messages: 0,
    reviews: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!tenantId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch counts in parallel
      const [
        newBookingsResult,
        newClientsResult,
        unreadMessagesResult,
        pendingReviewsResult
      ] = await Promise.all([
        // New bookings today
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('Fecha', today)
          .eq('status', 'confirmed'),
        
        // New clients this week
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', lastWeek),
        
        // Unread messages (salon side)
        supabase
          .from('conversations')
          .select('unread_count_salon')
          .eq('tenant_id', tenantId),
        
        // Pending reviews (not approved)
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('approved', false)
      ]);

      const unreadMessages = (unreadMessagesResult.data || [])
        .reduce((sum, conv) => sum + (conv.unread_count_salon || 0), 0);

      setCounts({
        agenda: newBookingsResult.count || 0,
        clients: newClientsResult.count || 0,
        business: 0,
        messages: unreadMessages,
        reviews: pendingReviewsResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCounts();

    if (!tenantId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`admin-notifications-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `tenant_id=eq.${tenantId}` },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients', filter: `tenant_id=eq.${tenantId}` },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `tenant_id=eq.${tenantId}` },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `tenant_id=eq.${tenantId}` },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchCounts]);

  // Get total for communication section (messages + reviews)
  const getCommunicationCount = () => counts.messages + counts.reviews;

  return {
    counts,
    loading,
    refetch: fetchCounts,
    getCommunicationCount
  };
}
