import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MapPin, Star, Sparkles, Award, CheckCircle2 } from "lucide-react";
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
  address?: string | null;
  city?: string | null;
}

interface HeroSplitProps {
  tenant: Tenant;
  onBookNow: () => void;
}

/**
 * Hero Dividido / Studio Editorial:
 * Composición inspirada en editoriales de moda y revistas de arquitectura.
 * Fotografía a sangre continua de fondo con una doble capa editorial:
 * panel de marca y reserva a la izquierda, y tarjetas flotantes de acreditación
 * y excelencia a la derecha. Cero pantallas negras vacías.
 */
export function HeroSplit({ tenant, onBookNow }: HeroSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.07]);

  const { rating, reviewCount } = useHeroStats(tenant.id);
  const t = useT();

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;
  const tagline = tenant.tagline || tenant.description || t("hero.defaultTagline");
  const accent = tenant.primary_color || "#22408C";
  const secondary = tenant.secondary_color || "#98329A";
  const location = [tenant.city, tenant.address].filter(Boolean).join(" · ");

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden h-[60vh] min-h-[420px] lg:h-[86vh] bg-neutral-950 flex flex-col justify-end"
    >
      {/* Fondo fotográfico completo a sangre (la estrella siempre es el salón) */}
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        {heroImage ? (
          <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${accent}40 0%, #0a0a14 100%)`,
            }}
          />
        )}
      </motion.div>

      {/* Scrim superior para contraste de la cabecera fija */}
      <div
        className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,12,22,0.7) 0%, rgba(10,12,22,0.2) 60%, transparent 100%)",
        }}
      />

      {/* Gradiente lateral e inferior cinematográfico */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,12,22,0.85) 0%, rgba(10,12,22,0.55) 45%, rgba(10,12,22,0.25) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,12,22,0.9) 0%, transparent 100%)",
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Layout Dividido Editorial sobre la foto */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 pb-16 lg:pb-14 pt-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 xl:gap-12">
          
          {/* LADO IZQUIERDO: Tarjeta Studio Principal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: EASE_OUT }}
            className="w-full lg:max-w-xl"
          >
            {/* Kicker editorial */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold tracking-wider uppercase mb-3.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
              <span>{tenant.city ? `Studio ${tenant.city}` : "Studio Editorial"}</span>
              <span className="text-white/30">/</span>
              <span className="text-white/70 font-light">Colección 2026</span>
            </div>

            <h1
              className="font-heading font-bold text-white tracking-[-0.03em] leading-[1.02]"
              style={{
                fontSize: "clamp(2.4rem, 5.5vw, 4.4rem)",
                textShadow: "0 8px 30px rgba(0,0,0,0.5)",
              }}
            >
              {tenant.name}
            </h1>

            <p className="mt-3 text-white/80 font-body text-base md:text-lg leading-relaxed max-w-lg line-clamp-2">
              {tagline}
            </p>

            {location && (
              <div className="mt-3 flex items-center gap-2 text-sm text-white/70 font-body">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                <span className="truncate">{location}</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <HeroCTA
                tenantId={tenant.id}
                onBookNow={onBookNow}
                primaryColor={accent}
                label={t("hero.bookNow")}
                iconStyle="arrow"
                variant="solid"
                showFollow={false}
              />
              {rating > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-body">
                  <Star className="w-4 h-4" style={{ color: "#e0a35f", fill: "#e0a35f" }} />
                  <span className="tabular-nums font-bold text-sm">{rating.toLocaleString("es-ES")}</span>
                  {reviewCount > 0 && (
                    <span className="text-white/60">· {reviewCount} reseñas</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* LADO DERECHO: Tarjetas Flotantes de Acreditación y Excelencia (Desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT }}
            className="hidden lg:flex flex-col gap-3.5 w-72 shrink-0"
          >
            {/* Tarjeta 1: Sello de Calidad & Estilismo */}
            <div className="p-4 rounded-2xl bg-white/12 backdrop-blur-xl border border-white/20 shadow-2xl text-white">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <p className="text-[11px] font-bold tracking-wide uppercase text-white/90">Estilismo Profesional</p>
                  <p className="text-[10px] text-white/60">Técnicas de vanguardia</p>
                </div>
              </div>
              <p className="text-[11.5px] text-white/75 font-body leading-snug">
                Atención individualizada y productos de primera línea para tu cabello.
              </p>
            </div>

            {/* Tarjeta 2: Citas sin esperas */}
            <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/15 shadow-xl text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-white truncate">Reserva Online 24/7</p>
                <p className="text-[10px] text-white/60 truncate">Confirmación inmediata al móvil</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
