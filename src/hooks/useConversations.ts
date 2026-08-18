import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    sender_type: string;
    created_at: string;
    message_type?: string;
  };
  /** true si hay al menos un mensaje escrito por una persona (no automático) */
  has_human_message?: boolean;
  /** último mensaje humano (si existe) */
  last_human_message?: {
    content: string;
    sender_type: string;
    created_at: string;
  } | null;
}

export const AUTOMATIC_MESSAGE_TYPES = [
  "booking_confirmation",
  "booking_reminder",
  "booking_cancelled",
  "booking_cancellation",
  "review_request",
  "waitlist_availability",
  "waitlist_proposal",
];

export const isAutomaticMessage = (type?: string | null) =>
  !!type && type !== "text" && type !== "story_reply";

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "user" | "salon";
  sender_id: string;
  content: string;
  is_read: boolean;
  message_type: string;
  metadata: any;
  created_at: string;
}

export function useConversations(role: "user" | "salon", tenantId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("conversations")
        .select(
          `
          *,
          tenant:tenants(id, name, logo_url, slug)
        `,
        )
        .order("last_message_at", { ascending: false });

      if (role === "salon" && tenantId) {
        query = query.eq("tenant_id", tenantId);
      } else if (role === "user" && currentUser) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const baseConversations = (data || []) as any[];

      // En vista "usuario": si el embed de tenant viene vacío por permisos, lo rellenamos con el perfil público
      let publicTenantById: Map<string, { id: string; name: string; logo_url: string | null; slug: string }> | null =
        null;

      if (role === "user") {
        const neededTenantIds = Array.from(
          new Set(
            baseConversations
              .filter((c) => !c?.tenant?.name)
              .map((c) => c.tenant_id)
              .filter(Boolean),
          ),
        );

        if (neededTenantIds.length > 0) {
          const { data: publicTenants } = await supabase.rpc("get_public_tenants");

          publicTenantById = new Map(
            (publicTenants || [])
              .filter((t: any) => neededTenantIds.includes(t.id))
              .map((t: any) => [
                t.id,
                {
                  id: t.id,
                  name: t.name,
                  logo_url: t.logo_url ?? null,
                  slug: t.slug,
                },
              ]),
          );
        }
      }

      // Batch fetch: Get all conversation IDs for efficient querying
      const conversationIds = baseConversations.map((c) => c.id);
      const userIds = role === "salon" ? baseConversations.map((c) => c.user_id).filter(Boolean) : [];

      // Batch fetch last messages for ALL conversations in one query
      // Using a subquery approach with DISTINCT ON
      const lastMessagesMap = new Map<string, { content: string; sender_type: string; created_at: string }>();

      if (conversationIds.length > 0) {
        // Fetch the most recent message per conversation
        const { data: allMessages } = await supabase
          .from("direct_messages")
          .select("conversation_id, content, sender_type, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        // Group by conversation_id and take the first (most recent) message
        if (allMessages) {
          const seenConversations = new Set<string>();
          for (const msg of allMessages) {
            if (!seenConversations.has(msg.conversation_id)) {
              seenConversations.add(msg.conversation_id);
              lastMessagesMap.set(msg.conversation_id, {
                content: msg.content,
                sender_type: msg.sender_type,
                created_at: msg.created_at,
              });
            }
          }
        }
      }

      // Batch fetch user profiles for salon view (one query for all users)
      const userProfilesMap = new Map<
        string,
        { id: string; full_name: string | null; email: string; avatar_url: string | null }
      >();

      if (role === "salon" && userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", userIds);

        if (profiles) {
          for (const profile of profiles) {
            userProfilesMap.set(profile.id, profile);
          }
        }
      }

      // Combine all data without additional queries
      const conversationsWithMessages = baseConversations.map((conv) => {
        const tenant = conv?.tenant?.name ? conv.tenant : publicTenantById?.get(conv.tenant_id);
        const user = role === "salon" ? userProfilesMap.get(conv.user_id) : undefined;
        const last_message = lastMessagesMap.get(conv.id) || null;

        return {
          ...conv,
          tenant,
          user,
          last_message,
        };
      });

      setConversations(conversationsWithMessages);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        },
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
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, senderType: "user" | "salon", senderId: string) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: senderId,
        content,
        message_type: "text",
      });

      if (error) throw error;

      // Send push notification to recipient
      try {
        // Get conversation to find recipient
        const { data: conversation } = await supabase
          .from("conversations")
          .select("user_id, tenant_id, tenant:tenants(name)")
          .eq("id", conversationId)
          .single();

        if (conversation) {
          if (senderType === "salon") {
            // If sender is salon, notify user
            const tenantName = (conversation.tenant as any)?.name || "Salón";
            await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: conversation.user_id,
                title: `Nuevo mensaje de ${tenantName}`,
                body: content.length > 50 ? content.substring(0, 50) + "..." : content,
                data: { type: "message", conversation_id: conversationId },
              },
            });
          } else {
            // If sender is user, notify tenant admins
            const { data: tenantAdmins } = await supabase
              .from("tenant_admins")
              .select("user_id")
              .eq("tenant_id", conversation.tenant_id);

            if (tenantAdmins && tenantAdmins.length > 0) {
              // Get user name for notification
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", senderId)
                .maybeSingle();

              const userName = userProfile?.full_name || "Cliente";

              for (const admin of tenantAdmins) {
                await supabase.functions.invoke("send-push-notification", {
                  body: {
                    user_id: admin.user_id,
                    title: `✉️ ${userName}`,
                    body: content.length > 100 ? content.substring(0, 100) + "..." : content,
                    data: {
                      type: "client_message",
                      conversation_id: conversationId,
                      tenant_id: conversation.tenant_id,
                    },
                  },
                });
              }
            }
          }
        }
      } catch (pushError) {
        console.log("Push notification failed (non-critical):", pushError);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (senderType: "user" | "salon") => {
    if (!conversationId) return;

    try {
      // Mark messages as read
      await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("sender_type", senderType === "user" ? "salon" : "user");

      // Reset unread count
      const updateField = senderType === "user" ? "unread_count_user" : "unread_count_salon";
      await supabase
        .from("conversations")
        .update({ [updateField]: 0 })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
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
    // Check if conversation already exists - use maybeSingle to avoid errors
    const { data: existing, error: fetchError } = await supabase
      .from("conversations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing conversation:", fetchError);
      throw fetchError;
    }

    // If conversation exists, return its ID
    if (existing) {
      return existing.id;
    }

    // Double-check with a more specific query to prevent race conditions
    const { data: doubleCheck } = await supabase
      .from("conversations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .limit(1);

    if (doubleCheck && doubleCheck.length > 0) {
      return doubleCheck[0].id;
    }

    // Create new conversation only if it truly doesn't exist
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({ tenant_id: tenantId, user_id: userId })
      .select("id")
      .single();

    if (error) {
      // If we get a unique constraint violation, the conversation was created by another request
      if (error.code === "23505") {
        const { data: retryFetch } = await supabase
          .from("conversations")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("user_id", userId)
          .maybeSingle();
        return retryFetch?.id || null;
      }
      throw error;
    }
    return newConv?.id || null;
  } catch (error) {
    console.error("Error getting/creating conversation:", error);
    return null;
  }
}
