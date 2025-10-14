import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stylist } from "./BookingFlow";
import { User, Users } from "lucide-react";

interface StylistSelectionProps {
  selectedStylist: Stylist | null;
  onNext: (stylist: Stylist) => void;
  onBack: () => void;
}

export const StylistSelection = ({ selectedStylist, onNext, onBack }: StylistSelectionProps) => {
  const stylists = [
    { id: "cris" as Stylist, name: "Cris", description: "Especialista en coloración" },
    { id: "desi" as Stylist, name: "Desi", description: "Experta en peinados" },
    { id: "any" as Stylist, name: "Cualquiera", description: "Siguiente disponible" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stylists.map((stylist) => (
          <Card
            key={stylist.id}
            className={`cursor-pointer border-2 p-6 text-center transition-all hover:shadow-lg ${
              selectedStylist === stylist.id
                ? "border-primary bg-salon-pink-light"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onNext(stylist.id)}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                {stylist.id === "any" ? (
                  <Users className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <User className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{stylist.name}</h3>
            <p className="text-sm text-muted-foreground">{stylist.description}</p>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
      </div>
    </div>
  );
};
