import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import TenantAdmin from "./pages/TenantAdmin";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Review from "./pages/Review";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import TenantLanding from "./pages/TenantLanding";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Navigate to="/salon/cristina-munoz" replace />} />
          <Route path="/sobre-nosotras" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/:slug" element={<TenantAdmin />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="/mis-citas" element={<MyBookings />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/valoracion" element={<Review />} />
          <Route path="/politica-privacidad" element={<PrivacyPolicy />} />
          <Route path="/terminos-uso" element={<TermsOfService />} />
          <Route path="/mensajes" element={<Messages />} />
          <Route path="/salon/:slug" element={<TenantLanding />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
