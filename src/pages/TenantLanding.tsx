import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Preloader } from "@/components/ui/preloader";
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
import { TenantTrustStrip } from "@/components/tenant/TenantTrustStrip";
import { TenantBookBar } from "@/components/tenant/TenantBookBar";
import { TenantAdminBar } from "@/components/tenant/TenantAdminBar";
import { TenantEditPanel } from "@/components/tenant/TenantEditPanel";
import { useTenantAccess } from "@/hooks/useTenantAccess";
// Contact form merged into TenantLocationSection
import { TenantShopSection } from "@/components/tenant/TenantShopSection";
import { QrWelcomeBanner } from "@/components/tenant/QrWelcomeBanner";
import { PostVisitCard } from "@/components/tenant/PostVisitCard";
import { HeroImmersive, HeroMinimal, HeroSplit, HeroBold, HeroGlass } from "@/components/tenant/heroes";
import { getThemeById } from "@/components/onboarding/landing-themes";
import { TenantLocaleProvider } from "@/lib/tenantI18n";
import { trackEvent } from "@/lib/telemetry";

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
  country?: string | null;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  hero_images?: unknown;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  whatsapp_number: string | null;
  google_maps_url: string | null;
  font_heading?: string | null;
  font_body?: string | null;
  heading_size?: string | null;
  button_style?: string | null;
  average_price?: number | null;
  show_logo_on_landing?: boolean | null;
  theme_id?: string | null;
  language?: string | null;
  features?: {
    business_type?: string;
    business_type_label?: string;
    [key: string]: unknown;
  } | null;
}
// Mapas derivados del catálogo canónico (src/constants/businessTypes.ts)
import { BUSINESS_TYPES_BY_ID } from "@/constants/businessTypes";

const CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  Object.values(BUSINESS_TYPES_BY_ID).map((t) => [t.id, t.labelPlural]),
);
const CATEGORY_SLUG_MAP: Record<string, string> = Object.fromEntries(
  Object.values(BUSINESS_TYPES_BY_ID).map((t) => [t.id, t.urlSlug]),
);

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
  const [reviewStats, setReviewStats] = useState<{ avg: number; count: number } | null>(null);
  const [topReviews, setTopReviews] = useState<any[]>([]);
  const [tenantServices, setTenantServices] = useState<{ name: string; price: number | null }[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);

  const { isAdmin, isStylist, hasAccess } = useTenantAccess(tenant?.id);
  const previewToken = searchParams.get("preview");
  const reviewParam = searchParams.get("review");
  const editParam = searchParams.get("edit");
  const isQrScan = searchParams.get("src") === "qr";

  // Auto-open visual editor when navigating with ?edit=1 (e.g. from Settings shortcut)
  useEffect(() => {
    if (editParam === "1" && isAdmin && !isEditMode) {
      setIsEditMode(true);
    }
  }, [editParam, isAdmin, isEditMode]);

  // Track QR scans (once per session per tenant)
  useEffect(() => {
    if (!isQrScan || !tenant?.id) return;
    const key = `glowapp_qr_tracked_${tenant.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void trackEvent({
      event_type: "qr_scan",
      section_id: "qr_scan",
      tenant_id: tenant.id,
      metadata: {
        utm_source: searchParams.get("utm_source"),
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
        referrer: document.referrer || null,
      },
    });
  }, [isQrScan, tenant?.id, searchParams]);


  const handleReviewSubmitted = useCallback(() => {
    // Refresh reviews section
    setReviewsKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug, previewToken]);

  // Auto-scroll to review form when ?review=true
  useEffect(() => {
    if (reviewParam !== "true" || loading || !tenant) return;

    // TenantReviewForm renders `null` while it checks auth, so we retry until the element exists.
    let rafId = 0;
    const startedAt = Date.now();
    const maxWaitMs = 10000;

    const tryScroll = () => {
      const el = document.getElementById("review-form");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({ top, behavior: "smooth" });
        return;
      }

      if (Date.now() - startedAt > maxWaitMs) return;
      rafId = window.requestAnimationFrame(tryScroll);
    };

    rafId = window.requestAnimationFrame(tryScroll);
    return () => window.cancelAnimationFrame(rafId);
  }, [reviewParam, loading, tenant]);

  const fetchTenantData = async () => {
    try {
      // Use security-safe RPC function that only exposes public fields
      const { data: tenantData, error: tenantError } = await supabase
        .rpc("get_public_tenant_by_slug", { _slug: slug });

      if (tenantError) {
        console.error("Tenant not found:", tenantError);
        navigate("/404");
        return;
      }

      // RPC returns an array, get first item
      const tenant = Array.isArray(tenantData) ? tenantData[0] : tenantData;

      if (!tenant) {
        console.error("Tenant not found");
        navigate("/404");
        return;
      }

      // Check if this is a preview (for admin bar purposes)
      if (previewToken) {
        setIsPreview(true);
      }

      setTenant(tenant as Tenant);

      // Fetch real review stats for structured data
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, comment, created_at, user_id")
        .eq("tenant_id", tenant.id)
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setReviewStats({ avg: Math.round(avg * 10) / 10, count: reviews.length });
        // Store top 3 reviews for schema
        setTopReviews(reviews.slice(0, 3));
      }

      // Fetch services for structured data
      const { data: servicesData } = await supabase
        .from("services")
        .select("name, price")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true })
        .limit(20);

      if (servicesData) setTenantServices(servicesData);

      // Fetch business hours for structured data
      const { data: hoursData } = await supabase
        .from("tenant_business_hours")
        .select("day_of_week, is_open, open_time, close_time")
        .eq("tenant_id", tenant.id)
        .order("day_of_week", { ascending: true });

      if (hoursData) setBusinessHours(hoursData);
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
    setActiveSection("reserva");
    // Abre y despliega el flujo de reserva (hace su propio scroll automático)
    window.dispatchEvent(new CustomEvent("glow:open-booking"));
  };

  if (loading) {
    return <Preloader ready={false} />;
  }

  if (!tenant) {
    return null;
  }

  // Get business type for SEO (desde catálogo canónico)
  const businessTypeId = (tenant.features as { business_type?: string } | null)?.business_type;
  const businessTypeLabel = (tenant.features as { business_type_label?: string } | null)?.business_type_label;
  const btMeta = businessTypeId ? BUSINESS_TYPES_BY_ID[businessTypeId as keyof typeof BUSINESS_TYPES_BY_ID] : null;

  const businessLabel = btMeta?.label || businessTypeLabel || "Salón de belleza";
  const typeKeywords = btMeta?.seoKeywords || "";

  const seoTitle = `${tenant.name} | ${businessLabel}${tenant.city ? ` en ${tenant.city}` : ''} - Reserva Online`;

  const seoDescription = tenant.description ||
    `${businessLabel} profesional${tenant.city ? ` en ${tenant.city}` : ''}. ${
      btMeta?.tenantTagline ?? 'Especialistas en corte, coloración, mechas, balayage, peinados y tratamientos capilares.'
    } Reserva tu cita online.`;
  
  const seoKeywords = [
    businessLabel.toLowerCase(),
    tenant.city?.toLowerCase(),
    tenant.name,
    typeKeywords,
    "reserva online",
    "cita previa",
    tenant.city ? `${businessLabel.toLowerCase()} ${tenant.city}` : null,
    tenant.city ? `reservar ${businessLabel.toLowerCase()} ${tenant.city}` : null,
  ].filter(Boolean).join(", ");

  // Build opening hours specification for schema
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const openingHoursSpec = businessHours
    .filter((h: any) => h.is_open && h.open_time && h.close_time)
    .map((h: any) => `${dayNames[h.day_of_week]} ${h.open_time}-${h.close_time}`);

  // Build LocalBusiness structured data — enriched
  const localBusinessData = {
    name: tenant.name,
    description: tenant.description || `${businessLabel} profesional`,
    image: tenant.hero_image_url || tenant.logo_url || undefined,
    ...(tenant.address || tenant.city ? {
      address: {
        street: tenant.address || undefined,
        city: tenant.city || undefined,
        postalCode: tenant.postal_code || undefined,
        country: tenant.country || "ES",
      }
    } : {}),
    ...(tenant.phone ? { telephone: tenant.phone } : {}),
    ...(tenant.average_price ? { 
      priceRange: tenant.average_price <= 20 ? "€" : tenant.average_price <= 50 ? "€€" : "€€€" 
    } : {}),
    ...(reviewStats ? {
      aggregateRating: {
        ratingValue: reviewStats.avg,
        reviewCount: reviewStats.count,
      }
    } : {}),
    ...(openingHoursSpec.length > 0 ? { openingHours: openingHoursSpec } : {}),
  };

  const primaryColor = tenant.primary_color || "#8B5CF6";

  return (
    <TenantLocaleProvider lang={tenant.language}>
    <TenantThemeProvider
      primaryColor={primaryColor}
      secondaryColor={tenant.secondary_color || "#D946EF"}
      fontHeading={tenant.font_heading}
      fontBody={tenant.font_body}
      headingSize={tenant.heading_size}
      buttonStyle={tenant.button_style}
    >
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Preloader
          ready
          text={tenant.name}
          logoUrl={tenant.logo_url}
          accentColor={tenant.primary_color}
        />

        {/* Safe area spacer for top notch */}
        <div 
          className="fixed top-0 left-0 right-0 bg-background z-[99]" 
          style={{ height: 'env(safe-area-inset-top)' }} 
        />
        
        {/* Preview Banner */}
        {isPreview && (
          <div 
            className="fixed left-0 right-0 z-[100] bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-medium"
            style={{ top: 'env(safe-area-inset-top)' }}
          >
            Vista previa - Esta página no está publicada
            <meta name="robots" content="noindex, nofollow" />
          </div>
        )}

        <SEO
          title={seoTitle}
          description={seoDescription}
          keywords={seoKeywords}
          canonicalUrl={`/${tenant.slug}`}
          ogImage={tenant.hero_image_url || undefined}
          localBusiness={localBusinessData}
          breadcrumbs={[
            { name: "Inicio", url: "/" },
            ...(businessTypeId && CATEGORY_MAP[businessTypeId]
              ? [{ name: CATEGORY_MAP[businessTypeId], url: `/${CATEGORY_SLUG_MAP[businessTypeId] || businessTypeId}` }]
              : [{ name: businessLabel, url: "/" }]),
            { name: tenant.name, url: `/${tenant.slug}` }
          ]}
          noindex={isPreview}
        />

        {/* Enhanced structured data: services catalog + individual reviews + sameAs */}
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BeautySalon",
              "name": tenant.name,
              "url": `https://www.glowapp.app/${tenant.slug}`,
              ...(tenantServices.length > 0 ? {
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Servicios",
                  "itemListElement": tenantServices.map(s => ({
                    "@type": "Offer",
                    "itemOffered": { "@type": "Service", "name": s.name },
                    ...(s.price != null ? { "price": s.price, "priceCurrency": "EUR" } : {})
                  }))
                }
              } : {}),
              ...(topReviews.length > 0 ? {
                "review": topReviews.map(r => ({
                  "@type": "Review",
                  "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 5 },
                  ...(r.comment ? { "reviewBody": r.comment } : {}),
                  "datePublished": r.created_at?.split("T")[0],
                  "author": { "@type": "Person", "name": "Cliente verificado" }
                }))
              } : {}),
              ...(tenant.google_maps_url ? { "hasMap": tenant.google_maps_url } : {}),
              "sameAs": [tenant.instagram_url, tenant.facebook_url, tenant.tiktok_url].filter(Boolean),
            })}
          </script>
        </Helmet>
        


        <TenantHeader 
          tenant={tenant} 
          onNavigate={scrollToSection} 
          activeSection={activeSection} 
        />

        <main className={isPreview ? "pt-10" : ""}>
          {/* Hero Section - Dynamic based on theme */}
          <div id="inicio">
            {(() => {
              const theme = getThemeById(tenant.theme_id || "immersive");
              const heroProps = { tenant, onBookNow: handleBookNow };
              
              switch (theme.heroLayout) {
                case "minimal":
                  return <HeroMinimal {...heroProps} />;
                case "split":
                  return <HeroSplit {...heroProps} />;
                case "bold":
                  return <HeroBold {...heroProps} />;
                case "glass":
                  return <HeroGlass {...heroProps} />;
                case "fullscreen":
                default:
                  return <HeroImmersive {...heroProps} />;
              }
            })()}
          </div>

          {/* Franja de confianza — bajo el hero */}
          <TenantTrustStrip tenantId={tenant.id} city={tenant.city} />

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

          {/* Shop Section - productos */}
          <TenantShopSection tenantId={tenant.id} tenantSlug={tenant.slug} />

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
            tenantId={tenant.id}
            tenantName={tenant.name}
            address={tenant.address}
            city={tenant.city}
            postalCode={tenant.postal_code}
            phone={tenant.phone}
            email={tenant.email}
            instagramUrl={tenant.instagram_url}
            facebookUrl={tenant.facebook_url}
            tiktokUrl={tenant.tiktok_url}
            googleMapsUrl={tenant.google_maps_url}
            primaryColor={primaryColor}
          />

          {/* Footer - Tenant specific */}
          <TenantFooter tenant={tenant} />
        </main>

        {/* Barra de reserva fija (móvil, solo visitantes) */}
        {!hasAccess && <TenantBookBar onBookNow={handleBookNow} />}

        {/* Banner de bienvenida cuando el visitante llega escaneando un QR */}
        {isQrScan && !hasAccess && <QrWelcomeBanner tenantName={tenant.name} />}

        {/* Tarjeta post-visita (cita reciente < 6h) */}
        {!hasAccess && <PostVisitCard tenantId={tenant.id} tenantSlug={tenant.slug} />}


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
    </TenantLocaleProvider>
  );
};

export default TenantLanding;