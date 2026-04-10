import { lazy, Suspense, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { supabase } from "@/integrations/supabase/client";

// Lazy load non-critical UI components to reduce initial JS bundle
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then((m) => ({ default: m.TooltipProvider })));
const UpdatePrompt = lazy(() => import("@/components/pwa/UpdatePrompt").then((m) => ({ default: m.UpdatePrompt })));
const DeepLinkHandler = lazy(() =>
  import("@/components/DeepLinkHandler").then((m) => ({ default: m.DeepLinkHandler })),
);

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const TenantAdmin = lazy(() => import("./pages/TenantAdmin"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Profile = lazy(() => import("./pages/Profile"));
const Review = lazy(() => import("./pages/Review"));
const TenantLanding = lazy(() => import("./pages/TenantLanding"));
const Messages = lazy(() => import("./pages/Messages"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BusinessOnboarding = lazy(() => import("./pages/BusinessOnboarding"));
const OnboardingSetup = lazy(() => import("./pages/OnboardingSetup"));
const DirectoryLanding = lazy(() => import("./pages/DirectoryLanding"));

const ForBusiness = lazy(() => import("./pages/ForBusiness"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

// Maintenance gate wrapper
const MaintenanceGate = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<{ maintenance: boolean; superAdmin: boolean } | null>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data } = await supabase.from("app_config").select("value").eq("key", "maintenance_mode").maybeSingle();

        const isMaintenanceOn = data?.value === "true";

        if (!isMaintenanceOn) {
          if (!cancelled) setState({ maintenance: false, superAdmin: false });
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        let superAdmin = false;

        if (session?.user?.id) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "superadmin")
            .maybeSingle();
          superAdmin = !!roleData;
        }

        if (!cancelled) setState({ maintenance: true, superAdmin });
      } catch (e) {
        console.error("Maintenance check error:", e);
        if (!cancelled) setState({ maintenance: false, superAdmin: false });
      }
    };

    check();

    // Only re-check on meaningful auth events (not TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        check();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Still loading
  if (state === null) return <PageLoader />;

  // Maintenance OFF — render normally
  if (!state.maintenance) return <>{children}</>;

  // Maintenance ON + superadmin — render normally
  if (state.superAdmin) return <>{children}</>;

  // Maintenance ON + NOT superadmin — only allow /superadmin (for admin login)
  if (location.pathname === "/superadmin") {
    return <>{children}</>;
  }

  // Block everything else
  return <MaintenanceScreen />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <Suspense fallback={null}>
            <TooltipProvider>
              <NavigationProvider>
                <Suspense fallback={null}>
                  <Toaster />
                  <Sonner />
                  <UpdatePrompt />
                  <DeepLinkHandler />
                </Suspense>
                <BrowserRouter>
                  <ScrollToTop />
                  <MaintenanceGate>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Rutas fijas - tienen prioridad */}
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/:adminSlug" element={<TenantAdmin />} />
                        <Route path="/superadmin" element={<SuperAdmin />} />
                        <Route path="/mis-citas" element={<MyBookings />} />
                        <Route path="/perfil" element={<Profile />} />
                        <Route path="/perfil/notificaciones" element={<NotificationSettingsPage />} />
                        <Route path="/valoracion" element={<Review />} />
                        <Route path="/mensajes" element={<Messages />} />
                        <Route path="/onboarding" element={<BusinessOnboarding />} />
                        <Route path="/onboarding/setup" element={<OnboardingSetup />} />
                        <Route path="/negocios" element={<ForBusiness />} />
                        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
                        <Route path="/nueva-contrasena" element={<ResetPassword />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/privacidad" element={<PrivacyPolicy />} />
                        <Route path="/terminos" element={<TermsOfUse />} />

                        {/* SEO Directory routes - category and category/city */}
                        <Route path="/peluquerias" element={<DirectoryLanding />} />
                        <Route path="/peluquerias/:city" element={<DirectoryLanding />} />
                        <Route path="/barberias" element={<DirectoryLanding />} />
                        <Route path="/barberias/:city" element={<DirectoryLanding />} />
                        <Route path="/estetica" element={<DirectoryLanding />} />
                        <Route path="/estetica/:city" element={<DirectoryLanding />} />
                        <Route path="/spa" element={<DirectoryLanding />} />
                        <Route path="/spa/:city" element={<DirectoryLanding />} />
                        <Route path="/unas" element={<DirectoryLanding />} />
                        <Route path="/unas/:city" element={<DirectoryLanding />} />

                        {/* Catch-all para salones - DEBE IR AL FINAL */}
                        <Route path="/:slug" element={<TenantLanding />} />

                        {/* 404 para rutas que no coinciden */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </MaintenanceGate>
                </BrowserRouter>
              </NavigationProvider>
            </TooltipProvider>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
