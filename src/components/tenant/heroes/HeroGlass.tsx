import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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
}

interface HeroGlassProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroGlass({ tenant, onBookNow }: HeroGlassProps) {
  const { rating, since, followers } = useHeroStats(tenant.id);

  const heroImages = tenant.hero_images as string[] | null;
  const mainImage = heroImages?.[0] || tenant.hero_image_url;
  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";
  const accent = tenant.primary_color || "#8B5CF6";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      {mainImage ? (
        <div className="absolute inset-0">
          <motion.img
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: EASE_OUT }}
            src={mainImage}
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/55" />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 0%, ${accent} 0%, color-mix(in oklab, ${accent}, #000 25%) 70%, #1a1a1f 100%)`,
          }}
        />
      )}

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -24, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/3 -left-1/4 w-[55%] h-[55%] rounded-full blur-3xl opacity-40"
          style={{ backgroundColor: accent }}
        />
        <motion.div
          animate={{ x: [0, -35, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute -bottom-1/3 -right-1/4 w-[50%] h-[50%] rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: accent }}
        />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: EASE_OUT }}
          className="w-full max-w-md relative"
        >
          {/* Glass card — refined refraction */}
          <div
            className="relative p-8 md:p-9 rounded-[28px] overflow-hidden"
            style={{
              background: "linear-gradient(155deg, rgba(255,255,255,0.18), rgba(255,255,255,0.07))",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.28)",
              boxShadow:
                "0 32px 64px -22px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.18), inset 0 0 0 1px rgba(255,255,255,.04)",
            }}
          >
            {/* Top sheen */}
            <div
              className="absolute inset-x-0 top-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(255,255,255,.18), transparent)" }}
            />

            {/* Sparkle badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.35 }}
              className="absolute -top-3 -right-3"
            >
              <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/35 shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </motion.div>

            {tenant.logo_url && tenant.show_logo_on_landing !== false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
                className="flex justify-center mb-6"
              >
                <div className="w-[88px] h-[88px] rounded-2xl bg-white/22 backdrop-blur-md border border-white/35 p-3 shadow-lg">
                  <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-contain" />
                </div>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT }}
              className="font-heading font-bold text-white text-center mb-3 drop-shadow-[0_4px_24px_rgba(0,0,0,.4)] tracking-tight"
              style={{ fontSize: "clamp(1.85rem, 5vw, 2.5rem)", lineHeight: 1.08 }}
            >
              {tenant.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT }}
              className="text-sm md:text-base text-white/85 text-center mb-6 leading-relaxed font-body"
            >
              {displayTagline}
            </motion.p>

            <HeroStats
              followers={followers}
              rating={rating}
              since={since}
              variant="glass"
              size="sm"
              delay={0.5}
              className="mb-7"
            />

            <HeroCTA
              tenantId={tenant.id}
              onBookNow={onBookNow}
              primaryColor={tenant.primary_color}
              label="Reservar cita"
              iconStyle="arrow"
              variant="white"
              layout="stack"
              className="items-stretch"
            />
          </div>
        </motion.div>

        {/* Bouncing dots indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
              className="w-1.5 h-1.5 rounded-full bg-white/65"
            />
          ))}
        </motion.div>
      </main>
    </div>
  );
}
