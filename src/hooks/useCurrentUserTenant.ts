import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  // Inicializar con cache si existe
  const [state, setState] = useState<CurrentUserTenant>(() => {
    if (globalCache) {
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

  const hasChecked = useRef(false);

  useEffect(() => {
    // Si ya tenemos cache válida, no volver a cargar
    const checkCache = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      
      // Si el usuario es el mismo y ya tenemos cache, usar cache
      if (globalCache && cacheUserId === currentUserId && !state.loading) {
        return;
      }
      
      // Si ya verificamos en este montaje, no repetir
      if (hasChecked.current && cacheUserId === currentUserId) {
        return;
      }
      
      hasChecked.current = true;
      await checkUserTenant();
    };

    checkCache();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Solo recargar en eventos importantes de auth
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        hasChecked.current = false;
        globalCache = null;
        cacheUserId = null;
        checkUserTenant();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserTenant = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        const newState = {
          tenantId: null,
          isAdmin: false,
          isStylist: false,
          loading: false,
          tenant: null,
        };
        globalCache = newState;
        cacheUserId = null;
        setState(newState);
        return;
      }

      const userId = session.user.id;

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
        const newState = {
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

      // Check if user is a stylist (they can also post stories)
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
        const newState = {
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

      const newState = {
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
      const newState = {
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
