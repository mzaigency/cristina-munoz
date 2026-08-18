import { lazy, Suspense, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ShopCartProvider } from "@/contexts/ShopCartContext";

import ErrorBoundary from "@/components/ErrorBoundary";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { supabase } from "@/integrations/supabase/client";
import { Preloader } from "@/components/ui/preloader";
import glowappLogo from "@/assets/glowapp-logo.png";

// Lazy load non-critical UI components to reduce initial JS bundle
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then((m) => ({ default: m.TooltipProvider })));
const UpdatePrompt = lazy(() => import("@/components/pwa/UpdatePrompt").then((m) => ({ default: m.UpdatePrompt })));
const DeepLinkHandler = lazy(() =>
  import("@/components/DeepLinkHandler").then((m) => ({ default: m.DeepLinkHandler })),
);

const isModuleLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /importing a module script failed|failed to fetch dynamically imported module|loading chunk/i.test(message);
};

const lazyWithReload = (factory: () => Promise<any>) =>
  lazy(() =>
    factory().catch((error) => {
      if (isModuleLoadError(error)) {
        const reloadKey = "glowapp_chunk_reload_attempted";
        if (sessionStorage.getItem(reloadKey) !== "1") {
          sessionStorage.setItem(reloadKey, "1");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }),
  );

// Lazy loaded pages
const Index = lazyWithReload(() => import("./pages/Index"));
const Auth = lazyWithReload(() => import("./pages/Auth"));
const Admin = lazyWithReload(() => import("./pages/Admin"));
const SuperAdmin = lazyWithReload(() => import("./pages/SuperAdmin"));
const TenantAdmin = lazyWithReload(() => import("./pages/TenantAdmin"));
const MyBookings = lazyWithReload(() => import("./pages/MyBookings"));
const Profile = lazyWithReload(() => import("./pages/Profile"));
const Review = lazyWithReload(() => import("./pages/Review"));
const ReviewToken = lazyWithReload(() => import("./pages/ReviewToken"));
const TenantLanding = lazyWithReload(() => import("./pages/TenantLanding"));
const Messages = lazyWithReload(() => import("./pages/Messages"));
const PrivacyPolicy = lazyWithReload(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazyWithReload(() => import("./pages/TermsOfUse"));
const NotFound = lazyWithReload(() => import("./pages/NotFound"));
const BusinessOnboarding = lazyWithReload(() => import("./pages/BusinessOnboarding"));
const OnboardingSetup = lazyWithReload(() => import("./pages/OnboardingSetup"));
const DirectoryLanding = lazyWithReload(() => import("./pages/DirectoryLanding"));

const ForBusiness = lazyWithReload(() => import("./pages/ForBusiness"));
const ForgotPassword = lazyWithReload(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithReload(() => import("./pages/ResetPassword"));
const VerifyEmail = lazyWithReload(() => import("./pages/VerifyEmail"));
const Unsubscribe = lazyWithReload(() => import("./pages/Unsubscribe"));
const NotificationSettingsPage = lazyWithReload(() => import("./pages/NotificationSettings"));
const CompetitorAlternative = lazyWithReload(() => import("./pages/CompetitorAlternative"));
const Blog = lazyWithReload(() => import("./pages/Blog"));
const BlogPost = lazyWithReload(() => import("./pages/BlogPost"));

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

// Intro de marca al abrir la app (PWA o web). Solo en rutas del shell de
// consumidor: las landings de tenant/negocios y el admin ya tienen su propia
// cortina y se doblarían. App se monta una vez por carga de página, así que
// la intro no se repite al navegar entre rutas.
const APP_INTRO_PATHS = new Set(["/", "/index", "/mis-citas", "/perfil", "/mensajes"]);

const AppIntro = () => {
  const [show] = useState(
    () => typeof window !== "undefined" && APP_INTRO_PATHS.has(window.location.pathname),
  );
  if (!show) return null;
  // minDuration cubre la carga del chunk lazy inicial para que al levantarse
  // la cortina no asome el spinner de Suspense.
  return <Preloader logoUrl={glowappLogo} logoVariant="bare" minDuration={500} />;
};

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
      <>
        <AppIntro />
        <AuthProvider>
          <ShopCartProvider>
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
                        <Route path="/index" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/:adminSlug" element={<TenantAdmin />} />
                        <Route path="/admin/:adminSlug/:section" element={<TenantAdmin />} />
                        <Route path="/admin/:adminSlug/:section/:subTab" element={<TenantAdmin />} />
                        <Route path="/superadmin" element={<SuperAdmin />} />
                        <Route path="/mis-citas" element={<MyBookings />} />
                        <Route path="/perfil" element={<Profile />} />
                        <Route path="/perfil/notificaciones" element={<NotificationSettingsPage />} />
                        <Route path="/valoracion" element={<Review />} />
                        <Route path="/valorar/:token" element={<ReviewToken />} />
                        <Route path="/mensajes" element={<Messages />} />
                        <Route path="/onboarding" element={<BusinessOnboarding />} />
                        <Route path="/onboarding/setup" element={<OnboardingSetup />} />
                        <Route path="/negocios" element={<ForBusiness />} />
                        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
                        <Route path="/nueva-contrasena" element={<ResetPassword />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/privacidad" element={<PrivacyPolicy />} />
                        <Route path="/terminos" element={<TermsOfUse />} />
                        <Route path="/unsubscribe" element={<Unsubscribe />} />

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
                        <Route path="/salones-belleza" element={<DirectoryLanding />} />
                        <Route path="/salones-belleza/:city" element={<DirectoryLanding />} />
                        <Route path="/fisioterapia" element={<DirectoryLanding />} />
                        <Route path="/fisioterapia/:city" element={<DirectoryLanding />} />

                        {/* SEO conversion pages */}
                        <Route path="/alternativa-a-booksy" element={<CompetitorAlternative />} />
                        <Route path="/alternativa-a-treatwell" element={<CompetitorAlternative />} />
                        <Route path="/alternativa-a-fresha" element={<CompetitorAlternative />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />

                        <Route path="/404" element={<NotFound />} />

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
          </ShopCartProvider>
        </AuthProvider>
      </>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
