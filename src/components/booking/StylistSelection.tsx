import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stylist } from "@/types/booking";
interface StylistSelectionProps {
  selectedStylist: Stylist | null;
  onNext: (stylist: Stylist) => void;
  onBack: () => void;
}
export const StylistSelection = ({ selectedStylist, onNext, onBack }: StylistSelectionProps) => {
  const stylists = [
    {
      id: "cris" as Stylist,
      name: "Cris",
    },
    {
      id: "desi" as Stylist,
      name: "Desi",
    },
    {
      id: "any" as Stylist,
      name: "Cualquiera",
      description: "Siguiente disponible",
    },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stylists.map((stylist) => (
          <Card
            key={stylist.id}
            className={cn(
              "cursor-pointer border-2 p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group",
              selectedStylist === stylist.id 
                ? "border-primary bg-salon-pink-light shadow-glow-sm" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onNext(stylist.id)}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary transition-transform duration-200 group-hover:scale-110">
                {stylist.id === "any" ? (
                  <Users className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <User className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
              {stylist.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {stylist.description}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="transition-transform duration-200 hover:scale-105">
          Volver
        </Button>
      </div>
    </div>
  );
};
