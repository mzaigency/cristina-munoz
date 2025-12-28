import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Service } from "@/types/booking";
import { SERVICE_GROUPS, ServiceGroup } from "@/constants/business";

interface ServiceSelectionProps {
  services: Service[];
  selectedServices: Service[];
  onNext: (services: Service[]) => void;
}

export const ServiceSelection = ({ services, selectedServices, onNext }: ServiceSelectionProps) => {
  const [selected, setSelected] = useState<Service[]>(selectedServices);

  // Agrupar servicios por grupo según las categorías de la base de datos
  const groupedServices: Record<ServiceGroup, Service[]> = {
    'Coloración': [],
    'Corte': [],
    'Estética': [],
    'Peinados y Tratamientos': [],
    'Asesoramiento profesional': []
  };

  services.forEach(service => {
    // Mover Éclat a Peinados y Tratamientos
    if (service.name === 'Éclat') {
      groupedServices['Peinados y Tratamientos'].push(service);
    }
    // Asesoramiento profesional
    else if (service.category === 'Asesoramiento profesional') {
      groupedServices['Asesoramiento profesional'].push(service);
    }
    // Depilación Facial y Makeup van a Estética
    else if (service.category === 'Depilación Facial' || service.category === 'Otros') {
      groupedServices['Estética'].push(service);
    }
    // El resto va según su categoría
    else if (service.category === 'Coloración') {
      groupedServices['Coloración'].push(service);
    }
    else if (service.category === 'Corte') {
      groupedServices['Corte'].push(service);
    }
    else if (service.category === 'Peinados y Tratamientos') {
      groupedServices['Peinados y Tratamientos'].push(service);
    }
  });

  const toggleService = (service: Service) => {
    setSelected((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleNext = () => {
    if (selected.length > 0) {
      onNext(selected);
    }
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        {SERVICE_GROUPS.map((group) => {
          const groupServices = groupedServices[group];
          if (!groupServices || groupServices.length === 0) return null;

          return (
            <AccordionItem key={group} value={group}>
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                {group}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {groupServices.map((service) => (
                    <div
                      key={service.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border bg-card p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 active:bg-accent/70 group touch-manipulation",
                        selected.some((s) => s.id === service.id) && 'bg-salon-pink-light border-primary shadow-glow-sm'
                      )}
                      onClick={() => toggleService(service)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selected.some((s) => s.id === service.id)}
                          onCheckedChange={() => toggleService(service)}
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0">
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
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
        <p className={cn(
          "text-sm transition-colors duration-200",
          selected.length > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'
        )}>
          {selected.length} servicio{selected.length !== 1 ? "s" : ""} seleccionado
          {selected.length !== 1 ? "s" : ""}
        </p>
        <Button 
          onClick={handleNext} 
          disabled={selected.length === 0}
          className="w-full sm:w-auto h-11 transition-transform duration-200 hover:scale-105 disabled:scale-100 touch-manipulation"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
