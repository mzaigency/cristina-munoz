import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Users, BarChart3, Shield, LayoutDashboard, Heart, Activity, FileImage, Search, Bell, Moon, Sun, ChevronLeft, Menu, CreditCard, X } from "lucide-react";
import { TenantsManager } from "@/components/superadmin/TenantsManager";
import { GlobalStats } from "@/components/superadmin/GlobalStats";
import { UsersManager } from "@/components/superadmin/UsersManager";
import { SuperAdminDashboard } from "@/components/superadmin/SuperAdminDashboard";
import { PlatformAnalytics } from "@/components/superadmin/PlatformAnalytics";
import { SubscriptionPlansManager } from "@/components/superadmin/SubscriptionPlansManager";
import { FavoritesManager } from "@/components/superadmin/FavoritesManager";
import { ActivityCenter } from "@/components/superadmin/ActivityCenter";
import { ContentManager } from "@/components/superadmin/ContentManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [globalSearch, setGlobalSearch] = useState("");
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

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = ({
    onTabClick
  }: {
    onTabClick?: () => void;
  }) => <>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">SuperAdmin</h1>
            <p className="text-xs text-muted-foreground">Panel de control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tabs.map(tab => <button key={tab.id} onClick={() => {
        handleTabChange(tab.id);
        onTabClick?.();
      }} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200", activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            <tab.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>)}
      </nav>
    </>;
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex h-screen overflow-hidden" style={{ height: 'calc(100vh - env(safe-area-inset-top))' }}>
        {/* Desktop Sidebar */}
        {!isMobile && <motion.aside initial={false} animate={{
        width: sidebarCollapsed ? 72 : 240
      }} className={cn("flex-shrink-0 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col", "transition-all duration-300 hidden md:flex")}>
            {!sidebarCollapsed ? <SidebarContent /> : <>
                {/* Collapsed sidebar */}
                <div className="p-4 border-b border-border/50 flex justify-center">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                  {tabs.map(tab => <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={cn("w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-200", activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-muted-foreground hover:bg-secondary hover:text-foreground")} title={tab.label}>
                      <tab.icon className="h-5 w-5" />
                    </button>)}
                </nav>
              </>}

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full justify-center">
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </motion.aside>}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-14 md:h-16 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-3 md:px-6">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              {/* Mobile Menu Button */}
              {isMobile && <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <div className="flex flex-col h-full">
                      <SidebarContent onTabClick={() => setMobileMenuOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>}

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs md:text-sm min-w-0">
                <span className="text-muted-foreground hidden sm:inline">SuperAdmin</span>
                <span className="text-muted-foreground hidden sm:inline">/</span>
                <span className="font-medium capitalize truncate">{tabs.find(t => t.id === activeTab)?.label}</span>
              </div>
              
              {/* Global Search - Hidden on mobile */}
              <div className="relative max-w-md flex-1 ml-2 md:ml-8 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} className="pl-10 h-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary text-sm" />
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              {/* Notifications */}
              

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                {isDark ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>

              {/* Back to App */}
              <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-1.5 h-9 px-2 md:px-3 text-xs md:text-sm">
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-3 md:p-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -10
            }} transition={{
              duration: 0.2
            }} className="h-full">
                {activeTab === "dashboard" && <SuperAdminDashboard />}
                {activeTab === "tenants" && <TenantsManager />}
                {activeTab === "users" && <UsersManager />}
                {activeTab === "plans" && <SubscriptionPlansManager />}
                {activeTab === "analytics" && <PlatformAnalytics />}
                {activeTab === "favorites" && <FavoritesManager />}
                {activeTab === "activity" && <ActivityCenter />}
                {activeTab === "content" && <ContentManager />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>;
};
export default SuperAdmin;