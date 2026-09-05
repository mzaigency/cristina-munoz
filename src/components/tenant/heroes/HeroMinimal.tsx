import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";
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

interface HeroMinimalProps {
  tenant: Tenant;
  onBookNow: () => void;
}

/**
 * Hero Minimalista / Luxury Boutique:
 * Composición simétrica centrada de alta gama. Viñeteado radial suave,
 * tipografía cuidada con tracking editorial, badge de estrellas y botón centrado.
 * Medidas canónicas: h-[60vh] min-h-[420px] lg:h-[86vh] con pb-16 lg:pb-14.
 */
export function HeroMinimal({ tenant, onBookNow }: HeroMinimalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.07]);

  const { rating } = useHeroStats(tenant.id);
  const t = useT();

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;
  const tagline = tenant.tagline || tenant.description || t("hero.defaultTagline");
  const accent = tenant.primary_color || "#18181B";
  const showLogo = tenant.logo_url && tenant.show_logo_on_landing !== false;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden h-[60vh] min-h-[420px] lg:h-[86vh] bg-neutral-950"
    >
      {/* Imagen de fondo con parallax */}
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        {heroImage ? (
          <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(100% 80% at 50% 20%, ${accent}40 0%, #0a0a0f 80%)`,
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

      {/* Viñeteado radial profundo de boutique de lujo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,12,20,0.35) 0%, rgba(10,12,20,0.72) 65%, rgba(10,12,20,0.92) 100%)",
        }}
      />

      {/* Gradiente inferior para paso suave al trust strip */}
      <div
        className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,12,22,0.85) 0%, rgba(10,12,22,0.3) 60%, transparent 100%)",
        }}
      />

      {/* Grain sutil */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Contenido centrado verticalmente con balance óptico */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-6 lg:px-12 pt-16 pb-12">
        <div className="mx-auto max-w-2xl flex flex-col items-center">
          {showLogo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
              className="mb-4"
            >
              <img
                src={tenant.logo_url!}
                alt={tenant.name}
                className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-full bg-white/10 backdrop-blur-md p-1.5 border border-white/25 shadow-xl"
              />
            </motion.div>
          )}

          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-body mb-3.5 shadow-sm"
            >
              <Star className="h-3.5 w-3.5" style={{ color: "#e0a35f", fill: "#e0a35f" }} />
              <span className="tabular-nums font-semibold">{rating.toLocaleString("es-ES")}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/80 font-light">{tenant.city || t("hero.bookOnline")}</span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}
            className="font-heading text-white font-normal tracking-[0.01em]"
            style={{
              fontSize: "clamp(2.3rem, 7.5vw, 4.6rem)",
              lineHeight: 1.05,
              textShadow: "0 8px 32px rgba(0,0,0,0.55)",
            }}
          >
            {tenant.name}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.38, ease: EASE_OUT }}
            className="w-12 h-px bg-white/35 my-3.5 origin-center"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42, ease: EASE_OUT }}
            className="text-white/80 font-body font-light text-sm sm:text-base md:text-lg leading-relaxed max-w-md line-clamp-2"
          >
            {tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.52, ease: EASE_OUT }}
            className="mt-6"
          >
            <HeroCTA
              tenantId={tenant.id}
              onBookNow={onBookNow}
              primaryColor={accent}
              label={t("hero.bookNow")}
              iconStyle="arrow"
              variant="white"
              showFollow={false}
              className="justify-center"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
