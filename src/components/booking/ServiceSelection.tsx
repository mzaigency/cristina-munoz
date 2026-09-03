import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Service, ServicePackage } from "@/types/booking";
import { Badge } from "@/components/ui/badge";
import { Check, Package, Sparkles, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceSelectionProps {
  services: Service[];
  selectedServices: Service[];
  onNext: (selectedServices: Service[], packageId?: string) => void;
  onSelectionChange?: (selectedServices: Service[], packageId?: string | null) => void;
  tenantId?: string;
  hideFooter?: boolean;
}

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return "";
  return `${price.toFixed(2).replace('.', ',')} €`;
};

export const ServiceSelection = ({
  services,
  selectedServices,
  onNext,
  onSelectionChange,
  tenantId,
  hideFooter = false,
}: ServiceSelectionProps) => {
  const [selected, setSelected] = useState<Service[]>(selectedServices);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(() =>
    selectedServices.map((s) => s.category || "General")
  );

  // Sync internal selection when selectedServices prop changes
  useEffect(() => {
    setSelected(selectedServices);
    if (selectedServices.length > 0) {
      const activeCats = selectedServices.map((s) => s.category || "General");
      setOpenCategories((prev) => Array.from(new Set([...prev, ...activeCats])));
    }
  }, [selectedServices]);

  // Notify parent of selection changes in real-time
  useEffect(() => {
    onSelectionChange?.(selected, selectedPackage);
  }, [selected, selectedPackage]);

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

  const renderServiceItem = (service: Service, isInPackage = false) => {
    const isSelected = selected.some((s) => s.id === service.id);
    return (
      <button
        key={service.id}
        type="button"
        aria-pressed={isSelected}
        disabled={isInPackage}
        className={cn(
          "w-full text-left flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 min-h-[64px] cursor-pointer transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent/50 active:bg-accent/70 active:scale-[0.99] group touch-manipulation",
          isSelected && 'bg-primary/10 border-primary shadow-sm',
          isInPackage && 'opacity-60 pointer-events-none'
        )}
        onClick={() => !isInPackage && toggleService(service)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            aria-hidden
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-[15px] sm:text-base leading-snug">{service.name}</p>
            {service.type === 'Compuesto' ? (
              <>
                <p className="text-[13px] text-neutral-600 font-medium mt-0.5">
                  {service.duration_part1_active + service.duration_part2_active} min activos + {service.duration_exposure_pause} min pausa
                </p>
                <p className="text-[12px] text-primary font-medium italic mt-0.5">
                  ✓ Incluye corte y peinado
                </p>
              </>
            ) : (
              <p className="text-[13px] text-neutral-600 font-medium mt-0.5">{service.duration} min</p>
            )}
          </div>
        </div>
        {service.price !== null && service.price !== undefined && service.price > 0 && (
          <span className="text-[15px] sm:text-base font-bold text-primary whitespace-nowrap tabular-nums">
            {formatPrice(service.price)}
          </span>
        )}
      </button>
    );
  };


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
                    "relative rounded-2xl border-2 p-4 cursor-pointer transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-md active:scale-[0.99]",
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
                        <span
                          aria-hidden
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-1 ml-9">{pkg.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2 ml-9">
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
        <Accordion
          type="multiple"
          value={openCategories}
          onValueChange={setOpenCategories}
          className="w-full"
        >
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

      {/* Footer with total and continue button (only if not handled by modal container) */}
      {!hideFooter && (
        <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="min-w-0">
              <p className={cn(
                "text-xs sm:text-sm transition-colors duration-200 truncate",
                selected.length > 0 ? 'font-semibold text-neutral-900' : 'text-muted-foreground'
              )}>
                {selected.length} {selected.length === 1 ? "servicio" : "servicios"}
                {selected.length > 0 && (
                  <span className="text-neutral-500 font-normal ml-1">
                    ({selected.reduce((acc, s) => acc + (s.type === 'Compuesto' ? s.duration_part1_active + s.duration_exposure_pause + s.duration_part2_active : s.duration), 0)} min)
                  </span>
                )}
              </p>
              {totalPrice > 0 && (
                <p className="font-bold text-base sm:text-lg text-primary tabular-nums leading-tight">
                  {formatPrice(totalPrice)}
                  {selectedPackage && (
                    <Badge variant="secondary" className="text-[10px] ml-1.5 align-middle">Pack</Badge>
                  )}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleNext} 
            disabled={selected.length === 0}
            data-guided-cta="true"
            className="h-11 px-6 sm:px-7 rounded-xl font-semibold transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.03] active:scale-[0.97] disabled:scale-100 touch-manipulation shadow-sm shrink-0"
          >
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
};