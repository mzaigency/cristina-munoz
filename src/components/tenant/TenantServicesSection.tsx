import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { SectionHeader } from "./_shared/SectionHeader";
import { useT } from "@/lib/tenantI18n";

interface Service {
  id: string;
  name: string;
  category: string | null;
  type: string;
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
  price: number | null;
}

interface CategoryImage {
  category: string;
  image_url: string;
}

interface TenantServicesSectionProps {
  tenantId: string;
  tenantName?: string;
  primaryColor?: string | null;
}

const INITIAL_LIMIT = 6;

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return "Consultar";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};

const formatPrice = (price: number | null): string | null => {
  if (price === null || price === undefined || price <= 0) return null;
  return `${price.toFixed(2).replace(".", ",")} €`;
};

const totalDurationOf = (s: Service) =>
  (s.duration_part1_active || 0) + (s.duration_exposure_pause || 0) + (s.duration_part2_active || 0);

export const TenantServicesSection = ({ tenantId, tenantName, primaryColor }: TenantServicesSectionProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoryImages, setCategoryImages] = useState<CategoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useT();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, imagesRes] = await Promise.all([
          supabase
            .from("services")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("category", { ascending: true })
            .order("name", { ascending: true }),
          supabase
            .from("tenant_category_images")
            .select("category, image_url")
            .eq("tenant_id", tenantId),
        ]);

        if (servicesRes.error) throw servicesRes.error;
        setServices(servicesRes.data || []);
        setCategoryImages(imagesRes.data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) fetchData();
  }, [tenantId]);

  const getCategoryImage = (category: string): string | null =>
    categoryImages.find((ci) => ci.category === category)?.image_url || null;

  // Group services by category
  const groupedServices = useMemo(() => {
    const other = t("services.otherCategory") || "Otros";
    return services.reduce((acc, service) => {
      const category = service.category || other;
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services, t]);

  const categories = useMemo(() => Object.keys(groupedServices), [groupedServices]);

  const handleBookService = (service: Service) => {
    window.dispatchEvent(new CustomEvent("glow:open-booking", { detail: { serviceId: service.id } }));
  };

  // Reset expansion when switching categories
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setIsExpanded(false);
  };

  if (loading) {
    return (
      <section className="tv-section tv-section--tint">
        <div className="container mx-auto px-5 md:px-8 max-w-5xl">
          <Skeleton className="h-10 w-64 mb-3" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="flex gap-2.5 mb-8 overflow-hidden">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-[20px]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) return null;

  const ServiceCard = ({ service }: { service: Service }) => {
    const price = formatPrice(service.price);
    const duration = totalDurationOf(service);

    return (
      <div
        onClick={() => handleBookService(service)}
        className="group relative rounded-[20px] bg-white border border-neutral-200/80 hover:border-neutral-300/90 p-4 md:p-5 shadow-[0_2px_8px_-2px_rgba(16,20,40,0.04)] hover:shadow-[0_10px_24px_-6px_rgba(16,20,40,0.10)] transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase font-body">
              {service.category || "Servicio"}
            </span>
            {duration > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400 font-body tabular-nums">
                <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                {formatDuration(duration)}
              </span>
            )}
          </div>

          <h4 className="font-editorial text-[16px] md:text-[17px] font-bold text-neutral-900 group-hover:text-primary transition-colors leading-snug">
            {service.name}
          </h4>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div>
            {price ? (
              <span className="text-[16px] md:text-[18px] font-bold text-neutral-900 font-body tabular-nums tracking-tight">
                {price}
              </span>
            ) : (
              <span className="text-[12.5px] font-medium text-neutral-400 font-body italic">
                Consultar en salón
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold font-body text-primary group-hover:translate-x-0.5 transition-transform">
            <span>Reservar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  };

  // Determine which items to display
  const currentCategoryServices = activeCategory === "all" ? services : (groupedServices[activeCategory] || []);
  const needsExpansion = currentCategoryServices.length > INITIAL_LIMIT;
  const displayedServices = isExpanded || !needsExpansion
    ? currentCategoryServices
    : currentCategoryServices.slice(0, INITIAL_LIMIT);

  return (
    <section id="servicios" className="tv-section tv-section--tint scroll-mt-20">
      <div className="container mx-auto px-5 md:px-8 max-w-5xl">
        <SectionHeader
          title={
            <>
              Servicios y <span className="font-editorial-italic">precios</span>
            </>
          }
          divider={true}
          description="Carta de tratamientos y servicios profesionales. Elige tu servicio para reservar tu cita online."
          accentColor={primaryColor}
        />

        {/* Category Filter Pills */}
        <div
          className="-mx-5 mb-8 flex gap-2 overflow-x-auto pl-5 pr-10 pb-2 md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {/* "Todos" Tab */}
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            style={
              activeCategory === "all"
                ? {
                    backgroundColor: primaryColor || "hsl(var(--primary))",
                    borderColor: primaryColor || "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground, 0 0% 100%))",
                  }
                : undefined
            }
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold font-body border transition-all duration-200 active:scale-[0.97] ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-white/95 text-neutral-600 hover:text-neutral-900 border-neutral-200/90 hover:border-neutral-300 hover:bg-white shadow-xs"
            }`}
          >
            <span>Todos</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums transition-colors ${
                activeCategory === "all" ? "bg-white/25 text-white" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {services.length}
            </span>
          </button>

          {/* Individual Category Tabs */}
          {categories.map((cat) => {
            const count = groupedServices[cat]?.length || 0;
            const on = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                style={
                  on
                    ? {
                        backgroundColor: primaryColor || "hsl(var(--primary))",
                        borderColor: primaryColor || "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground, 0 0% 100%))",
                      }
                    : undefined
                }
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold font-body border transition-all duration-200 active:scale-[0.97] ${
                  on
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-white/95 text-neutral-600 hover:text-neutral-900 border-neutral-200/90 hover:border-neutral-300 hover:bg-white shadow-xs"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums transition-colors ${
                    on ? "bg-white/25 text-white" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Header Banner if a single category with image is active */}
        {activeCategory !== "all" && getCategoryImage(activeCategory) && (
          <div className="relative aspect-[21/9] max-h-44 w-full rounded-[20px] overflow-hidden shadow-sm mb-6">
            <img
              src={getCategoryImage(activeCategory)!}
              alt={activeCategory}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xs font-medium uppercase tracking-wider text-white/80">Categoría</p>
              <h3 className="font-editorial text-2xl font-bold text-white leading-tight">{activeCategory}</h3>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
          {displayedServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Desplegable / Pestaña para ver carta completa */}
        {needsExpansion && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-neutral-200/90 text-neutral-800 font-semibold text-sm shadow-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 active:scale-[0.98] group"
            >
              {isExpanded ? (
                <>
                  <span>Mostrar menos</span>
                  <ChevronUp className="w-4 h-4 text-neutral-500 group-hover:-translate-y-0.5 transition-transform" />
                </>
              ) : (
                <>
                  <span>
                    Ver toda la carta{" "}
                    {activeCategory === "all" ? `(${services.length} servicios)` : `(${currentCategoryServices.length})`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-500 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TenantServicesSection;
