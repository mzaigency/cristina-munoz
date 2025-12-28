import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InstallPWA } from "@/components/InstallPWA";
import { Loader2 } from "lucide-react";
import { TenantServicesSection } from "@/components/tenant/TenantServicesSection";
import { TenantBookingFlow } from "@/components/tenant/TenantBookingFlow";
import { TenantHero } from "@/components/tenant/TenantHero";
import { TenantHeader } from "@/components/tenant/TenantHeader";

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
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  is_active: boolean | null;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("inicio");
  const [isPreview, setIsPreview] = useState(false);

  const previewToken = searchParams.get("preview");

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug, previewToken]);

  const fetchTenantData = async () => {
    try {
      let query = supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug);

      // If preview token exists, allow inactive tenants
      if (previewToken) {
        query = query.or(`is_active.eq.true,preview_token.eq.${previewToken}`);
        setIsPreview(true);
      } else {
        query = query.eq("is_active", true);
      }

      const { data: tenantData, error: tenantError } = await query.maybeSingle();

      if (tenantError || !tenantData) {
        console.error("Tenant not found:", tenantError);
        navigate("/404");
        return;
      }

      // Validate preview token if provided
      if (previewToken && tenantData.preview_token !== previewToken && !tenantData.is_active) {
        console.error("Invalid preview token");
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

  // Dynamic SEO based on tenant data
  const seoTitle = `${tenant.name} - Peluquería en ${tenant.city || 'tu ciudad'} | Reserva Online`;
  const seoDescription = tenant.description || 
    `Peluquería profesional${tenant.city ? ` en ${tenant.city}` : ''}. Especialistas en corte, coloración, mechas, balayage, peinados y tratamientos capilares. Reserva tu cita online.`;
  const seoKeywords = `peluquería${tenant.city ? ` ${tenant.city}` : ''}, ${tenant.name}, corte de pelo, coloración, reserva online peluquería`;

  // Build dynamic tagline
  const dynamicTagline = tenant.tagline || 
    `Tu peluquería de confianza${tenant.city ? ` en ${tenant.city}` : ''}. Donde la belleza y el estilo se encuentran.`;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Preview Banner */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-medium">
          Vista previa - Esta página no está publicada
          <meta name="robots" content="noindex, nofollow" />
        </div>
      )}

      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={`/salon/${tenant.slug}`}
      />
      
      {/* Use tenant-specific header if has custom branding */}
      {tenant.logo_url || tenant.primary_color ? (
        <TenantHeader 
          tenant={tenant} 
          onNavigate={scrollToSection} 
          activeSection={activeSection} 
        />
      ) : (
        <Header onNavigate={scrollToSection} activeSection={activeSection} />
      )}

      <main className={isPreview ? "pt-10" : ""}>
        <div id="inicio">
          {/* Use tenant hero if has custom branding, otherwise use default */}
          {tenant.hero_image_url || tenant.tagline ? (
            <TenantHero 
              tenant={tenant}
              onBookNow={handleBookNow}
            />
          ) : (
            <section 
              className="relative min-h-[80vh] flex items-center justify-center pt-16"
              style={{
                background: tenant.hero_image_url 
                  ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${tenant.hero_image_url}) center/cover`
                  : `linear-gradient(135deg, ${tenant.primary_color || '#8B5CF6'}15 0%, ${tenant.secondary_color || '#EC4899'}15 100%)`
              }}
            >
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  {tenant.name}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  {dynamicTagline}
                </p>
                <button
                  onClick={handleBookNow}
                  className="px-8 py-4 text-lg font-semibold text-white rounded-full transition-transform hover:scale-105"
                  style={{ backgroundColor: tenant.primary_color || '#8B5CF6' }}
                >
                  Reservar Cita
                </button>
              </div>
            </section>
          )}
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
