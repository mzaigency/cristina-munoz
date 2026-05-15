import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Loader2, MapPin, ArrowRight, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/navigation/AppLayout";
import { SmartSearchHeader } from "@/components/feed/SmartSearchHeader";
import { PremiumSalonCard } from "@/components/feed/PremiumSalonCard";
import { motion } from "motion/react";
import { BUSINESS_TYPES_BY_URL_SLUG } from "@/constants/businessTypes";

interface DirectoryTenant {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  tagline: string | null;
  hero_image_url: string | null;
  features: { business_type?: string; business_type_label?: string } | null;
}

const normalizeForUrl = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const prettifyCity = (slug: string) => decodeURIComponent(slug).split("-").map(capitalize).join(" ");

const DirectoryLanding = () => {
  const { city } = useParams<{ city?: string }>();
  const location = useLocation();
  const category = location.pathname.split("/")[1];
  const [tenants, setTenants] = useState<DirectoryTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewCounts, setReviewCounts] = useState<Record<string, { avg: number; count: number }>>({});

  const catInfo = category ? CATEGORY_MAP[category] : null;
  const cityDisplay = city ? prettifyCity(city) : null;

  useEffect(() => {
    if (!catInfo) {
      setLoading(false);
      return;
    }
    fetchTenants();
  }, [category, city]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, slug, name, city, logo_url, tagline, hero_image_url, features")
        .eq("is_active", true);

      if (error) throw error;

      let filtered = (data || []).filter((t: any) => {
        const bt = t.features?.business_type;
        return bt === catInfo!.type;
      });

      if (city) {
        const cityNorm = normalizeForUrl(city);
        filtered = filtered.filter((t: any) => {
          if (!t.city) return false;
          return normalizeForUrl(t.city) === cityNorm;
        });
      }

      setTenants(filtered as DirectoryTenant[]);

      if (filtered.length > 0) {
        const ids = filtered.map((t: any) => t.id);
        const { data: reviews } = await supabase
          .from("reviews")
          .select("tenant_id, rating")
          .in("tenant_id", ids)
          .eq("approved", true);

        if (reviews) {
          const stats: Record<string, { total: number; count: number }> = {};
          for (const r of reviews) {
            if (!r.tenant_id) continue;
            if (!stats[r.tenant_id]) stats[r.tenant_id] = { total: 0, count: 0 };
            stats[r.tenant_id].total += r.rating;
            stats[r.tenant_id].count += 1;
          }
          const result: Record<string, { avg: number; count: number }> = {};
          for (const [id, s] of Object.entries(stats)) {
            result[id] = { avg: Math.round((s.total / s.count) * 10) / 10, count: s.count };
          }
          setReviewCounts(result);
        }
      }
    } catch (e) {
      console.error("Directory fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // SEO
  const pageTitle = cityDisplay
    ? `${catInfo?.labelPlural || "Salones"} en ${cityDisplay} - Reserva Online`
    : `${catInfo?.labelPlural || "Salones de Belleza"} - Reserva Online | GlowApp`;

  const pageDescription = cityDisplay
    ? `Encuentra las mejores ${catInfo?.labelPlural?.toLowerCase() || "salones"} en ${cityDisplay}. Reserva tu cita online al instante en GlowApp.`
    : `Descubre ${catInfo?.labelPlural?.toLowerCase() || "salones de belleza"} cerca de ti. Consulta horarios, precios y reserva online. GlowApp, la app de belleza #1.`;

  const canonicalPath = cityDisplay ? `/${category}/${city}` : `/${category}`;

  const itemListData = tenants.map((t, i) => ({
    name: t.name,
    url: `/${t.slug}`,
    image: t.logo_url || t.hero_image_url || undefined,
    position: i + 1,
  }));

  const breadcrumbs = [
    { name: "Inicio", url: "/" },
    ...(cityDisplay
      ? [
          { name: catInfo?.labelPlural || "Salones", url: `/${category}` },
          { name: cityDisplay, url: `/${category}/${city}` },
        ]
      : [{ name: catInfo?.labelPlural || "Salones", url: `/${category}` }]),
  ];

  if (!catInfo) return null;

  return (
    <AppLayout>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${catInfo.labelPlural.toLowerCase()}, ${cityDisplay || "España"}, reserva online, cita previa, belleza, ${catInfo.label.toLowerCase()}`}
        canonicalUrl={canonicalPath}
        breadcrumbs={breadcrumbs}
        itemList={itemListData.length > 0 ? itemListData : undefined}
      />

      {/* App Header with logo */}
      <SmartSearchHeader />

      {/* Hero section - liquid glass */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-5 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Sparkles className="h-3 w-3" />
              Directorio verificado
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 leading-tight">
              {cityDisplay
                ? `${catInfo.labelPlural} en ${cityDisplay}`
                : `Las mejores ${catInfo.labelPlural.toLowerCase()}`}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-4">
              {cityDisplay
                ? `Encuentra y reserva en ${catInfo.labelPlural.toLowerCase()} de ${cityDisplay}. Sin llamadas, sin esperas.`
                : `Descubre ${catInfo.labelPlural.toLowerCase()} cerca de ti. Consulta servicios, precios y reserva online.`}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span>
                {tenants.length} {tenants.length === 1 ? "establecimiento" : "establecimientos"}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : tenants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 liquid-glass rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">
              Aún no hay {catInfo.labelPlural.toLowerCase()} {cityDisplay ? `en ${cityDisplay}` : "registrados"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              ¿Tienes {catInfo.label.toLowerCase() === "spa" ? "un" : "una"} {catInfo.label.toLowerCase()}? Regístrate
              gratis y empieza a recibir reservas online.
            </p>
            <Link to="/negocios">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl"
              >
                Registrar mi negocio <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant, index) => {
              const stats = reviewCounts[tenant.id];
              return (
                <PremiumSalonCard
                  key={tenant.id}
                  salon={{
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    logo_url: tenant.logo_url,
                    hero_image_url: tenant.hero_image_url,
                    primary_color: null,
                    city: tenant.city,
                    tagline: tenant.tagline,
                    avgRating: stats ? stats.avg : null,
                    reviewCount: stats ? stats.count : 0,
                  }}
                  index={index}
                />
              );
            })}
          </div>
        )}

        {/* Related cities */}
        {!cityDisplay && tenants.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >
            <h2 className="text-lg font-bold text-foreground mb-4">{catInfo.labelPlural} por ciudad</h2>
            <div className="flex flex-wrap gap-2">
              {[...new Set(tenants.map((t) => t.city).filter(Boolean) as string[])].sort().map((c) => (
                <Link
                  key={c}
                  to={`/${category}/${normalizeForUrl(c)}`}
                  className="px-3 py-1.5 liquid-glass text-foreground rounded-full text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {c}
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* SEO text */}
        <section className="mt-10 liquid-glass rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-2">
            {cityDisplay
              ? `Reservar en ${catInfo.labelPlural.toLowerCase()} en ${cityDisplay}`
              : `Encuentra ${catInfo.labelPlural.toLowerCase()} en toda España`}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {cityDisplay
              ? `En GlowApp puedes descubrir las mejores ${catInfo.labelPlural.toLowerCase()} de ${cityDisplay}. Consulta servicios, horarios, precios y reserva tu cita online en segundos. Sin llamadas, sin esperas.`
              : `GlowApp reúne las mejores ${catInfo.labelPlural.toLowerCase()} de España en una sola plataforma. Busca por ciudad, consulta valoraciones reales y reserva al instante. Es gratis para los usuarios.`}
          </p>
        </section>
      </main>
    </AppLayout>
  );
};

export default DirectoryLanding;
