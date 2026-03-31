import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CurrentUserTenant {
  tenantId: string | null;
  isAdmin: boolean;
  isStylist: boolean;
  loading: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
  } | null;
}

// Cache global para mantener el estado entre navegaciones
let globalCache: CurrentUserTenant | null = null;
let cacheUserId: string | null = null;

export const useCurrentUserTenant = (): CurrentUserTenant => {
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<CurrentUserTenant>(() => {
    if (globalCache && cacheUserId === user?.id) {
      return globalCache;
    }
    return {
      tenantId: null,
      isAdmin: false,
      isStylist: false,
      loading: true,
      tenant: null,
    };
  });

  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;

    const userId = user?.id ?? null;

    // No user — clear state
    if (!userId) {
      const newState: CurrentUserTenant = {
        tenantId: null,
        isAdmin: false,
        isStylist: false,
        loading: false,
        tenant: null,
      };
      globalCache = newState;
      cacheUserId = null;
      checkedUserId.current = null;
      setState(newState);
      return;
    }

    // Already checked for this user and cache is valid
    if (checkedUserId.current === userId && globalCache && cacheUserId === userId) {
      if (state.loading) setState(globalCache);
      return;
    }

    checkedUserId.current = userId;
    checkUserTenant(userId);
  }, [user?.id, authLoading]);

  const checkUserTenant = async (userId: string) => {
    try {
      // Check if user is a tenant admin
      const { data: adminData } = await supabase
        .from("tenant_admins")
        .select(`
          tenant_id,
          tenant:tenants (
            id,
            name,
            slug,
            logo_url,
            primary_color
          )
        `)
        .eq("user_id", userId)
        .maybeSingle();

      if (adminData?.tenant) {
        const newState: CurrentUserTenant = {
          tenantId: adminData.tenant_id,
          isAdmin: true,
          isStylist: false,
          loading: false,
          tenant: adminData.tenant as CurrentUserTenant["tenant"],
        };
        globalCache = newState;
        cacheUserId = userId;
        setState(newState);
        return;
      }

      // Check if user is a stylist
      const { data: stylistData } = await supabase
        .from("tenant_stylists")
        .select(`
          tenant_id,
          tenant:tenants (
            id,
            name,
            slug,
            logo_url,
            primary_color
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (stylistData?.tenant) {
        const newState: CurrentUserTenant = {
          tenantId: stylistData.tenant_id,
          isAdmin: false,
          isStylist: true,
          loading: false,
          tenant: stylistData.tenant as CurrentUserTenant["tenant"],
        };
        globalCache = newState;
        cacheUserId = userId;
        setState(newState);
        return;
      }

      const newState: CurrentUserTenant = {
        tenantId: null,
        isAdmin: false,
        isStylist: false,
        loading: false,
        tenant: null,
      };
      globalCache = newState;
      cacheUserId = userId;
      setState(newState);
    } catch (error) {
      console.error("Error checking user tenant:", error);
      const newState: CurrentUserTenant = {
        tenantId: null,
        isAdmin: false,
        isStylist: false,
        loading: false,
        tenant: null,
      };
      globalCache = newState;
      cacheUserId = null;
      setState(newState);
    }
  };

  return state;
};
