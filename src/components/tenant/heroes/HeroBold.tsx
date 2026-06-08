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
  secondary_color?: string | null;
}

interface HeroBoldProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroBold({ tenant, onBookNow }: HeroBoldProps) {
  const { rating, since, followers } = useHeroStats(tenant.id);

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";
  const primaryColor = tenant.primary_color || "#F97316";
  const secondaryColor = tenant.secondary_color || "#EAB308";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background — vibrant gradient or image with color overlay */}
      <div className="absolute inset-0">
        {heroImage ? (
          <>
            <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(155deg, ${primaryColor}E8 0%, color-mix(in oklab, ${primaryColor}, ${secondaryColor} 50%) 55%, ${secondaryColor}E0 100%)`,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 100% at 10% 0%, ${primaryColor} 0%, ${secondaryColor} 45%, color-mix(in oklab, ${primaryColor}, #000 20%) 100%)`,
            }}
          />
        )}
      </div>

      {/* Soft floating blobs — modern depth, NOT spinning shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -28, 0], x: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[440px] h-[440px] rounded-full blur-3xl opacity-40"
          style={{ backgroundColor: "white" }}
        />
        <motion.div
          animate={{ y: [0, 22, 0], x: [0, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>

      {/* Grain overlay for richness */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
        {tenant.logo_url && tenant.show_logo_on_landing !== false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 blur-xl opacity-40 rounded-3xl bg-white" />
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="relative w-20 h-20 object-contain rounded-2xl bg-white/95 backdrop-blur-sm p-2.5 shadow-2xl"
            />
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
          className="font-heading font-black text-white mb-5 uppercase tracking-[-0.02em] drop-shadow-[0_10px_30px_rgba(0,0,0,.25)]"
          style={{ fontSize: "clamp(2.8rem, 7.5vw, 5.5rem)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
        >
          {tenant.name}
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE_OUT }}
          className="w-24 h-[3px] bg-white/85 rounded-full mb-6 origin-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: EASE_OUT }}
          className="text-lg md:text-xl text-white/95 font-body mb-8 max-w-md mx-auto font-medium leading-snug"
        >
          {displayTagline}
        </motion.p>

        <HeroStats
          followers={followers}
          rating={rating}
          since={since}
          variant="glass"
          delay={0.55}
          className="mb-9"
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
  );
}
