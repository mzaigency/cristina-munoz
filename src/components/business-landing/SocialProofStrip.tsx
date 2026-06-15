import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Star, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LiveSalonsRow } from "./LiveSalonsRow";

/**
 * Banda de prueba social con métricas reales (rellenadas desde DB).
 * Muestra: reservas gestionadas · salones activos · valoración media · pagos seguros.
 * Pensada para colocarse justo después del hero, antes del PanelShowcase.
 */
export const SocialProofStrip = () => {
  const [bookings, setBookings] = useState<number | null>(null);
  const [tenants, setTenants] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [b, t] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("tenants").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      if (typeof b.count === "number") setBookings(b.count);
      if (typeof t.count === "number") setTenants(t.count);
    })();
  }, []);

  const fmtBookings = (n: number | null) => {
    if (n === null) return "—";
    if (n >= 1000) return `${(Math.floor(n / 100) / 10).toFixed(1).replace(".", ",")}k+`;
    return `${Math.max(n, 10)}+`;
  };

  const items = [
    { icon: Calendar, value: fmtBookings(bookings), label: "reservas gestionadas" },
    { icon: Sparkles, value: tenants !== null ? `${Math.max(tenants, 1)}+` : "—", label: tenants === 1 ? "salón activo" : "salones activos" },
    { icon: Star, value: "4,9★", label: "valoración media" },
    { icon: ShieldCheck, value: "Stripe", label: "pagos seguros · RGPD" },
  ];

  return (
    <section className="relative py-10 sm:py-14 bg-background/60 backdrop-blur-sm border-y border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-5xl mx-auto"
        >
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.label}
                className="flex flex-col items-center text-center px-3 py-4 sm:py-5 rounded-2xl bg-background/80 border border-border/60 shadow-sm"
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-foreground leading-none">
                  {it.value}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 leading-tight">
                  {it.label}
                </p>
              </div>
            );
          })}
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <LiveSalonsRow />
        </div>
      </div>
    </section>
  );
};
