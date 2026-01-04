import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFollows() {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get all tenants the user follows
  const { data: following = [], isLoading: isLoadingFollowing } = useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("follows")
        .select("tenant_id")
        .eq("follower_id", userId);
      if (error) throw error;
      return data.map((f) => f.tenant_id);
    },
    enabled: !!userId,
  });

  // Get follower count for a specific tenant
  const useFollowerCount = (tenantId: string) => {
    return useQuery({
      queryKey: ["followerCount", tenantId],
      queryFn: async () => {
        const { data, error } = await supabase
          .rpc("get_follower_count", { _tenant_id: tenantId });
        if (error) throw error;
        return data as number;
      },
      enabled: !!tenantId,
    });
  };

  const followMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      if (!userId) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: userId, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["followerCount", tenantId] });
      toast({ title: "¡Ahora sigues a este salón!" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo seguir", variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      if (!userId) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["followerCount", tenantId] });
      toast({ title: "Has dejado de seguir" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo dejar de seguir", variant: "destructive" });
    },
  });

  const toggleFollow = useCallback((tenantId: string) => {
    if (!userId) {
      toast({ 
        title: "Inicia sesión", 
        description: "Necesitas una cuenta para seguir salones" 
      });
      return;
    }
    if (following.includes(tenantId)) {
      unfollowMutation.mutate(tenantId);
    } else {
      followMutation.mutate(tenantId);
    }
  }, [userId, following, followMutation, unfollowMutation, toast]);

  const isFollowing = useCallback((tenantId: string) => following.includes(tenantId), [following]);

  // Count of tenants the user follows
  const followingCount = following.length;

  return {
    following,
    followingCount,
    isLoadingFollowing,
    toggleFollow,
    isFollowing,
    useFollowerCount,
    isAuthenticated: !!userId,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  };
}
