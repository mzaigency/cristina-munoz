import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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
}

interface HeroImmersiveProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroImmersive({ tenant, onBookNow }: HeroImmersiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "32%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const { rating } = useHeroStats(tenant.id);

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  const t = useT();
  const displayTagline = tenant.tagline || tenant.description || t("hero.defaultTagline");
  const accent = tenant.primary_color || "#8B5CF6";
  const secondary = tenant.secondary_color || "#D946EF";

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background with parallax */}
      <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        {heroImage ? (
          <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <>
            <div
              className="w-full h-full"
              style={{
                background: `radial-gradient(120% 100% at 10% 0%, ${accent} 0%, ${secondary} 50%, color-mix(in oklab, ${accent}, #000 28%) 100%)`,
              }}
            />
            {/* Depth orbs for no-image state */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ y: [0, -32, 0], x: [0, 20, 0] }}
                transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-32 -right-20 w-[520px] h-[520px] rounded-full blur-3xl opacity-40"
                style={{ backgroundColor: "white" }}
              />
              <motion.div
                animate={{ y: [0, 30, 0], x: [0, -16, 0] }}
                transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                className="absolute -bottom-40 -left-20 w-[440px] h-[440px] rounded-full blur-3xl opacity-30"
                style={{ backgroundColor: secondary }}
              />
            </div>
          </>
        )}

        {/* Layered gradients — cinematic feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/85" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(80% 50% at 50% 35%, ${accent}33, transparent 70%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
      </motion.div>

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center will-change-transform"
      >
        {tenant.show_logo_on_landing && tenant.logo_url && (
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE_OUT }}
            src={tenant.logo_url}
            alt={`${tenant.name} logo`}
            className="w-20 h-20 md:w-[88px] md:h-[88px] object-contain mb-7 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-2 shadow-2xl"
          />
        )}

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease: EASE_OUT }}
          className="tv-hero-title font-heading text-white mb-5"
          style={{
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            lineHeight: 1.02,
            textShadow: "0 8px 40px rgba(0,0,0,.45)",
          }}
        >
          {tenant.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: EASE_OUT }}
          className="text-lg md:text-xl text-white/85 mb-4 max-w-lg font-body font-light leading-relaxed"
        >
          {displayTagline}
        </motion.p>

        {/* Prueba social en prosa, no en píldoras de métricas */}
        {rating > 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6, ease: EASE_OUT }}
            className="mb-9 text-[14px] font-body text-white/75 tabular-nums"
          >
            ★ {rating.toLocaleString("es-ES")}
          </motion.p>
        ) : (
          <span className="mb-9" />
        )}

        <HeroCTA
          tenantId={tenant.id}
          onBookNow={onBookNow}
          primaryColor={accent}
          label={t("hero.bookNow")}
          iconStyle="arrow"
          variant="white"
          className="justify-center"
        />
      </motion.div>

      {/* Cue de scroll: línea fina que respira, sin rótulo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ opacity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        aria-hidden
      >
        <motion.span
          animate={{ scaleY: [1, 0.35, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-9 bg-white/45 origin-top"
        />
      </motion.div>
    </div>
  );
}
