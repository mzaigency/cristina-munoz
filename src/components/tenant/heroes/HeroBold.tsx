import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star, Sparkles, ArrowRight, Zap, Check } from "lucide-react";
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

interface HeroBoldProps {
  tenant: Tenant;
  onBookNow: () => void;
}

/**
 * Hero Impacto Creativo / Atelier Bold:
 * Enfoque de alta moda y presencia rotunda.
 * Fotografía cristalina de alta definición (SIN filtros de color planos ni tintes turbios)
 * combinada con tipografía display monumental, acentos cromáticos nítidos y badges
 * dinámicos de salón de autor.
 */
export function HeroBold({ tenant, onBookNow }: HeroBoldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.09]);

  const { rating, reviewCount } = useHeroStats(tenant.id);
  const t = useT();

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;
  const tagline = tenant.tagline || tenant.description || t("hero.defaultTagline");
  const primaryColor = tenant.primary_color || "#22408C";
  const secondaryColor = tenant.secondary_color || "#98329A";

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden h-[60vh] min-h-[420px] lg:h-[86vh] bg-neutral-950 flex flex-col justify-end"
    >
      {/* Fotografía nítida y pura (sin tintes opacos que tapen el salón) */}
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        {heroImage ? (
          <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(120% 90% at 50% 20%, ${primaryColor}40 0%, #0a0a14 80%)`,
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

      {/* Degradado inferior profundo para contraste tipográfico perfecto */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,12,22,0.94) 0%, rgba(10,12,22,0.5) 45%, rgba(10,12,22,0.1) 75%, transparent 100%)",
        }}
      />

      {/* Acentos de luz atmosférica sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -bottom-10 left-10 w-96 h-40 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Contenido Display de Alto Impacto */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-12 pb-16 lg:pb-14">
        <div className="max-w-3xl">
          {/* Eyebrow de Atelier */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="flex flex-wrap items-center gap-2 mb-3.5"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 border border-white/25 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{tenant.city || "Salón de Autor"}</span>
            </span>

            {rating > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 border border-white/15 backdrop-blur-md text-white text-[11px] font-body">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="tabular-nums font-semibold">{rating.toLocaleString("es-ES")}</span>
                {reviewCount > 0 && (
                  <span className="text-white/60">({reviewCount})</span>
                )}
              </span>
            )}
          </motion.div>

          {/* Titular Monumental */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
            className="font-heading font-black text-white uppercase tracking-[-0.03em] leading-[0.98]"
            style={{
              fontSize: "clamp(2.6rem, 7.8vw, 5.2rem)",
              textShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
            {tenant.name}
          </motion.h1>

          {/* Barra de acento con gradiente de marca */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE_OUT }}
            className="w-20 h-1.5 rounded-full my-4 origin-left"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: EASE_OUT }}
            className="text-white/85 font-body text-base sm:text-lg md:text-xl font-normal max-w-xl leading-relaxed line-clamp-2"
          >
            {tagline}
          </motion.p>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42, ease: EASE_OUT }}
            className="mt-7 flex flex-wrap items-center gap-4"
          >
            <HeroCTA
              tenantId={tenant.id}
              onBookNow={onBookNow}
              primaryColor={primaryColor}
              label={t("hero.bookNow")}
              iconStyle="arrow"
              variant="solid"
              showFollow={false}
            />
            <div className="flex items-center gap-2 text-xs text-white/70 font-body">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-emerald-400">
                <Check className="w-3 h-3" />
              </span>
              <span>Atención exclusiva sin esperas</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
