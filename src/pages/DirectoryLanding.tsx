import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Loader2, MapPin, Star, ArrowRight, Scissors, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// URL slug → DB business_type
const CATEGORY_MAP: Record<string, { type: string; label: string; labelPlural: string }> = {
  peluquerias: { type: "peluqueria", label: "Peluquería", labelPlural: "Peluquerías" },
  barberias: { type: "barberia", label: "Barbería", labelPlural: "Barberías" },
  estetica: { type: "estetica", label: "Centro de Estética", labelPlural: "Centros de Estética" },
  spa: { type: "spa", label: "Spa", labelPlural: "Spas" },
  unas: { type: "unas", label: "Centro de Uñas", labelPlural: "Centros de Uñas" },
};

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
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const prettifyCity = (slug: string) =>
  decodeURIComponent(slug).split("-").map(capitalize).join(" ");

const DirectoryLanding = () => {
  const { city } = useParams<{ city?: string }>();
  const location = useLocation();
  // Extract category from path: /peluquerias/city → peluquerias
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
      // We need to fetch tenants and filter by business_type from features JSON
      const { data, error } = await supabase
        .from("tenants")
        .select("id, slug, name, city, logo_url, tagline, hero_image_url, features")
        .eq("is_active", true);

      if (error) throw error;

      let filtered = (data || []).filter((t: any) => {
        const bt = t.features?.business_type;
        return bt === catInfo!.type;
      });

      // Filter by city if provided
      if (city) {
        const cityNorm = normalizeForUrl(city);
        filtered = filtered.filter((t: any) => {
          if (!t.city) return false;
          return normalizeForUrl(t.city) === cityNorm;
        });
      }

      setTenants(filtered as DirectoryTenant[]);

      // Fetch review stats for all matching tenants
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

  // SEO data
  const pageTitle = cityDisplay
    ? `${catInfo?.labelPlural || "Salones"} en ${cityDisplay} - Reserva Online`
    : `${catInfo?.labelPlural || "Salones de Belleza"} - Reserva Online | GlowApp`;

  const pageDescription = cityDisplay
    ? `Encuentra las mejores ${catInfo?.labelPlural?.toLowerCase() || "salones"} en ${cityDisplay}. Reserva tu cita online al instante en GlowApp.`
    : `Descubre ${catInfo?.labelPlural?.toLowerCase() || "salones de belleza"} cerca de ti. Consulta horarios, precios y reserva online. GlowApp, la app de belleza #1.`;

  const canonicalPath = cityDisplay
    ? `/${category}/${city}`
    : `/${category}`;

  // ItemList schema for SEO
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

  if (!catInfo) {
    return null; // Will fall through to catch-all route
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${catInfo.labelPlural.toLowerCase()}, ${cityDisplay || "España"}, reserva online, cita previa, belleza, ${catInfo.label.toLowerCase()}`}
        canonicalUrl={canonicalPath}
        breadcrumbs={breadcrumbs}
        itemList={itemListData.length > 0 ? itemListData : undefined}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg text-foreground">GlowApp</span>
          </Link>
          <Link to="/para-negocios">
            <Button variant="outline" size="sm">Para Negocios</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 leading-tight">
            {cityDisplay
              ? `${catInfo.labelPlural} en ${cityDisplay}`
              : `Las mejores ${catInfo.labelPlural.toLowerCase()} de España`}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {cityDisplay
              ? `Encuentra y reserva en ${catInfo.labelPlural.toLowerCase()} de ${cityDisplay}. Sin llamadas, sin esperas.`
              : `Descubre ${catInfo.labelPlural.toLowerCase()} cerca de ti. Consulta servicios, precios y reserva online al instante.`}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>{tenants.length} {tenants.length === 1 ? "establecimiento encontrado" : "establecimientos encontrados"}</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Aún no hay {catInfo.labelPlural.toLowerCase()} {cityDisplay ? `en ${cityDisplay}` : "registrados"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              ¿Tienes {catInfo.label.toLowerCase() === "spa" ? "un" : "una"} {catInfo.label.toLowerCase()}? Regístrate gratis y empieza a recibir reservas online.
            </p>
            <Link to="/para-negocios">
              <Button size="lg" className="gap-2">
                Registrar mi negocio <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => {
              const stats = reviewCounts[tenant.id];
              return (
                <Link
                  key={tenant.id}
                  to={`/${tenant.slug}`}
                  className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                    {tenant.hero_image_url || tenant.logo_url ? (
                      <img
                        src={tenant.hero_image_url || tenant.logo_url || ""}
                        alt={`${tenant.name} - ${catInfo.label}${tenant.city ? ` en ${tenant.city}` : ""}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                      {tenant.name}
                    </h2>
                    {tenant.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-3.5 w-3.5" /> {tenant.city}
                      </p>
                    )}
                    {tenant.tagline && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{tenant.tagline}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {stats ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">{stats.avg}</span>
                          <span className="text-muted-foreground">({stats.count})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nuevo</span>
                      )}
                      <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
                        Reservar <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Related cities section */}
        {!cityDisplay && tenants.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {catInfo.labelPlural} por ciudad
            </h2>
            <div className="flex flex-wrap gap-2">
              {[...new Set(tenants.map((t) => t.city).filter(Boolean) as string[])].sort().map((c) => (
                <Link
                  key={c}
                  to={`/${category}/${normalizeForUrl(c)}`}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {c}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEO text block */}
        <section className="mt-16 prose prose-sm max-w-3xl mx-auto text-muted-foreground">
          <h2 className="text-xl font-bold text-foreground">
            {cityDisplay
              ? `Reservar en ${catInfo.labelPlural.toLowerCase()} en ${cityDisplay}`
              : `Encuentra ${catInfo.labelPlural.toLowerCase()} en toda España`}
          </h2>
          <p>
            {cityDisplay
              ? `En GlowApp puedes descubrir las mejores ${catInfo.labelPlural.toLowerCase()} de ${cityDisplay}. Consulta servicios, horarios, precios y reserva tu cita online en segundos. Sin llamadas, sin esperas.`
              : `GlowApp reúne las mejores ${catInfo.labelPlural.toLowerCase()} de España en una sola plataforma. Busca por ciudad, consulta valoraciones reales y reserva al instante. Es gratis para los usuarios.`}
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GlowApp. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link to="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link to="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
            <Link to="/para-negocios" className="hover:text-foreground transition-colors">Para negocios</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DirectoryLanding;
