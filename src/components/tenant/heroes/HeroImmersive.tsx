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

/**
 * Hero firma Glowapp: escenario navy (la tarjeta insignia de marca) con el
 * salón presentado como pieza. El nombre en Playfair con la última palabra en
 * itálica-gradiente del salón; el retrato en marco glass con glow del color
 * del salón; píldora "reserva online" en el gradiente firma azul→púrpura.
 * Una sola plantilla — no depende del tipo de negocio.
 */
export function HeroImmersive({ tenant, onBookNow }: HeroImmersiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "24%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { rating } = useHeroStats(tenant.id);
  const t = useT();

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;
  const displayTagline = tenant.tagline || tenant.description || t("hero.defaultTagline");
  const accent = tenant.primary_color || "#8B5CF6";
  const secondary = tenant.secondary_color || "#D946EF";

  // Última palabra del nombre → itálica-gradiente del salón (el gesto Glowapp)
  const words = tenant.name.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words.pop() : null;
  const leadWords = words.join(" ");

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE_OUT },
  });

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{ background: "var(--tv-navy)" }}
    >
      {/* Glow orbs — color del salón + púrpura Glowapp */}
      <div
        className="tv-orb absolute -top-24 -left-16 w-[60vw] max-w-[520px] aspect-square rounded-full blur-[90px] opacity-45 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 68%)` }}
      />
      <div
        className="tv-orb-2 absolute top-1/3 -right-20 w-[55vw] max-w-[460px] aspect-square rounded-full blur-[100px] opacity-35 pointer-events-none"
        style={{ background: "radial-gradient(circle, #98329a, transparent 68%)" }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 lg:px-10 min-h-[100svh] flex flex-col justify-center gap-9 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 pt-28 pb-14 lg:py-24">
        {/* ── Columna de contenido ── */}
        <motion.div
          style={{ y: contentY, opacity: fade }}
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          {tenant.show_logo_on_landing && tenant.logo_url && (
            <motion.img
              {...reveal(0.05)}
              src={tenant.logo_url}
              alt={`${tenant.name} logo`}
              className="w-16 h-16 object-contain mb-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-1.5 shadow-xl"
            />
          )}

          <motion.span {...reveal(0.12)} className="tv-brand-pill mb-6">
            {t("hero.bookOnline")} · 24/7
          </motion.span>

          <motion.h1
            {...reveal(0.2)}
            className="tv-hero-title font-heading text-white"
            style={{
              fontSize: "clamp(2.9rem, 8.5vw, 5.4rem)",
              lineHeight: 1.02,
              textShadow: "0 10px 44px rgba(0,0,0,.4)",
            }}
          >
            {lastWord ? (
              <>
                {leadWords} <span className="font-editorial-italic">{lastWord}</span>
              </>
            ) : (
              <span className="font-editorial-italic">{tenant.name}</span>
            )}
          </motion.h1>

          <motion.p
            {...reveal(0.32)}
            className="mt-5 max-w-md text-lg md:text-xl text-white/80 font-body font-light leading-relaxed"
          >
            {displayTagline}
          </motion.p>

          {rating > 0 && (
            <motion.p {...reveal(0.4)} className="mt-4 text-[14px] font-body text-white/70 tabular-nums">
              <span style={{ color: secondary }}>★</span> {rating.toLocaleString("es-ES")}
            </motion.p>
          )}

          <HeroCTA
            tenantId={tenant.id}
            onBookNow={onBookNow}
            primaryColor={accent}
            label={t("hero.bookNow")}
            iconStyle="arrow"
            variant="solid"
            className="mt-9 justify-center lg:justify-start"
          />
        </motion.div>

        {/* ── Retrato del salón en marco glass ── */}
        <motion.div style={{ y: photoY, opacity: fade }} className="relative w-full">
          {/* Glow del color del salón detrás del marco */}
          <div
            className="absolute -inset-6 rounded-[2.5rem] blur-3xl opacity-40 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})` }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: EASE_OUT }}
            className="tv-frame w-full aspect-[4/5] sm:aspect-[3/2] lg:aspect-[4/5] lg:h-[70vh]"
          >
            {heroImage ? (
              <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(150deg, ${accent}, ${secondary})` }}
              >
                <span className="font-heading text-white/90 text-7xl">{tenant.name.charAt(0)}</span>
              </div>
            )}
            {/* Realce superior glass */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/12 to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      </div>

      {/* Cue de scroll: línea fina que respira */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        aria-hidden
      >
        <motion.span
          animate={{ scaleY: [1, 0.35, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-9 bg-white/40 origin-top"
        />
      </motion.div>
    </div>
  );
}
