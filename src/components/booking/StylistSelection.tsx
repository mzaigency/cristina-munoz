import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stylist } from "./BookingFlow";
import { User, Users } from "lucide-react";
interface StylistSelectionProps {
  selectedStylist: Stylist | null;
  onNext: (stylist: Stylist) => void;
  onBack: () => void;
}
export const StylistSelection = ({
  selectedStylist,
  onNext,
  onBack
}: StylistSelectionProps) => {
  const stylists = [{
    id: "cris" as Stylist,
    name: "Cris",
    description: "Especialista en coloración"
  }, {
    id: "desi" as Stylist,
    name: "Desi",
    description: "Experta en peinados"
  }, {
    id: "any" as Stylist,
    name: "Cualquiera",
    description: "Siguiente disponible"
  }];
  return <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stylists.map((stylist, index) => <Card 
            key={stylist.id} 
            className={`cursor-pointer border-2 p-6 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 group animate-fade-in-up ${selectedStylist === stylist.id ? "border-primary bg-salon-pink-light shadow-glow-sm scale-[1.02]" : "border-border hover:border-primary/50"}`} 
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onNext(stylist.id)}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow">
                {stylist.id === "any" ? <Users className="h-8 w-8 text-primary-foreground transition-transform duration-300 group-hover:rotate-12" /> : <User className="h-8 w-8 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />}
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">{stylist.name}</h3>
            <p className="text-sm text-muted-foreground transition-opacity duration-300 group-hover:opacity-70">{stylist.description}</p>
          </Card>)}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="transition-all duration-300 hover:scale-105">
          Volver
        </Button>
      </div>
    </div>;
};