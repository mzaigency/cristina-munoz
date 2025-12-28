import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { InstallPWA } from "@/components/InstallPWA";
import { Loader2 } from "lucide-react";
import { TenantServicesSection } from "@/components/tenant/TenantServicesSection";
import { TenantBookingFlow } from "@/components/tenant/TenantBookingFlow";

// Lazy load below-the-fold components
const GallerySection = lazy(() => import("@/components/GallerySection").then(m => ({ default: m.GallerySection })));
const ReviewsSection = lazy(() => import("@/components/ReviewsSection").then(m => ({ default: m.ReviewsSection })));
const WhatsAppSection = lazy(() => import("@/components/WhatsAppSection").then(m => ({ default: m.WhatsAppSection })));
const LocationSection = lazy(() => import("@/components/LocationSection").then(m => ({ default: m.LocationSection })));

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

const SectionSkeleton = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div 
      className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
      style={{
        animation: 'spin 1s linear infinite',
        willChange: 'transform'
      }}
    />
  </div>
);

const TenantLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug]);

  const fetchTenantData = async () => {
    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (tenantError || !tenantData) {
        console.error("Tenant not found:", tenantError);
        navigate("/404");
        return;
      }

      setTenant(tenantData);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      navigate("/404");
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleBookNow = () => {
    scrollToSection("reserva");
  };

  const handleViewServices = () => {
    scrollToSection("servicios");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title={`${tenant.name} - Peluquería en ${tenant.city || 'Santpedor'} | Reserva Online`}
        description={`Peluquería profesional en ${tenant.city || 'Santpedor'}. Especialistas en corte, coloración, mechas, balayage, peinados y tratamientos capilares. Reserva tu cita online.`}
        keywords={`peluquería ${tenant.city}, ${tenant.name}, corte de pelo, coloración, reserva online peluquería`}
        canonicalUrl={`/salon/${tenant.slug}`}
      />
      <Header onNavigate={scrollToSection} activeSection={activeSection} />

      <main>
        <div id="inicio">
          <HeroSection 
            onBookNow={handleBookNow} 
            onViewServices={handleViewServices}
            businessName={tenant.name}
            tagline={`Tu peluquería de confianza en ${tenant.city || 'tu ciudad'}. Donde la belleza y el estilo se encuentran.`}
          />
        </div>

        <Suspense fallback={<SectionSkeleton />}>
          <div id="servicios">
            <TenantServicesSection tenantId={tenant.id} tenantName={tenant.name} />
          </div>

          <div id="reserva">
            <TenantBookingFlow tenantId={tenant.id} tenantName={tenant.name} />
          </div>

          <WhatsAppSection />

          <div id="galeria">
            <GallerySection />
          </div>

          <div id="resenas">
            <ReviewsSection />
          </div>

          <LocationSection />
        </Suspense>

        <div id="contacto">
          <Footer />
        </div>
      </main>

      <InstallPWA />
    </div>
  );
};

export default TenantLanding;
