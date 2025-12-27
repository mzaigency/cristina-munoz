import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Clock } from "lucide-react";

interface Service {
  id: string;
  name: string;
  type: string;
  category: string | null;
  duration_part1_active: number;
  duration_exposure_pause: number;
  duration_part2_active: number;
}

interface TenantServicesProps {
  tenantId: string;
}

export const TenantServices = ({ tenantId }: TenantServicesProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, [tenantId]);

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

  const getTotalDuration = (service: Service) => {
    return service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active;
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros Servicios</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre todos los servicios que ofrecemos
          </p>
        </div>

        <div className="space-y-12">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Scissors className="h-5 w-5 text-primary" />
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {service.name}
                        <Badge variant="secondary" className="ml-2">
                          {service.type}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{getTotalDuration(service)} min</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TenantServices;
