import { motion } from "framer-motion";
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

interface HeroMinimalProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroMinimal({ tenant, onBookNow }: HeroMinimalProps) {
  const { rating, since, followers } = useHeroStats(tenant.id);
  const displayTagline = tenant.tagline || tenant.description;
  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;
  const showLogo = tenant.logo_url && tenant.show_logo_on_landing !== false;

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden bg-neutral-950">
      {/* Background — deep dark image with subtle gradient veil */}
      {heroImage ? (
        <div className="absolute inset-0">
          <motion.img
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE_OUT }}
            src={heroImage}
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
          {/* Cinematic gradient — dark at edges, soft accent glow in center-top */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(0,0,0,0.55),rgba(0,0,0,0.92)_70%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(100% 80% at 30% 0%, ${tenant.primary_color || "#4361ee"}35, color-mix(in oklab, ${tenant.primary_color || "#4361ee"}, #050505 65%) 70%, #070707 100%)`,
            }}
          />
          <motion.div
            animate={{ y: [0, -22, 0], opacity: [0.38, 0.55, 0.38] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[55%] rounded-full blur-3xl"
            style={{ backgroundColor: `${tenant.primary_color || "#4361ee"}55` }}
          />
        </div>
      )}

      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-20">
        <div className="text-center max-w-2xl">
          {showLogo && (
            <motion.img
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
              src={tenant.logo_url!}
              alt={tenant.name}
              className="w-16 h-16 md:w-[72px] md:h-[72px] object-contain mx-auto mb-10 rounded-2xl"
            />
          )}

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}
            className="font-heading font-light tracking-[-0.04em] text-white mb-6"
            style={{ fontSize: "clamp(2.6rem, 6.5vw, 4.5rem)", lineHeight: 1.02 }}
          >
            {tenant.name}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.45, ease: EASE_OUT }}
            className="w-14 h-px bg-white/35 mx-auto mb-7 origin-center"
          />

          {displayTagline && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT }}
              className="text-base md:text-lg text-white/65 font-body font-light leading-relaxed mb-7 max-w-md mx-auto tracking-[-0.005em]"
            >
              {displayTagline}
            </motion.p>
          )}

          <HeroStats
            followers={followers}
            rating={rating}
            since={since}
            variant="subtle"
            size="sm"
            delay={0.55}
            className="mb-10"
          />

          <HeroCTA
            tenantId={tenant.id}
            onBookNow={onBookNow}
            primaryColor={tenant.primary_color}
            label="Reservar"
            iconStyle="arrow"
            variant="white"
            className="justify-center"
          />
        </div>
      </div>
    </div>
  );
}
