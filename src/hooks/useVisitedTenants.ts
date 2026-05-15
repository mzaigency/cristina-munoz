import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Devuelve los tenant_ids únicos donde el usuario ya ha tenido reservas,
 * ordenados por la fecha más reciente primero. Útil para sección
 * "Volver a visitar".
 */
export function useVisitedTenants() {
  const { user } = useAuth();
  const [tenantIds, setTenantIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setTenantIds([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("get_my_bookings")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setTenantIds([]);
          return;
        }
        const seen = new Set<string>();
        const ordered: string[] = [];
        const sorted = [...(data as any[])].sort((a, b) => {
          const da = `${a.Fecha ?? ""} ${a.Hora ?? ""}`;
          const db = `${b.Fecha ?? ""} ${b.Hora ?? ""}`;
          return db.localeCompare(da);
        });
        for (const b of sorted) {
          const tid = b.tenant_id;
          if (tid && !seen.has(tid)) {
            seen.add(tid);
            ordered.push(tid);
          }
        }
        setTenantIds(ordered);
      })
      .then(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { tenantIds, loading };
}
