import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { HeroCTA, HeroStats, useHeroStats, EASE_OUT } from "./_shared";

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

  const { rating, since, followers } = useHeroStats(tenant.id);

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";
  const accent = tenant.primary_color || "#8B5CF6";
  const secondary = tenant.secondary_color || "#D946EF";

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background with parallax */}
      <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        {heroImage ? (
          <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)` }}
          />
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

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
          className="inline-flex items-center gap-2 mb-5 text-[10.5px] font-bold tracking-[0.22em] uppercase text-white/65"
        >
          <span className="inline-block w-5 h-px bg-white/55" />
          Belleza & Bienestar
          <span className="inline-block w-5 h-px bg-white/55" />
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.32, ease: EASE_OUT }}
          className="font-heading font-bold text-white mb-5 tracking-[-0.03em]"
          style={{
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            lineHeight: 0.98,
            textShadow: "0 8px 40px rgba(0,0,0,.45)",
          }}
        >
          {tenant.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT }}
          className="text-lg md:text-xl text-white/85 mb-8 max-w-lg font-body font-light leading-relaxed"
        >
          {displayTagline}
        </motion.p>

        <HeroStats
          followers={followers}
          rating={rating}
          since={since}
          variant="glass"
          delay={0.6}
          className="mb-9"
        />

        <HeroCTA
          tenantId={tenant.id}
          onBookNow={onBookNow}
          primaryColor={accent}
          label="Reservar cita"
          iconStyle="arrow"
          variant="white"
          className="justify-center"
        />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ opacity }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white/55 text-[10px] font-bold tracking-[0.22em] uppercase">Descubre más</span>
          <ChevronDown className="w-5 h-5 text-white/55" strokeWidth={2.2} />
        </motion.div>
      </motion.div>
    </div>
  );
}
