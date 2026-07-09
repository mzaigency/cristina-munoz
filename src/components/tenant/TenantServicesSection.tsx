import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
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

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

const formatPrice = (price: number | null): string | null => {
  if (price === null || price === undefined) return null;
  return `${price.toFixed(2).replace(".", ",")}€`;
};

export const TenantServicesSection = ({ tenantId, tenantName, primaryColor }: TenantServicesSectionProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoryImages, setCategoryImages] = useState<CategoryImage[]>([]);
  const [loading, setLoading] = useState(true);
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

  const getCategoryImage = (category: string): string | null => {
    return categoryImages.find((ci) => ci.category === category)?.image_url || null;
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || t("services.otherCategory");
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const categories = Object.keys(groupedServices);

  if (loading) {
    return (
      <section className="py-20 md:py-28 bg-[#f5f6fb]">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <Skeleton className="h-12 w-80 mb-4" />
          <Skeleton className="h-px w-16 mb-12" />
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section id="servicios" className="py-20 md:py-28 bg-[#f5f6fb]">
      <div className="container mx-auto px-5 md:px-8 max-w-6xl">
        <SectionHeader
          eyebrow={t("services.title")}
          title={
            <>
              {t("services.titlePre")} <span className="font-editorial-italic">{t("services.titleAccent")}</span>
            </>
          }
          description={
            tenantName
              ? `${t("services.discoverPre")} ${tenantName}. ${t("services.subtitle")}`
              : t("services.subtitle")
          }
          accentColor={primaryColor}
        />

        <div className="grid gap-10 lg:gap-14">
          {categories.map((category) => {
            const categoryServices = groupedServices[category];
            const categoryImage = getCategoryImage(category);
            const hasImage = !!categoryImage;

            return (
              <article
                key={category}
                className={hasImage ? "grid md:grid-cols-[1.1fr_1.5fr] gap-6 md:gap-10 items-start" : "max-w-3xl mx-auto w-full"}
              >
                {/* Image side — only when image exists */}
                {hasImage && (
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100 shadow-[0_18px_40px_-22px_rgba(20,22,40,0.18)] group">
                    <img
                      src={categoryImage!}
                      alt={category}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    <div
                      className="absolute top-4 left-4 px-3.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-[12px] font-semibold font-body"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {categoryServices.length} {t("services.countLabel")}
                    </div>
                  </div>
                )}

                {/* Services list */}
                <div className="flex flex-col">
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <h3
                      className="font-editorial text-neutral-900 tracking-[-0.02em]"
                      style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", lineHeight: 1.1 }}
                    >
                      {category}
                    </h3>
                    {!hasImage && (
                      <span
                        className="text-[13px] font-semibold font-body whitespace-nowrap"
                        style={{ color: "hsl(var(--primary))" }}
                      >
                        {categoryServices.length} {t("services.countLabel")}
                      </span>
                    )}
                  </div>
                  <div
                    className="h-px w-10 mb-6 mt-3"
                    style={{ background: "color-mix(in oklab, hsl(var(--primary)), transparent 55%)" }}
                  />

                  <ul className="divide-y divide-neutral-200/80">
                    {categoryServices.map((service) => {
                      const totalDuration =
                        service.duration_part1_active +
                        service.duration_exposure_pause +
                        service.duration_part2_active;
                      const formattedPrice = formatPrice(service.price);

                      return (
                        <li
                          key={service.id}
                          className="flex items-baseline gap-3 sm:gap-5 py-4 group transition-colors"
                        >
                          <span className="flex-1 font-body text-[15.5px] md:text-base font-medium text-neutral-800 leading-snug">
                            {service.name}
                          </span>
                          <span className="text-xs text-neutral-400 tabular-nums whitespace-nowrap font-body">
                            {formatDuration(totalDuration)}
                          </span>
                          {formattedPrice && (
                            <span className="font-editorial text-[18px] md:text-xl tabular-nums whitespace-nowrap text-neutral-900 ml-1">
                              {formattedPrice}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TenantServicesSection;
