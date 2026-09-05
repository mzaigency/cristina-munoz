import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { HeroCTA, useHeroStats, EASE_OUT } from "./_shared";
import { useT } from "@/lib/tenantI18n";

interface Tenant {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  hero_images?: unknown;
  logo_url?: string | null;
  show_logo_on_landing?: boolean | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  city?: string | null;
}

interface HeroGlassProps {
  tenant: Tenant;
  onBookNow: () => void;
}

/**
 * Hero Cristal Escarchado / Liquid Glass:
 * Fotografía envolvente de alta definición con un dock panorámico de cristal flotante
 * (backdrop-blur-2xl translúcido, bisel de luz superior y refracción prismática).
 * Estilo ultra clean, moderno y de lujo sin cajas opacas ni saturaciones artificiales.
 */
export function HeroGlass({ tenant, onBookNow }: HeroGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const { rating, reviewCount } = useHeroStats(tenant.id);
  const t = useT();

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;
  const tagline = tenant.tagline || tenant.description || t("hero.defaultTagline");
  const accent = tenant.primary_color || "#8B5CF6";
  const secondary = tenant.secondary_color || "#D946EF";

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden h-[60vh] min-h-[420px] lg:h-[86vh] bg-neutral-950 flex flex-col justify-end"
    >
      {/* Fotografía principal nítida con parallax */}
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        {heroImage ? (
          <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(120% 90% at 50% 20%, ${accent}35 0%, #0a0a12 80%)`,
            }}
          />
        )}
      </motion.div>

      {/* Scrim superior para proteger la cabecera fija */}
      <div
        className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,12,22,0.65) 0%, rgba(10,12,22,0.25) 60%, transparent 100%)",
        }}
      />

      {/* Degradado inferior cinematográfico para profundidad */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,12,22,0.88) 0%, rgba(10,12,22,0.3) 45%, transparent 80%)",
        }}
      />

      {/* Refracción luminosa ambiental tras el cristal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -15, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-6 left-1/4 -translate-x-1/2 w-[480px] h-48 rounded-full blur-3xl opacity-25"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${secondary})`,
          }}
        />
      </div>

      {/* Grain sutil */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Contenedor del dock panorámico de cristal */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 pb-16 lg:pb-14 w-full">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE_OUT }}
            className="relative rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 lg:p-8 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%)",
              backdropFilter: "blur(32px) saturate(170%)",
              WebkitBackdropFilter: "blur(32px) saturate(170%)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderTop: "1.5px solid rgba(255,255,255,0.45)",
              boxShadow:
                "0 35px 80px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            {/* Fila superior: Badges de estatus y valoración */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-medium backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-semibold uppercase tracking-wider text-[10px]">Citas abiertas hoy</span>
                {tenant.city && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-white/80">{tenant.city}</span>
                  </>
                )}
              </div>

              {rating > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 border border-white/15 text-white text-xs font-body backdrop-blur-md">
                  <Star className="w-3.5 h-3.5" style={{ color: "#e0a35f", fill: "#e0a35f" }} />
                  <span className="tabular-nums font-semibold">{rating.toLocaleString("es-ES")}</span>
                  {reviewCount > 0 && (
                    <span className="text-white/60 text-[11px]">({reviewCount} opiniones)</span>
                  )}
                </div>
              )}
            </div>

            {/* Fila principal: Título, descripción y CTA en split horizontal */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.15, ease: EASE_OUT }}
                  className="font-heading text-white font-medium tracking-tight leading-[1.03]"
                  style={{
                    fontSize: "clamp(2rem, 5vw, 3.4rem)",
                    textShadow: "0 4px 24px rgba(0,0,0,0.45)",
                  }}
                >
                  {tenant.name}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.25, ease: EASE_OUT }}
                  className="mt-2 text-white/80 font-body text-sm sm:text-base leading-relaxed line-clamp-2"
                >
                  {tagline}
                </motion.p>
              </div>

              {/* Columna derecha de acción */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
                className="flex flex-col items-start lg:items-end gap-2.5 shrink-0"
              >
                <HeroCTA
                  tenantId={tenant.id}
                  onBookNow={onBookNow}
                  primaryColor={accent}
                  label={t("hero.bookNow")}
                  iconStyle="arrow"
                  variant="glass"
                  showFollow={false}
                />
                <div className="flex items-center gap-3 text-[11px] text-white/65 font-body">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Reserva en 1 min
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Sin coste de gestión
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
