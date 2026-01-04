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
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());

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
        agenda: viewedSections.has('agenda') ? 0 : (newBookingsResult.count || 0),
        clients: viewedSections.has('clients') ? 0 : (newClientsResult.count || 0),
        business: 0,
        messages: viewedSections.has('communication') ? 0 : unreadMessages,
        reviews: viewedSections.has('communication') ? 0 : (pendingReviewsResult.count || 0)
      });
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, viewedSections]);

  // Mark a section as viewed (clears its notification)
  const markSectionViewed = useCallback((section: string) => {
    setViewedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(section);
      return newSet;
    });
    
    // Clear the count for this section immediately
    setCounts(prev => {
      const newCounts = { ...prev };
      if (section === 'agenda') newCounts.agenda = 0;
      if (section === 'clients') newCounts.clients = 0;
      if (section === 'communication') {
        newCounts.messages = 0;
        newCounts.reviews = 0;
      }
      return newCounts;
    });
  }, []);

  // Reset viewed sections (e.g., on new day or refresh)
  const resetViewedSections = useCallback(() => {
    setViewedSections(new Set());
  }, []);

  useEffect(() => {
    fetchCounts();

    if (!tenantId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`admin-notifications-${tenantId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `tenant_id=eq.${tenantId}` },
        () => {
          // Only update if section hasn't been viewed
          if (!viewedSections.has('agenda')) {
            setCounts(prev => ({ ...prev, agenda: prev.agenda + 1 }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clients', filter: `tenant_id=eq.${tenantId}` },
        () => {
          if (!viewedSections.has('clients')) {
            setCounts(prev => ({ ...prev, clients: prev.clients + 1 }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `tenant_id=eq.${tenantId}` },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews', filter: `tenant_id=eq.${tenantId}` },
        () => {
          if (!viewedSections.has('communication')) {
            setCounts(prev => ({ ...prev, reviews: prev.reviews + 1 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchCounts, viewedSections]);

  // Get total for communication section (messages + reviews)
  const getCommunicationCount = () => counts.messages + counts.reviews;

  return {
    counts,
    loading,
    refetch: fetchCounts,
    getCommunicationCount,
    markSectionViewed,
    resetViewedSections
  };
}
