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
        setStylists(data || []);
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

  // Create options including "any" option
  const options = [
    ...stylists.map(s => ({
      id: s.slug,
      name: s.name,
      description: "",
      color: s.color,
      avatar_url: s.avatar_url,
    })),
    {
      id: "any",
      name: "Cualquiera",
      description: "Siguiente disponible",
      color: null,
      avatar_url: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((stylist) => (
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
              {stylist.avatar_url ? (
                <img 
                  src={stylist.avatar_url} 
                  alt={stylist.name}
                  className="h-16 w-16 rounded-full object-cover transition-transform duration-200 group-hover:scale-110"
                />
              ) : (
                <div 
                  className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: stylist.color || 'hsl(var(--primary))' }}
                >
                  {stylist.id === "any" ? (
                    <Users className="h-8 w-8 text-white" />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
              )}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
              {stylist.name}
            </h3>
            {stylist.description && (
              <p className="text-sm text-muted-foreground">
                {stylist.description}
              </p>
            )}
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

export default TenantStylistSelection;
