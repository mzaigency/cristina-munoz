import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface RecommendationScore {
  tenant_id: string;
  score: number;
  matchReasons: string[];
}

export function useRecommendations() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        return null;
      }

      return data?.recommendations as RecommendationScore[] | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Create a map for quick lookups
  const scoresMap = new Map<string, RecommendationScore>();
  data?.forEach(rec => {
    scoresMap.set(rec.tenant_id, rec);
  });

  return {
    recommendations: data,
    scoresMap,
    isLoading,
    error,
    isAuthenticated: !!userId
  };
}
