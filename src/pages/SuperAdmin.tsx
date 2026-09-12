import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { SuperAdminCommandPalette } from "@/components/superadmin/SuperAdminCommandPalette";
import { CommandCenterSection } from "@/components/superadmin/sections/CommandCenterSection";
import { TenantsSection } from "@/components/superadmin/sections/TenantsSection";
import { UsersSection } from "@/components/superadmin/sections/UsersSection";
import { ModerationSection } from "@/components/superadmin/sections/ModerationSection";
import { MonetizationSection } from "@/components/superadmin/sections/MonetizationSection";
import { SystemHealthSection } from "@/components/superadmin/sections/SystemHealthSection";
import { DemoFactorySection } from "@/components/superadmin/sections/DemoFactorySection";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Security & Loading
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Tab & Subtab Navigation from URL or default
  const currentTab = searchParams.get("tab") || "command";
  const currentSubtab = searchParams.get("sub") || (currentTab === "command" ? "kpis" : currentTab === "tenants" ? "directory" : currentTab === "community" ? "users" : "plans");

  // Modals & Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false);
  const [tenantsForCommand, setTenantsForCommand] = useState<{ id: string; name: string; slug: string; is_active: boolean }[]>([]);

  useEffect(() => {
    verifySuperAdminAccess();
  }, []);

  const verifySuperAdminAccess = async () => {
    try {
      setLoading(true);

      // 1. Session Check
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate("/auth", { replace: true });
        return;
      }

      // 2. Direct Role Verification (both via RPC and user_roles table)
      const [rpcRes, roleRes] = await Promise.all([
        supabase.rpc("is_superadmin"),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "superadmin")
          .maybeSingle(),
      ]);

      const isRpcSuperadmin = !!rpcRes.data;
      const isRoleSuperadmin = !!roleRes.data;

      if (!isRpcSuperadmin && !isRoleSuperadmin) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de SuperAdmin para acceder a esta área.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      setIsSuperAdmin(true);

      // Load lightweight tenants list for Command Palette
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name, slug, is_active")
        .order("name", { ascending: true })
        .limit(100);

      setTenantsForCommand(tenantsData || []);
    } catch (error: any) {
      console.error("Error verifying superadmin access:", error);
      toast({
        title: "Error de verificación",
        description: "No se pudo comprobar tu identidad de superadministrador.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string, subtab: string) => {
    setSearchParams({ tab, sub: subtab });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--glow-surface)] select-none">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border border-[var(--glow-line)] bg-card shadow-lg max-w-xs text-center">
          <Loader2 className="h-9 w-9 animate-spin text-[var(--glow-brand)]" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Verificando Credenciales</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprobando acceso seguro de SuperAdmin...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <>
      <SuperAdminLayout
        activeTab={currentTab}
        activeSubtab={currentSubtab}
        onTabChange={handleTabChange}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNewTenantModal={() => setIsCreateTenantModalOpen(true)}
      >
        {/* Renderizado de Secciones según módulo activo */}
        {currentTab === "command" && (
          <CommandCenterSection
            subtab={currentSubtab}
            onNavigateTab={handleTabChange}
            onOpenNewTenantModal={() => setIsCreateTenantModalOpen(true)}
          />
        )}

        {currentTab === "tenants" && (
          <TenantsSection
            subtab={currentSubtab}
            onNavigateTab={handleTabChange}
            isCreateModalOpen={isCreateTenantModalOpen}
            onCloseCreateModal={() => setIsCreateTenantModalOpen(false)}
            onOpenCreateModal={() => setIsCreateTenantModalOpen(true)}
          />
        )}

        {currentTab === "community" && (
          <>
            {currentSubtab === "users" ? (
              <UsersSection onNavigateTab={handleTabChange} />
            ) : (
              <ModerationSection subtab={currentSubtab} />
            )}
          </>
        )}

        {currentTab === "system" && (
          <>
            {currentSubtab === "plans" || currentSubtab === "transactions" ? (
              <MonetizationSection subtab={currentSubtab} />
            ) : currentSubtab === "logs" ? (
              <SystemHealthSection />
            ) : (
              <DemoFactorySection />
            )}
          </>
        )}
      </SuperAdminLayout>

      {/* Buscador Universal Cmd+K */}
      <SuperAdminCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onSelectTab={handleTabChange}
        tenants={tenantsForCommand}
        onOpenNewTenantModal={() => setIsCreateTenantModalOpen(true)}
      />
    </>
  );
};

export default SuperAdmin;