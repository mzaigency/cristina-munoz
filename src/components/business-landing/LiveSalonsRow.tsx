import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Salon = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  logo_url: string | null;
};

const FALLBACK: Salon[] = [
  { id: "1", name: "Cristina Muñoz Perruqueria", slug: "cristina-munoz", city: "Barcelona", logo_url: null },
];

export const LiveSalonsRow = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id, name, slug, city, logo_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      setSalons(data && data.length > 0 ? (data as Salon[]) : FALLBACK);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t border-border/60">
        <div className="h-3 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-32 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // <=4 → static row · >4 → infinite marquee
  const useMarquee = salons.length > 4;
  const loop = useMarquee ? [...salons, ...salons] : salons;

  return (
    <div className="mt-6 pt-6 border-t border-border/60">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-3">
        Salones que ya brillan con GlowApp
      </p>

      {!useMarquee ? (
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm">
          {salons.map((s) => (
            <SalonChip key={s.id} salon={s} />
          ))}
        </div>
      ) : (
        <div
          className="relative overflow-hidden -mx-4 px-4 lg:mx-0 lg:px-0"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="flex gap-5 animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused] w-max">
            {loop.map((s, i) => (
              <SalonChip key={`${s.id}-${i}`} salon={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SalonChip = ({ salon }: { salon: Salon }) => (
  <Link
    to={`/${salon.slug}`}
    className="group flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium text-sm whitespace-nowrap transition-colors"
  >
    {salon.logo_url ? (
      <img
        src={salon.logo_url}
        alt=""
        loading="lazy"
        className="w-5 h-5 rounded-full object-cover border border-border"
      />
    ) : (
      <MapPin className="w-3 h-3 text-accent/70" />
    )}
    <span className="group-hover:underline underline-offset-4 decoration-accent/40">
      {salon.name}
    </span>
  </Link>
);
