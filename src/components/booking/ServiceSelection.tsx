import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Service } from "./BookingFlow";

interface ServiceSelectionProps {
  services: Service[];
  selectedServices: Service[];
  onNext: (services: Service[]) => void;
}

export const ServiceSelection = ({ services, selectedServices, onNext }: ServiceSelectionProps) => {
  const [selected, setSelected] = useState<Service[]>(selectedServices);

  const categories = Array.from(new Set(services.map((s) => s.category)));

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
      {categories.map((category) => (
        <div key={category}>
          <h3 className="mb-3 font-semibold text-foreground">{category}</h3>
          <div className="space-y-2">
            {services
              .filter((s) => s.category === category)
              .map((service) => (
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
                      <p className="text-sm text-muted-foreground">{service.duration} min</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

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
