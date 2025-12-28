import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFavorites() {
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

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("tenant_id")
        .eq("user_id", userId);
      if (error) throw error;
      return data.map((f) => f.tenant_id);
    },
    enabled: !!userId,
  });

  const addFavorite = useMutation({
    mutationFn: async (tenantId: string) => {
      if (!userId) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({ title: "Añadido a favoritos", description: "❤️" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo añadir", variant: "destructive" });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (tenantId: string) => {
      if (!userId) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({ title: "Eliminado de favoritos" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    },
  });

  const toggleFavorite = (tenantId: string) => {
    if (!userId) {
      toast({ 
        title: "Inicia sesión", 
        description: "Necesitas una cuenta para guardar favoritos" 
      });
      return;
    }
    if (favorites.includes(tenantId)) {
      removeFavorite.mutate(tenantId);
    } else {
      addFavorite.mutate(tenantId);
    }
  };

  const isFavorite = (tenantId: string) => favorites.includes(tenantId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    isAuthenticated: !!userId,
  };
}
