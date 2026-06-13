import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Service, ServicePackage } from "@/types/booking";
import { Badge } from "@/components/ui/badge";
import { Package, Sparkles, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceSelectionProps {
  services: Service[];
  selectedServices: Service[];
  onNext: (services: Service[], packageId?: string) => void;
  tenantId?: string;
}

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return "";
  return `${price.toFixed(2).replace('.', ',')} €`;
};

export const ServiceSelection = ({ services, selectedServices, onNext, tenantId }: ServiceSelectionProps) => {
  const [selected, setSelected] = useState<Service[]>(selectedServices);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Fetch service packages
  useEffect(() => {
    const fetchPackages = async () => {
      if (!tenantId) return;
      setLoadingPackages(true);
      try {
        const { data, error } = await supabase
          .from("service_packages")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_active", true);

        if (error) throw error;
        
        // Filter valid packages (within date range)
        const now = new Date().toISOString();
        const validPackages = (data || []).filter((pkg: any) => {
          if (pkg.valid_from && pkg.valid_from > now) return false;
          if (pkg.valid_until && pkg.valid_until < now) return false;
          return true;
        });
        
        setPackages(validPackages as unknown as ServicePackage[]);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, [tenantId]);

  // Agrupar servicios dinámicamente por su categoría
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    
    services.forEach(service => {
      const category = service.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    });
    
    return groups;
  }, [services]);

  // Obtener las categorías ordenadas
  const categories = useMemo(() => {
    return Object.keys(groupedServices).sort();
  }, [groupedServices]);

  const toggleService = (service: Service) => {
    // Si hay un pack seleccionado, deseleccionarlo al cambiar servicios manualmente
    if (selectedPackage) {
      setSelectedPackage(null);
    }
    setSelected((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const selectPackage = (pkg: ServicePackage) => {
    if (selectedPackage === pkg.id) {
      setSelectedPackage(null);
      setSelected([]);
      return;
    }
    
  setSelectedPackage(pkg.id);
    // Mapear servicios del pack a los servicios reales con sus duraciones
    const packageServiceIds = (pkg.services as any[]).map((s: any) => s.service_id);
    const matchedServices = services.filter(s => packageServiceIds.includes(s.id));
    setSelected(matchedServices);
  };

  const handleNext = () => {
    if (selected.length > 0) {
      onNext(selected, selectedPackage || undefined);
    }
  };

  // Calcular total
  const totalPrice = useMemo(() => {
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      return pkg?.package_price || 0;
    }
    return selected.reduce((sum, s) => sum + (s.price || 0), 0);
  }, [selected, selectedPackage, packages]);

  const renderServiceItem = (service: Service, isInPackage = false) => (
    <div
      key={service.id}
      className={cn(
        "flex items-center justify-between rounded-xl border bg-card p-3 sm:p-4 cursor-pointer transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent/50 active:bg-accent/70 active:scale-[0.99] group touch-manipulation",
        selected.some((s) => s.id === service.id) && 'bg-primary/10 border-primary shadow-sm',
        isInPackage && 'opacity-60 pointer-events-none'
      )}
      onClick={() => !isInPackage && toggleService(service)}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Checkbox
          checked={selected.some((s) => s.id === service.id)}
          onCheckedChange={() => !isInPackage && toggleService(service)}
          className="flex-shrink-0"
          disabled={isInPackage}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-sm sm:text-base truncate">{service.name}</p>
          {service.type === 'Compuesto' ? (
            <>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {service.duration_part1_active + service.duration_part2_active} min activos + {service.duration_exposure_pause} min pausa
              </p>
              <p className="text-xs text-muted-foreground italic mt-0.5">
                ✓ Incluye corte y peinado
              </p>
            </>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">{service.duration} min</p>
          )}
        </div>
      </div>
      {service.price !== null && service.price !== undefined && service.price > 0 && (
        <span className="text-sm sm:text-base font-semibold text-primary ml-2 whitespace-nowrap">
          {formatPrice(service.price)}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Service Packages Section */}
      {packages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Package className="h-5 w-5" />
            <h3 className="font-semibold">Packs Destacados</h3>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Ahorra
            </Badge>
          </div>
          <div className="grid gap-3">
            {packages.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative rounded-xl border-2 p-4 cursor-pointer transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-md active:scale-[0.99]",
                    isSelected 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-dashed border-primary/40 bg-gradient-to-r from-primary/5 to-transparent hover:border-primary/60"
                  )}
                  onClick={() => selectPackage(pkg)}
                >
                  {pkg.discount_percentage && pkg.discount_percentage > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                      -{Math.round(pkg.discount_percentage)}%
                    </Badge>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={isSelected} className="flex-shrink-0" />
                        <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-1 ml-6">{pkg.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2 ml-6">
                        {(pkg.services as any[]).map((s: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {pkg.original_total > pkg.package_price && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(pkg.original_total)}
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(pkg.package_price)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">o elige servicios individuales</span>
            </div>
          </div>
        </div>
      )}

      {/* Individual Services */}
      {categories.length === 1 ? (
        <div className="space-y-2">
          {services.map((service) => renderServiceItem(service, !!selectedPackage))}
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {categories.map((category) => {
            const categoryServices = groupedServices[category];
            if (!categoryServices || categoryServices.length === 0) return null;

            return (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span>{category}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {categoryServices.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {categoryServices.map((service) => renderServiceItem(service, !!selectedPackage))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Footer with total and continue button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <p className={cn(
            "text-sm transition-colors duration-200",
            selected.length > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'
          )}>
            {selected.length} servicio{selected.length !== 1 ? "s" : ""} seleccionado
            {selected.length !== 1 ? "s" : ""}
          </p>
          {totalPrice > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-bold text-lg text-primary">{formatPrice(totalPrice)}</span>
              {selectedPackage && (
                <Badge variant="secondary" className="text-xs ml-1">Pack</Badge>
              )}
            </div>
          )}
        </div>
        <Button 
          onClick={handleNext} 
          disabled={selected.length === 0}
          data-guided-cta="true"
          className="w-full sm:w-auto h-11 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.03] active:scale-[0.97] disabled:scale-100 touch-manipulation"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};