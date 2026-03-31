import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TenantAccess {
  isAdmin: boolean;
  isStylist: boolean;
  hasAccess: boolean;
  loading: boolean;
  userId: string | null;
  stylistId: string | null;
}

// Cache per tenant to avoid re-querying on re-renders
let accessCache: { tenantId: string; userId: string; result: TenantAccess } | null = null;

export const useTenantAccess = (tenantId: string | undefined): TenantAccess => {
  const [access, setAccess] = useState<TenantAccess>(() => {
    // Use cache if available for same tenant
    if (accessCache && accessCache.tenantId === tenantId) {
      return accessCache.result;
    }
    return {
      isAdmin: false,
      isStylist: false,
      hasAccess: false,
      loading: true,
      userId: null,
      stylistId: null,
    };
  });

  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      // Don't set loading to false — we're waiting for tenantId
      return;
    }

    // Skip if already checked for this tenant
    if (checkedRef.current === tenantId && accessCache?.tenantId === tenantId) {
      return;
    }

    checkedRef.current = tenantId;
    checkAccess();
  }, [tenantId]);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        const result: TenantAccess = {
          isAdmin: false,
          isStylist: false,
          hasAccess: false,
          loading: false,
          userId: null,
          stylistId: null,
        };
        setAccess(result);
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
        const result: TenantAccess = {
          isAdmin: true,
          isStylist: false,
          hasAccess: true,
          loading: false,
          userId,
          stylistId: null,
        };
        accessCache = { tenantId: tenantId!, userId, result };
        setAccess(result);
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

      const isAdminResult = !!adminData;
      const isStylistResult = !!stylistData;

      const result: TenantAccess = {
        isAdmin: isAdminResult,
        isStylist: isStylistResult,
        hasAccess: isAdminResult || isStylistResult,
        loading: false,
        userId,
        stylistId: stylistData?.id || null,
      };
      accessCache = { tenantId: tenantId!, userId, result };
      setAccess(result);
    } catch (error) {
      console.error("Error checking tenant access:", error);
      setAccess({
        isAdmin: false,
        isStylist: false,
        hasAccess: false,
        loading: false,
        userId: null,
        stylistId: null,
      });
    }
  };

  return access;
};
