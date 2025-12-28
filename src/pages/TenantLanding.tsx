import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { InstallPWA } from "@/components/InstallPWA";
import { Loader2 } from "lucide-react";
import { TenantServicesSection } from "@/components/tenant/TenantServicesSection";
import { TenantBookingFlow } from "@/components/tenant/TenantBookingFlow";
import { TenantHero } from "@/components/tenant/TenantHero";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { TenantFooter } from "@/components/tenant/TenantFooter";
import { TenantReviewsSection } from "@/components/tenant/TenantReviewsSection";
import { TenantGallerySection } from "@/components/tenant/TenantGallerySection";
import { TenantWhatsAppSection } from "@/components/tenant/TenantWhatsAppSection";
import { TenantLocationSection } from "@/components/tenant/TenantLocationSection";
import { TenantThemeProvider } from "@/components/tenant/TenantThemeProvider";
import { TenantAdminBar } from "@/components/tenant/TenantAdminBar";
import { TenantEditPanel } from "@/components/tenant/TenantEditPanel";
import { useTenantAccess } from "@/hooks/useTenantAccess";

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
  instagram_url: string | null;
  facebook_url: string | null;
  whatsapp_number: string | null;
  google_maps_url: string | null;
  font_heading?: string | null;
  font_body?: string | null;
  heading_size?: string | null;
  button_style?: string | null;
}

const TenantLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("inicio");
  const [isPreview, setIsPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { isAdmin, isStylist, hasAccess } = useTenantAccess(tenant?.id);
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

      setTenant(tenantData as Tenant);
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

  const primaryColor = tenant.primary_color || "#8B5CF6";

  return (
    <TenantThemeProvider 
      primaryColor={primaryColor} 
      secondaryColor={tenant.secondary_color || "#D946EF"}
      fontHeading={tenant.font_heading}
      fontBody={tenant.font_body}
      headingSize={tenant.heading_size}
      buttonStyle={tenant.button_style}
    >
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
        
        <TenantHeader 
          tenant={tenant} 
          onNavigate={scrollToSection} 
          activeSection={activeSection} 
        />

        <main className={isPreview ? "pt-10" : ""}>
          {/* Hero Section */}
          <div id="inicio">
            <TenantHero 
              tenant={tenant}
              onBookNow={handleBookNow}
            />
          </div>

          {/* Services Section - Tenant specific */}
          <div id="servicios">
            <TenantServicesSection 
              tenantId={tenant.id} 
              tenantName={tenant.name} 
            />
          </div>

          {/* Booking Section */}
          <div id="reserva">
            <TenantBookingFlow 
              tenantId={tenant.id} 
              tenantName={tenant.name} 
            />
          </div>

          {/* WhatsApp CTA - Tenant specific */}
          <TenantWhatsAppSection
            tenantName={tenant.name}
            whatsappNumber={tenant.whatsapp_number}
            phone={tenant.phone}
            primaryColor={primaryColor}
          />

          {/* Gallery Section - Tenant specific */}
          <div id="galeria">
            <TenantGallerySection
              tenantId={tenant.id}
              tenantName={tenant.name}
              primaryColor={primaryColor}
            />
          </div>

          {/* Reviews Section - Tenant specific */}
          <div id="resenas">
            <TenantReviewsSection
              tenantId={tenant.id}
              tenantName={tenant.name}
              primaryColor={primaryColor}
            />
          </div>

          {/* Location Section - Tenant specific */}
          <TenantLocationSection
            tenantName={tenant.name}
            address={tenant.address}
            city={tenant.city}
            postalCode={tenant.postal_code}
            phone={tenant.phone}
            email={tenant.email}
            instagramUrl={tenant.instagram_url}
            facebookUrl={tenant.facebook_url}
            googleMapsUrl={tenant.google_maps_url}
            primaryColor={primaryColor}
          />

          {/* Footer - Tenant specific */}
          <div id="contacto">
            <TenantFooter tenant={tenant} />
          </div>
        </main>

        <InstallPWA />

        {/* Admin Bar - Visible for admins and stylists */}
        {hasAccess && (
          <TenantAdminBar
            tenantSlug={tenant.slug}
            isAdmin={isAdmin}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
          />
        )}

        {/* Edit Panel - Only for admins in edit mode */}
        {isAdmin && isEditMode && (
          <TenantEditPanel
            tenant={tenant}
            onClose={() => setIsEditMode(false)}
            onSave={(updatedTenant) => setTenant(updatedTenant)}
          />
        )}
      </div>
    </TenantThemeProvider>
  );
};

export default TenantLanding;