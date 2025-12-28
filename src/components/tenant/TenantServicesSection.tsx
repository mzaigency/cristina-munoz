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

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

export const TenantServicesSection = ({ tenantId, tenantName }: TenantServicesSectionProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchServices();
    }
  }, [tenantId]);

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
        <div className="mb-16 text-center">
          <SmoothTitle>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Nuestros Servicios
            </h2>
          </SmoothTitle>
          <div className="line-accent mx-auto mb-4" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra amplia gama de servicios profesionales
            {tenantName && ` en ${tenantName}`}
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {categories.map((category, idx) => {
            const Icon = categoryIcons[category] || categoryIcons.default;
            const categoryServices = groupedServices[category];
            const isReversed = idx % 2 !== 0;

            return (
              <ScrollReveal key={category} delay={idx * 100}>
                <div
                  className={`rounded-2xl overflow-hidden shadow-2xl shadow-black/15 bg-card flex ${
                    isReversed ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Primary color border */}
                  <div
                    className={`hidden lg:block w-1.5 bg-primary flex-shrink-0 ${
                      isReversed ? "order-last" : "order-first"
                    }`}
                  />

                  <div className="flex-1">
                    {/* Category Header */}
                    <div className="p-6 border-b border-border/30 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary shadow-lg shadow-primary/30">
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground uppercase tracking-wide">
                          {category}
                        </h3>
                      </div>
                    </div>

                    {/* Services List */}
                    <div className="p-6 lg:p-8">
                      <div className="grid gap-3 md:grid-cols-2">
                        {categoryServices.map((service) => {
                          const totalDuration =
                            service.duration_part1_active +
                            service.duration_exposure_pause +
                            service.duration_part2_active;

                          return (
                            <div
                              key={service.id}
                              className="flex items-center justify-between py-3 border-l-4 border-primary pl-4 hover:bg-accent/50 transition-colors rounded-r-md"
                            >
                              <div>
                                <p className="font-semibold text-foreground">
                                  {service.name}
                                </p>
                                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                                  {formatDuration(totalDuration)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
