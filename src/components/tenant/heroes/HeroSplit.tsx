import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
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
  address?: string | null;
  city?: string | null;
}

interface HeroSplitProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroSplit({ tenant, onBookNow }: HeroSplitProps) {
  const { rating, since, followers } = useHeroStats(tenant.id, { withClients: true });

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";
  const location = [tenant.city, tenant.address].filter(Boolean).join(" · ");
  const accent = tenant.primary_color || "#0EA5E9";
  const secondary = tenant.secondary_color || "#06B6D4";

  return (
    <>
      {/* ─── Mobile: bottom-aligned immersive hero ─── */}
      <div className="lg:hidden min-h-screen relative overflow-hidden bg-black">
        {heroImage ? (
          <>
            <motion.img
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.6, ease: EASE_OUT }}
              src={heroImage}
              alt={tenant.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(165deg, ${accent} 0%, ${secondary} 100%)` }}
          />
        )}

        <div className="relative z-10 min-h-screen flex flex-col justify-end px-6 pb-14 pt-20">
          {tenant.logo_url && tenant.show_logo_on_landing !== false && (
            <motion.img
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              src={tenant.logo_url}
              alt={tenant.name}
              className="w-14 h-14 object-contain mb-7 rounded-xl shadow-2xl bg-white/15 backdrop-blur-md p-1.5 border border-white/20"
            />
          )}

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
            className="font-heading font-bold text-white mb-3 leading-[1.04] tracking-[-0.025em]"
            style={{ fontSize: "clamp(2.2rem, 9vw, 3rem)" }}
          >
            {tenant.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
            className="text-base text-white/80 font-body mb-5 leading-relaxed max-w-sm"
          >
            {displayTagline}
          </motion.p>

          {location && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-2 text-white/70 mb-6"
            >
              <MapPin className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-sm">{location}</span>
            </motion.div>
          )}

          <HeroStats
            followers={followers}
            rating={rating}
            since={since}
            variant="glass"
            size="sm"
            delay={0.38}
            className="justify-start mb-7"
          />

          <HeroCTA
            tenantId={tenant.id}
            onBookNow={onBookNow}
            primaryColor={accent}
            label="Reservar cita"
            iconStyle="icon"
            variant="solid"
            layout="stack"
            className="items-stretch"
          />
        </div>
      </div>

      {/* ─── Desktop: 60/40 split with diagonal mask ─── */}
      <div className="hidden lg:flex min-h-screen bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          className="w-[58%] h-screen relative overflow-hidden"
        >
          {heroImage ? (
            <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)` }}
            />
          )}

          {/* Subtle dark vignette for text legibility on stats overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />

          {/* Diagonal feather → white panel */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(100deg, transparent 64%, white 100%)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE_OUT }}
            className="absolute bottom-12 left-12"
          >
            <HeroStats
              followers={followers}
              rating={rating}
              since={since}
              variant="glass"
              size="sm"
              delay={0}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.2, ease: EASE_OUT }}
          className="w-[42%] flex flex-col justify-center px-14 xl:px-20 bg-white relative"
        >
          {/* Soft accent halo */}
          <div
            className="absolute -left-32 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-[0.08] pointer-events-none"
            style={{ backgroundColor: accent }}
          />

          <div className="max-w-md relative">
            {tenant.logo_url && tenant.show_logo_on_landing !== false && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-16 h-16 object-contain mb-9 rounded-2xl"
              />
            )}

            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase mb-5"
              style={{ color: accent }}
            >
              <span className="inline-block w-6 h-px" style={{ backgroundColor: accent }} />
              Tu cita te espera
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT }}
              className="font-heading font-bold text-neutral-900 mb-6 leading-[1.04] tracking-[-0.035em]"
              style={{ fontSize: "clamp(2.8rem, 4.5vw, 4rem)" }}
            >
              {tenant.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: EASE_OUT }}
              className="text-lg text-neutral-600 font-body mb-7 leading-relaxed"
            >
              {displayTagline}
            </motion.p>

            {location && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center gap-2 text-neutral-500 mb-9"
              >
                <MapPin className="w-4 h-4" strokeWidth={2.2} />
                <span className="text-sm">{location}</span>
              </motion.div>
            )}

            <HeroCTA
              tenantId={tenant.id}
              onBookNow={onBookNow}
              primaryColor={accent}
              label="Reservar cita"
              iconStyle="arrow"
              variant="solid"
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}
