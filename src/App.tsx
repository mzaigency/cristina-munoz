import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";

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
const Subscription = lazy(() => import("./pages/Subscription"));
const ForBusiness = lazy(() => import("./pages/ForBusiness"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <NavigationProvider>
            <Toaster />
            <Sonner />
            <UpdatePrompt />
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/:slug" element={<TenantAdmin />} />
                  <Route path="/superadmin" element={<SuperAdmin />} />
                  <Route path="/mis-citas" element={<MyBookings />} />
                  <Route path="/perfil" element={<Profile />} />
                  <Route path="/valoracion" element={<Review />} />
                  <Route path="/mensajes" element={<Messages />} />
                  <Route path="/salon/:slug" element={<TenantLanding />} />
                  <Route path="/onboarding" element={<BusinessOnboarding />} />
                  <Route path="/onboarding/setup" element={<OnboardingSetup />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/para-negocios" element={<ForBusiness />} />
                  <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
                  <Route path="/nueva-contrasena" element={<ResetPassword />} />
                  <Route path="/privacidad" element={<PrivacyPolicy />} />
                  <Route path="/terminos" element={<TermsOfUse />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </NavigationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;