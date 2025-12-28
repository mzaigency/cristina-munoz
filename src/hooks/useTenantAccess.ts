import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TenantAccess {
  isAdmin: boolean;
  isStylist: boolean;
  hasAccess: boolean;
  loading: boolean;
  userId: string | null;
}

export const useTenantAccess = (tenantId: string | undefined): TenantAccess => {
  const [access, setAccess] = useState<TenantAccess>({
    isAdmin: false,
    isStylist: false,
    hasAccess: false,
    loading: true,
    userId: null,
  });

  useEffect(() => {
    if (!tenantId) {
      setAccess(prev => ({ ...prev, loading: false }));
      return;
    }

    checkAccess();
  }, [tenantId]);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setAccess({
          isAdmin: false,
          isStylist: false,
          hasAccess: false,
          loading: false,
          userId: null,
        });
        return;
      }

      const userId = session.user.id;

      // Check superadmin
      const { data: superadminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "superadmin")
        .maybeSingle();

      if (superadminRole) {
        setAccess({
          isAdmin: true,
          isStylist: false,
          hasAccess: true,
          loading: false,
          userId,
        });
        return;
      }

      // Check tenant admin
      const { data: adminData } = await supabase
        .from("tenant_admins")
        .select("id")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      // Check tenant stylist
      const { data: stylistData } = await supabase
        .from("tenant_stylists")
        .select("id")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .maybeSingle();

      const isAdmin = !!adminData;
      const isStylist = !!stylistData;

      setAccess({
        isAdmin,
        isStylist,
        hasAccess: isAdmin || isStylist,
        loading: false,
        userId,
      });
    } catch (error) {
      console.error("Error checking tenant access:", error);
      setAccess({
        isAdmin: false,
        isStylist: false,
        hasAccess: false,
        loading: false,
        userId: null,
      });
    }
  };

  return access;
};
