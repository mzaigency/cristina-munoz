import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Building2, Users, BarChart3, Shield, LayoutDashboard,
  Heart, Activity, FileImage, Moon, Sun, ChevronLeft, Menu, CreditCard, Sparkles, Wand2
} from "lucide-react";
import { TenantsManager } from "@/components/superadmin/TenantsManager";
import { UsersManager } from "@/components/superadmin/UsersManager";
import { SuperAdminDashboard } from "@/components/superadmin/SuperAdminDashboard";
import { PlatformAnalytics } from "@/components/superadmin/PlatformAnalytics";
import { SubscriptionPlansManager } from "@/components/superadmin/SubscriptionPlansManager";
import { FavoritesManager } from "@/components/superadmin/FavoritesManager";
import { ActivityCenter } from "@/components/superadmin/ActivityCenter";
import { ContentManager } from "@/components/superadmin/ContentManager";
import { MaintenanceToggle } from "@/components/superadmin/MaintenanceToggle";
import { LeadsManager } from "@/components/superadmin/LeadsManager";
import { FeedAnalytics } from "@/components/superadmin/FeedAnalytics";
import { DemoFactory } from "@/components/superadmin/DemoFactory";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const SuperAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  useEffect(() => {
    checkSuperAdminAccess();
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);
  const checkSuperAdminAccess = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const {
        data: roleData,
        error: roleError
      } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "superadmin").maybeSingle();
      if (roleError) {
        console.error("Error checking role:", roleError);
        toast({
          title: "Error",
          description: "No se pudo verificar tu acceso",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      if (!roleData) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de SuperAdmin",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      setIsSuperAdmin(true);
    } catch (error) {
      console.error("Error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };
  const tabs = [{
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  }, {
    id: "tenants",
    label: "Tenants",
    icon: Building2
  }, {
    id: "users",
    label: "Usuarios",
    icon: Users
  }, {
    id: "plans",
    label: "Planes",
    icon: CreditCard
  }, {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3
  }, {
    id: "feed",
    label: "Feed",
    icon: Sparkles
  }, {
    id: "favorites",
    label: "Favoritos",
    icon: Heart
  }, {
    id: "activity",
    label: "Actividad",
    icon: Activity
  }, {
    id: "content",
    label: "Contenido",
    icon: FileImage
  }, {
    id: "leads",
    label: "Leads B2B",
    icon: Building2
  }, {
    id: "demos",
    label: "Demos",
    icon: Wand2
  }];
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>;
  }
  if (!isSuperAdmin) {
    return null;
  }

  const SidebarNav = ({
    onTabClick
  }: {
    onTabClick?: () => void;
  }) => <>
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-foreground">SuperAdmin</h1>
            <p className="text-[11px] text-muted-foreground">Panel de control</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { handleTabChange(tab.id); onTabClick?.(); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 text-left",
              activeTab === tab.id
                ? "bg-white/10 backdrop-blur-sm text-foreground shadow-sm border border-white/[0.08]"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <tab.icon className={cn("h-[18px] w-[18px] flex-shrink-0", activeTab === tab.id && "text-primary")} />
            <span className="text-[13px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </>;

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex h-screen overflow-hidden" style={{ height: 'calc(100vh - env(safe-area-inset-top))' }}>

        {/* Desktop Sidebar */}
        {!isMobile && (
          <motion.aside
            initial={false}
            animate={{ width: sidebarCollapsed ? 72 : 260 }}
            className="flex-shrink-0 bg-card/40 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col hidden md:flex"
          >
            {!sidebarCollapsed ? (
              <SidebarNav />
            ) : (
              <>
                <div className="p-4 border-b border-white/[0.06] flex justify-center">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "w-full flex items-center justify-center p-2.5 rounded-2xl transition-all",
                        activeTab === tab.id
                          ? "bg-white/10 text-primary"
                          : "text-muted-foreground hover:bg-white/5"
                      )}
                      title={tab.label}
                    >
                      <tab.icon className="h-5 w-5" />
                    </button>
                  ))}
                </nav>
              </>
            )}
            <div className="p-3 border-t border-white/[0.06]">
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full justify-center rounded-xl hover:bg-white/5">
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </motion.aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header — glass bar */}
          <header className="h-14 border-b border-white/[0.06] bg-card/30 backdrop-blur-2xl flex items-center justify-between px-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0 bg-card/80 backdrop-blur-2xl border-white/[0.06]">
                    <div className="flex flex-col h-full">
                      <SidebarNav onTabClick={() => setMobileMenuOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <h2 className="font-semibold text-sm text-foreground truncate">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-xl hover:bg-white/5">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1 h-9 px-2.5 rounded-xl hover:bg-white/5 text-xs">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "dashboard" && <><MaintenanceToggle /><SuperAdminDashboard /></>}
                {activeTab === "tenants" && <TenantsManager />}
                {activeTab === "users" && <UsersManager />}
                {activeTab === "plans" && <SubscriptionPlansManager />}
                {activeTab === "analytics" && <PlatformAnalytics />}
                {activeTab === "feed" && <FeedAnalytics />}
                {activeTab === "favorites" && <FavoritesManager />}
                {activeTab === "activity" && <ActivityCenter />}
                {activeTab === "content" && <ContentManager />}
                {activeTab === "leads" && <LeadsManager />}
                {activeTab === "demos" && <DemoFactory />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};
export default SuperAdmin;