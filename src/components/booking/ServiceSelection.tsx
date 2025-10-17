import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Service } from "./BookingFlow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ServiceSelectionProps {
  services: Service[];
  selectedServices: Service[];
  onNext: (services: Service[]) => void;
}

export const ServiceSelection = ({ services, selectedServices, onNext }: ServiceSelectionProps) => {
  const [selected, setSelected] = useState<Service[]>(selectedServices);

  // Agrupar servicios por grupo según las categorías de la base de datos
  const groupedServices: Record<string, Service[]> = {
    'Coloración': [],
    'Corte': [],
    'Estética': [],
    'Peinados y Tratamientos': []
  };

  services.forEach(service => {
    // Mover Éclat a Peinados y Tratamientos
    if (service.name === 'Éclat') {
      groupedServices['Peinados y Tratamientos'].push(service);
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

  const groups = ['Coloración', 'Corte', 'Estética', 'Peinados y Tratamientos'];

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
        {groups.map((group) => {
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
                      className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => toggleService(service)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selected.some((s) => s.id === service.id)}
                          onCheckedChange={() => toggleService(service)}
                        />
                        <div>
                          <p className="font-medium text-foreground">{service.name}</p>
                          {service.type === 'Compuesto' ? (
                            <p className="text-sm text-muted-foreground">
                              {service.duration_part1_active + service.duration_part2_active} min activos + {service.duration_exposure_pause} min pausa
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">{service.duration} min</p>
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

      <div className="flex justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          {selected.length} servicio{selected.length !== 1 ? "s" : ""} seleccionado
          {selected.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={handleNext} disabled={selected.length === 0}>
          Continuar
        </Button>
      </div>
    </div>
  );
};
