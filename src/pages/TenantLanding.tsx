import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";

// Lazy load components
const TenantHeader = lazy(() => import("@/components/tenant/TenantHeader").then(m => ({ default: m.TenantHeader })));
const TenantHero = lazy(() => import("@/components/tenant/TenantHero").then(m => ({ default: m.TenantHero })));
const TenantServices = lazy(() => import("@/components/tenant/TenantServices").then(m => ({ default: m.TenantServices })));
const TenantBooking = lazy(() => import("@/components/tenant/TenantBooking").then(m => ({ default: m.TenantBooking })));
const TenantReviews = lazy(() => import("@/components/tenant/TenantReviews").then(m => ({ default: m.TenantReviews })));
const TenantFooter = lazy(() => import("@/components/tenant/TenantFooter").then(m => ({ default: m.TenantFooter })));

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

interface Stylist {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  color: string | null;
}

const SectionSkeleton = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div 
      className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
      style={{ animation: 'spin 1s linear infinite' }}
    />
  </div>
);

const TenantLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug]);

  const fetchTenantData = async () => {
    try {
      // Fetch tenant by slug
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

      // Apply tenant colors as CSS variables
      if (tenantData.primary_color) {
        document.documentElement.style.setProperty('--tenant-primary', tenantData.primary_color);
      }
      if (tenantData.secondary_color) {
        document.documentElement.style.setProperty('--tenant-secondary', tenantData.secondary_color);
      }

      // Fetch stylists for this tenant
      const { data: stylistsData } = await supabase
        .from("tenant_stylists")
        .select("id, name, slug, avatar_url, color")
        .eq("tenant_id", tenantData.id)
        .eq("is_active", true);

      setStylists(stylistsData || []);
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
    <div 
      className="min-h-screen bg-background overflow-x-hidden"
      style={{
        '--tenant-primary-color': tenant.primary_color || '#8B5CF6',
        '--tenant-secondary-color': tenant.secondary_color || '#D946EF',
      } as React.CSSProperties}
    >
      <SEO
        title={`${tenant.name} | Reserva Online`}
        description={`${tenant.name} - ${tenant.city || 'Tu peluquería de confianza'}. Reserva tu cita online.`}
        keywords={`peluquería ${tenant.city}, ${tenant.name}, reserva online`}
        canonicalUrl={`/salon/${tenant.slug}`}
      />

      <Suspense fallback={<SectionSkeleton />}>
        <TenantHeader 
          tenant={tenant} 
          onNavigate={scrollToSection} 
          activeSection={activeSection} 
        />

        <main>
          <div id="inicio">
            <TenantHero 
              tenant={tenant} 
              onBookNow={() => scrollToSection("reserva")} 
            />
          </div>

          <div id="servicios">
            <TenantServices tenantId={tenant.id} />
          </div>

          <div id="reserva">
            <TenantBooking 
              tenant={tenant} 
              stylists={stylists} 
            />
          </div>

          <div id="resenas">
            <TenantReviews tenantId={tenant.id} />
          </div>

          <div id="contacto">
            <TenantFooter tenant={tenant} />
          </div>
        </main>
      </Suspense>
    </div>
  );
};

export default TenantLanding;
