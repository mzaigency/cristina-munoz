import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { NavigationProvider } from "@/contexts/NavigationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import TenantAdmin from "./pages/TenantAdmin";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Review from "./pages/Review";
import TenantLanding from "./pages/TenantLanding";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import NotFound from "./pages/NotFound";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import OnboardingSetup from "./pages/OnboardingSetup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NavigationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/buscar" element={<Search />} />
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
            <Route path="/privacidad" element={<PrivacyPolicy />} />
            <Route path="/terminos" element={<TermsOfUse />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NavigationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;