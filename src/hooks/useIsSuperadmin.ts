import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

let cache: { userId: string; value: boolean } | null = null;

export function useIsSuperadmin(): boolean {
  const { user } = useAuth();
  const [isSuperadmin, setIsSuperadmin] = useState<boolean>(
    () => !!user && cache?.userId === user.id && cache.value
  );

  useEffect(() => {
    if (!user) {
      setIsSuperadmin(false);
      return;
    }
    if (cache?.userId === user.id) {
      setIsSuperadmin(cache.value);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "superadmin")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const value = !!data;
        cache = { userId: user.id, value };
        setIsSuperadmin(value);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return isSuperadmin;
}
