import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp } from "lucide-react";
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

const BRAND_GRAD = "linear-gradient(100deg, #22408C, #98329A)";

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins}`;
};

const formatPrice = (price: number | null): string | null => {
  if (price === null || price === undefined) return null;
  return `${price.toFixed(2).replace(".", ",")} €`;
};

const totalDurationOf = (s: Service) =>
  s.duration_part1_active + s.duration_exposure_pause + s.duration_part2_active;

export const TenantServicesSection = ({ tenantId, tenantName, primaryColor }: TenantServicesSectionProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoryImages, setCategoryImages] = useState<CategoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
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

  const groupedServices = useMemo(() => {
    const other = t("services.otherCategory");
    return services.reduce((acc, service) => {
      const category = service.category || other;
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services, t]);

  const categories = Object.keys(groupedServices);
  const current = activeCategory && groupedServices[activeCategory] ? activeCategory : categories[0];

  if (loading) {
    return (
      <section className="py-20 md:py-28 bg-[#f5f6fb]">
        <div className="container mx-auto px-5 md:px-8 max-w-3xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="flex gap-2 mb-8">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  const ServiceRow = ({ service }: { service: Service; last?: boolean }) => {
    const price = formatPrice(service.price);
    return (
      <li className="flex items-center justify-between gap-4 rounded-[20px] border border-neutral-100 bg-white p-4 shadow-[0_4px_14px_-10px_rgba(16,20,40,0.35)]">
        <div className="min-w-0">
          <h3 className="font-body text-[14.5px] md:text-[15.5px] font-semibold text-neutral-800 leading-snug">
            {service.name}
          </h3>
          <p className="mt-0.5 text-[12px] text-neutral-400 font-body tabular-nums">
            {formatDuration(totalDurationOf(service))}
          </p>
        </div>
        {price && (
          <span className="text-[15px] md:text-[17px] font-bold tabular-nums whitespace-nowrap text-neutral-900 font-body">
            {price}
          </span>
        )}
      </li>
    );
  };

  return (
    <section id="servicios" className="py-12 md:py-20 bg-[#f5f6fb]">
      <div className="container mx-auto px-5 md:px-8 max-w-3xl">
        <SectionHeader
          eyebrow={t("services.menuKicker")}
          title={t("services.menuTitle")}
          divider={false}
          accentColor={primaryColor}
        />

        {/* Pestañas de categoría */}
        <div className="-mx-5 mb-5 flex gap-2.5 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => {
            const on = cat === current;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-[13px] font-semibold font-body transition-all duration-200 active:scale-[0.97] ${
                  on ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Vista compacta: lista de la categoría activa */}
        {!showFull && (
          <>
            <ul className="space-y-3">
              {(groupedServices[current] || []).map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </ul>
            <button
              onClick={() => setShowFull(true)}
              className="mt-7 w-full rounded-2xl border border-neutral-300/80 bg-white py-3.5 text-[14px] font-semibold text-[#22408C] transition-colors hover:bg-neutral-50 active:scale-[0.99]"
            >
              {t("services.seeFullMenu")}
            </button>
          </>
        )}

        {/* Vista completa: todas las categorías con foto */}
        {showFull && (
          <div className="grid gap-10 lg:gap-12">
            {categories.map((category) => {
              const catServices = groupedServices[category];
              const image = getCategoryImage(category);
              return (
                <article key={category}>
                  {image && (
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-100 shadow-[0_18px_40px_-22px_rgba(20,22,40,0.18)] mb-5 group">
                      <img
                        src={image}
                        alt={category}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute top-3.5 left-3.5 px-3.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-[12px] font-semibold" style={{ color: "#22408C" }}>
                        {catServices.length} {t("services.countLabel")}
                      </div>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h3 className="font-body text-neutral-900 font-bold tracking-[-0.02em]" style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)" }}>
                      {category}
                    </h3>
                    {!image && (
                      <span className="text-[13px] font-semibold font-body whitespace-nowrap" style={{ color: "#22408C" }}>
                        {catServices.length} {t("services.countLabel")}
                      </span>
                    )}
                  </div>
                  <div className="h-[3px] w-9 rounded-full mb-4" style={{ background: BRAND_GRAD }} />
                  <ul>
                    {catServices.map((s, i, arr) => (
                      <ServiceRow key={s.id} service={s} last={i === arr.length - 1} />
                    ))}
                  </ul>
                </article>
              );
            })}
            <button
              onClick={() => setShowFull(false)}
              className="w-full rounded-2xl border border-neutral-300/80 bg-white py-3.5 text-[14px] font-semibold text-[#22408C] transition-colors hover:bg-neutral-50 active:scale-[0.99] inline-flex items-center justify-center gap-2"
            >
              <ChevronUp className="h-4 w-4" />
              {t("services.seeLess")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TenantServicesSection;
