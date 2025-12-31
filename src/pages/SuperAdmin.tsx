import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Building2, Users, BarChart3, Shield, 
  LayoutDashboard, Heart, Activity, FileImage, Search, Bell,
  Moon, Sun, ChevronLeft, Menu, CreditCard
} from "lucide-react";
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
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const SuperAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkSuperAdminAccess();
    // Check theme
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "superadmin")
        .maybeSingle();

      if (roleError) {
        console.error("Error checking role:", roleError);
        toast({
          title: "Error",
          description: "No se pudo verificar tu acceso",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!roleData) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de SuperAdmin",
          variant: "destructive",
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

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tenants", label: "Tenants", icon: Building2 },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "plans", label: "Planes", icon: CreditCard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "favorites", label: "Favoritos", icon: Heart },
    { id: "activity", label: "Actividad", icon: Activity },
    { id: "content", label: "Contenido", icon: FileImage },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 72 : 240 }}
          className={cn(
            "flex-shrink-0 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col",
            "transition-all duration-300"
          )}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <h1 className="font-bold text-lg">SuperAdmin</h1>
                    <p className="text-xs text-muted-foreground">Panel de control</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full justify-center"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-6">
            <div className="flex items-center gap-4 flex-1">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">SuperAdmin</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium capitalize">{tabs.find(t => t.id === activeTab)?.label}</span>
              </div>
              
              {/* Global Search */}
              <div className="relative max-w-md flex-1 ml-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en todo el panel..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                  3
                </Badge>
              </Button>

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Back to App */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
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
    </div>
  );
};

export default SuperAdmin;
