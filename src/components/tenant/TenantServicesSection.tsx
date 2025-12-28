import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scissors, Palette, Sparkles, Flower2 } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
import { Skeleton } from "@/components/ui/skeleton";

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
}

const categoryIcons: Record<string, any> = {
  "Corte": Scissors,
  "Coloración": Palette,
  "Peinados y Tratamientos": Sparkles,
  "Depilación y Maquillaje": Flower2,
  "default": Scissors,
};

// Default images for categories (fallback)
const defaultCategoryImages: Record<string, string> = {
  "Corte": "/assets/corte.jpg",
  "Coloración": "/assets/coloracion.jpg",
  "Peinados y Tratamientos": "/assets/peinados-tratamientos.jpg",
  "Depilación y Maquillaje": "/assets/depilacion-maquillaje.jpg",
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

const formatPrice = (price: number | null, currency: string = '€'): string | null => {
  if (price === null || price === undefined) return null;
  return `${price.toFixed(2).replace('.', ',')} ${currency}`;
};

export const TenantServicesSection = ({ tenantId, tenantName }: TenantServicesSectionProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoryImages, setCategoryImages] = useState<CategoryImage[]>([]);
  const [loading, setLoading] = useState(true);

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
            .eq("tenant_id", tenantId)
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

    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const getCategoryImage = (category: string): string | null => {
    const customImage = categoryImages.find(ci => ci.category === category)?.image_url;
    if (customImage) return customImage;
    return defaultCategoryImages[category] || null;
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const categories = Object.keys(groupedServices);

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-1 w-24 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Servicios</h2>
          <p className="text-muted-foreground">No hay servicios disponibles en este momento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <SmoothTitle>
            <h2 className="mb-3 text-3xl font-semibold text-foreground md:text-4xl tracking-tight">
              Nuestros Servicios
            </h2>
          </SmoothTitle>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Descubre nuestra amplia gama de servicios profesionales
            {tenantName && ` en ${tenantName}`}
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {categories.map((category, idx) => {
            const Icon = categoryIcons[category] || categoryIcons.default;
            const categoryServices = groupedServices[category];
            const categoryImage = getCategoryImage(category);

            return (
              <ScrollReveal key={category} delay={idx * 80}>
                <div className="rounded-2xl overflow-hidden bg-card border border-primary/20 shadow-sm">
                  {/* Category Header */}
                  {categoryImage ? (
                    <div className="relative h-32 sm:h-40">
                      <img
                        src={categoryImage}
                        alt={category}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-4 left-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/80 backdrop-blur-md">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-white tracking-tight">
                          {category}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-4 border-b border-primary/10 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground tracking-tight">
                          {category}
                        </h3>
                      </div>
                    </div>
                  )}

                  {/* Services List - iOS style with brand accent */}
                  <div className="divide-y divide-border/20">
                    {categoryServices.map((service, serviceIdx) => {
                      const totalDuration =
                        service.duration_part1_active +
                        service.duration_exposure_pause +
                        service.duration_part2_active;

                      const formattedPrice = formatPrice(service.price);

                      return (
                        <div
                          key={service.id}
                          className="flex items-center justify-between px-5 py-3.5 hover:bg-primary/5 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                            <span className="font-medium text-foreground text-[15px]">
                              {service.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground tabular-nums">
                              {formatDuration(totalDuration)}
                            </span>
                            {formattedPrice && (
                              <span className="text-sm text-primary font-semibold tabular-nums">
                                {formattedPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TenantServicesSection;
