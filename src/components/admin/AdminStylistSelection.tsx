import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Stylist } from "@/types/booking";

interface TenantStylist {
  slug: string;
  name: string;
  color: string | null;
  avatar_url: string | null;
}

interface AdminStylistSelectionProps {
  tenantId: string;
  selectedStylist: Stylist | null;
  onNext: (stylist: Stylist) => void;
  onBack: () => void;
}

export const AdminStylistSelection = ({
  tenantId,
  selectedStylist,
  onNext,
  onBack,
}: AdminStylistSelectionProps) => {
  const [stylists, setStylists] = useState<TenantStylist[]>([]);
  const [loading, setLoading] = useState(true);
  const autoSelectedRef = (typeof window !== "undefined" ? { current: false } : { current: false });

  useEffect(() => {
    let cancelled = false;
    const fetchStylists = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenant_stylists")
        .select("slug, name, color, avatar_url")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");

      if (cancelled) return;
      if (!error && data) {
        setStylists(data as TenantStylist[]);
        // Auto-select if there's only one stylist
        if (data.length === 1 && !autoSelectedRef.current) {
          autoSelectedRef.current = true;
          onNext(data[0].slug as Stylist);
        }
      }
      setLoading(false);
    };
    fetchStylists();
    return () => { cancelled = true; };
  }, [tenantId, onNext]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stylists.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay profesionales activos. Añade un profesional desde "Equipo" antes de crear citas.
          </p>
        </div>
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Volver</Button>
        </div>
      </div>
    );
  }

  const options: Array<{ id: string; name: string; isAny?: boolean; color?: string | null; avatar_url?: string | null }> = [
    ...stylists.map((s) => ({ id: s.slug, name: s.name, color: s.color, avatar_url: s.avatar_url })),
  ];
  if (stylists.length > 1) {
    options.push({ id: "any", name: "Siguiente disponible", isAny: true });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((opt) => (
          <Card
            key={opt.id}
            className={cn(
              "cursor-pointer border-2 p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group",
              selectedStylist === (opt.id as Stylist)
                ? "border-primary bg-salon-pink-light shadow-glow-sm"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onNext(opt.id as Stylist)}
          >
            <div className="mb-4 flex justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 overflow-hidden"
                style={{ backgroundColor: opt.isAny ? undefined : (opt.color || "hsl(var(--primary))") }}
              >
                {opt.avatar_url ? (
                  <img src={opt.avatar_url} alt={opt.name} className="h-full w-full object-cover" />
                ) : opt.isAny ? (
                  <Users className="h-8 w-8 text-primary-foreground" style={{ color: "hsl(var(--primary-foreground))" }} />
                ) : (
                  <User className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
              {opt.name}
            </h3>
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
