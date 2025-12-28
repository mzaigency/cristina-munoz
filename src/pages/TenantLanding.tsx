import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { TenantServicesSection } from "@/components/tenant/TenantServicesSection";
import { TenantBookingFlow } from "@/components/tenant/TenantBookingFlow";
import { TenantHero } from "@/components/tenant/TenantHero";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { TenantFooter } from "@/components/tenant/TenantFooter";
import { TenantReviewsSection } from "@/components/tenant/TenantReviewsSection";
import { TenantReviewForm } from "@/components/tenant/TenantReviewForm";
import { TenantGallerySection } from "@/components/tenant/TenantGallerySection";
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
  features?: {
    business_type?: string;
    business_type_label?: string;
    [key: string]: unknown;
  } | null;
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
  const [reviewsKey, setReviewsKey] = useState(0);

  const { isAdmin, isStylist, hasAccess } = useTenantAccess(tenant?.id);
  const previewToken = searchParams.get("preview");

  const handleReviewSubmitted = useCallback(() => {
    // Refresh reviews section
    setReviewsKey(prev => prev + 1);
  }, []);

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

  // Get business type for SEO
  const businessTypeLabel = (tenant.features as { business_type_label?: string } | null)?.business_type_label;
  const businessType = (tenant.features as { business_type?: string } | null)?.business_type;
  
  // SEO keyword mappings by business type
  const seoKeywordsByType: Record<string, string> = {
    peluqueria: "corte de pelo, coloración, mechas, balayage, peinados, tratamientos capilares",
    barberia: "corte de pelo hombre, afeitado clásico, arreglo de barba, degradado, fade",
    salon_belleza: "maquillaje, tratamientos faciales, depilación, manicura, pedicura, belleza integral",
    estetica: "tratamientos faciales, limpieza facial, rejuvenecimiento, tratamientos corporales, radiofrecuencia",
    spa: "masajes relajantes, tratamientos wellness, aromaterapia, circuito spa, relajación",
    unas: "manicura, pedicura, uñas acrílicas, uñas de gel, nail art, esmaltado permanente",
    multiservicios: "peluquería, estética, belleza integral, tratamientos, cuidado personal",
  };

  // Dynamic SEO based on tenant data and business type
  const businessLabel = businessTypeLabel || "Salón de belleza";
  const typeKeywords = businessType ? seoKeywordsByType[businessType] || "" : "";
  
  const seoTitle = `${tenant.name} - ${businessLabel}${tenant.city ? ` en ${tenant.city}` : ''} | Reserva Online`;
  
  const seoDescription = tenant.description || 
    `${businessLabel} profesional${tenant.city ? ` en ${tenant.city}` : ''}. ${
      businessType === 'barberia' ? 'Especialistas en cortes masculinos, afeitado clásico y cuidado de barba.' :
      businessType === 'estetica' ? 'Expertos en tratamientos faciales, corporales y rejuvenecimiento.' :
      businessType === 'spa' ? 'Centro de bienestar con masajes, tratamientos relajantes y circuito spa.' :
      businessType === 'unas' ? 'Especialistas en manicura, pedicura, uñas de gel y nail art.' :
      businessType === 'salon_belleza' ? 'Servicios integrales de belleza: maquillaje, tratamientos y más.' :
      'Especialistas en corte, coloración, mechas, balayage, peinados y tratamientos capilares.'
    } Reserva tu cita online.`;
  
  const seoKeywords = [
    businessLabel.toLowerCase(),
    tenant.city?.toLowerCase(),
    tenant.name,
    typeKeywords,
    "reserva online",
    tenant.city ? `${businessLabel.toLowerCase()} ${tenant.city}` : null,
  ].filter(Boolean).join(", ");

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
              key={reviewsKey}
              tenantId={tenant.id}
              tenantName={tenant.name}
              primaryColor={primaryColor}
            />
          </div>

          {/* Review Form - For logged in users */}
          <TenantReviewForm
            tenantId={tenant.id}
            tenantName={tenant.name}
            onReviewSubmitted={handleReviewSubmitted}
          />
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