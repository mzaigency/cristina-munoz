import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  tenant_id: string;
  user_id: string;
  last_message_at: string;
  unread_count_user: number;
  unread_count_salon: number;
  created_at: string;
  tenant?: {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
  };
  user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  last_message?: {
    content: string;
    sender_type: string;
    created_at: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'salon';
  sender_id: string;
  content: string;
  is_read: boolean;
  message_type: string;
  metadata: any;
  created_at: string;
}

export function useConversations(role: 'user' | 'salon', tenantId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          tenant:tenants(id, name, logo_url, slug)
        `)
        .order('last_message_at', { ascending: false });

      if (role === 'salon' && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from('direct_messages')
            .select('content, sender_type, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // For salon view, fetch user profile
          let user = undefined;
          if (role === 'salon') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .eq('id', conv.user_id)
              .single();
            user = profile;
          }

          return {
            ...conv,
            user,
            last_message: messages?.[0] || null,
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las conversaciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, tenantId]);

  return { conversations, loading, refetch: fetchConversations };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, senderType: 'user' | 'salon', senderId: string) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: senderId,
        content,
        message_type: 'text',
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = async (senderType: 'user' | 'salon') => {
    if (!conversationId) return;

    try {
      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', senderType === 'user' ? 'salon' : 'user');

      // Reset unread count
      const updateField = senderType === 'user' ? 'unread_count_user' : 'unread_count_salon';
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading, sendMessage, markAsRead, refetch: fetchMessages };
}

export async function getOrCreateConversation(tenantId: string, userId: string): Promise<string | null> {
  try {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (existing) return existing.id;

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ tenant_id: tenantId, user_id: userId })
      .select('id')
      .single();

    if (error) throw error;
    return newConv?.id || null;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return null;
  }
}
