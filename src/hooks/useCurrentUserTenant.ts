import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CurrentUserTenant {
  tenantId: string | null;
  isAdmin: boolean;
  loading: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
  } | null;
}

export const useCurrentUserTenant = (): CurrentUserTenant => {
  const [state, setState] = useState<CurrentUserTenant>({
    tenantId: null,
    isAdmin: false,
    loading: true,
    tenant: null,
  });

  useEffect(() => {
    checkUserTenant();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserTenant();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserTenant = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setState({
          tenantId: null,
          isAdmin: false,
          loading: false,
          tenant: null,
        });
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
        setState({
          tenantId: adminData.tenant_id,
          isAdmin: true,
          loading: false,
          tenant: adminData.tenant as CurrentUserTenant["tenant"],
        });
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
        setState({
          tenantId: stylistData.tenant_id,
          isAdmin: false,
          loading: false,
          tenant: stylistData.tenant as CurrentUserTenant["tenant"],
        });
        return;
      }

      setState({
        tenantId: null,
        isAdmin: false,
        loading: false,
        tenant: null,
      });
    } catch (error) {
      console.error("Error checking user tenant:", error);
      setState({
        tenantId: null,
        isAdmin: false,
        loading: false,
        tenant: null,
      });
    }
  };

  return state;
};