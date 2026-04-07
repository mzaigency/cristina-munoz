import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface TenantStylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  avatar_url: string | null;
}

interface TenantStylistSelectionProps {
  tenantId: string;
  selectedStylist: string | null;
  onNext: (stylistSlug: string) => void;
  onBack: () => void;
}

export const TenantStylistSelection = ({ 
  tenantId, 
  selectedStylist, 
  onNext, 
  onBack 
}: TenantStylistSelectionProps) => {
  const [stylists, setStylists] = useState<TenantStylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStylists = async () => {
      try {
        const { data, error } = await supabase
          .from("tenant_stylists")
          .select("id, name, slug, color, avatar_url")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;
        const result = data || [];
        setStylists(result);

        // Auto-skip if only 1 professional
        if (result.length === 1) {
          onNext(result[0].slug);
        }
      } catch (error) {
        console.error("Error fetching stylists:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchStylists();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If only 1 stylist, don't render UI (auto-skipped above)
  if (stylists.length <= 1) {
    return null;
  }

  // Create options including "next available" option
  const options = [
    ...stylists.map(s => ({
      id: s.slug,
      name: s.name,
      color: s.color,
      avatar_url: s.avatar_url,
    })),
    {
      id: "any",
      name: "Siguiente disponible",
      color: null,
      avatar_url: null,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        {options.map((stylist) => (
          <Card
            key={stylist.id}
            className={cn(
              "cursor-pointer border-2 p-4 sm:p-6 text-center transition-all duration-200 hover:shadow-lg active:scale-[0.98] group touch-manipulation",
              selectedStylist === stylist.id 
                ? "border-primary bg-salon-pink-light shadow-glow-sm" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onNext(stylist.id)}
          >
            <div className="mb-3 sm:mb-4 flex justify-center">
              {stylist.avatar_url ? (
                <img 
                  src={stylist.avatar_url} 
                  alt={stylist.name}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover transition-transform duration-200 group-hover:scale-110"
                />
              ) : (
                <div 
                  className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: stylist.color || 'hsl(var(--primary))' }}
                >
                  {stylist.id === "any" ? (
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  ) : (
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  )}
                </div>
              )}
            </div>
            <h3 className="mb-1 sm:mb-2 text-sm sm:text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
              {stylist.name}
            </h3>
          </Card>
        ))}
      </div>

      <div className="flex justify-start pt-4">
        <Button variant="outline" onClick={onBack} className="h-11 transition-transform duration-200 hover:scale-105 touch-manipulation">
          Volver
        </Button>
      </div>
    </div>
  );
};

export default TenantStylistSelection;
