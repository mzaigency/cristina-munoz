import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecommendationScore {
  tenant_id: string;
  score: number;
  matchReasons: string[];
}

export function useRecommendations() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Session is available from AuthContext but we need the token for the edge function
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) return null;

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
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
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
