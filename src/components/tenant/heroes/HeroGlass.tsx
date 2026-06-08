import { motion } from "framer-motion";
import { Sparkles, MapPin } from "lucide-react";
import { HeroCTA, HeroStats, useHeroStats, EASE_OUT, formatFollowers } from "./_shared";

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
  city?: string | null;
}

interface HeroGlassProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroGlass({ tenant, onBookNow }: HeroGlassProps) {
  const { rating, since, followers } = useHeroStats(tenant.id);

  const heroImages = (tenant.hero_images as string[] | null) || [];
  const mainImage = heroImages[0] || tenant.hero_image_url;
  const mosaicImages = heroImages.slice(1, 4);
  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";
  const accent = tenant.primary_color || "#8B5CF6";

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950">
      {/* ─── Background — main image with cinematic gradient ─── */}
      <div className="absolute inset-0">
        {mainImage ? (
          <motion.img
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: EASE_OUT }}
            src={mainImage}
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 90% at 30% 0%, ${accent} 0%, color-mix(in oklab, ${accent}, #000 35%) 70%, #0a0a0a 100%)`,
            }}
          />
        )}
        {/* Layered gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/40" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(50% 60% at 20% 30%, ${accent}55, transparent 70%)`,
          }}
        />
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/3 -left-1/4 w-[55%] h-[55%] rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: accent }}
        />
        <motion.div
          animate={{ x: [0, -35, 0], y: [0, 25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-1/3 -right-1/4 w-[50%] h-[50%] rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "white" }}
        />
      </div>

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ─── Main split layout ─── */}
      <main className="relative z-10 min-h-screen grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-14 px-5 sm:px-8 lg:px-16 py-16 lg:py-0 items-center">
        {/* LEFT — Glass card with all info */}
        <motion.div
          initial={{ opacity: 0, x: -28, y: 14 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.95, ease: EASE_OUT }}
          className="w-full max-w-xl mx-auto lg:mx-0 relative"
        >
          <div
            className="relative p-7 sm:p-9 lg:p-10 rounded-[32px] overflow-hidden"
            style={{
              background: "linear-gradient(155deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))",
              backdropFilter: "blur(36px) saturate(180%)",
              WebkitBackdropFilter: "blur(36px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.24)",
              boxShadow:
                "0 40px 80px -28px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.22), inset 0 0 0 1px rgba(255,255,255,.05)",
            }}
          >
            {/* Top sheen */}
            <div
              className="absolute inset-x-0 top-0 h-40 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(255,255,255,.16), transparent)" }}
            />

            {/* Sparkle badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.5, type: "spring", bounce: 0.4 }}
              className="absolute -top-3.5 -right-3.5"
            >
              <div className="p-2.5 rounded-full bg-white/22 backdrop-blur-md border border-white/40 shadow-xl">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </motion.div>

            {/* Header row: logo + open dot */}
            <div className="flex items-center justify-between mb-6">
              {tenant.logo_url && tenant.show_logo_on_landing !== false ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT }}
                  className="w-[68px] h-[68px] rounded-2xl bg-white/22 backdrop-blur-md border border-white/35 p-2 shadow-lg"
                >
                  <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-contain" />
                </motion.div>
              ) : (
                <div />
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 border border-white/20 backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-bold tracking-wide text-white uppercase">Abierto</span>
              </motion.div>
            </div>

            {/* Editorial title */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.35, ease: EASE_OUT }}
            >
              <div
                className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[0.22em] uppercase mb-3 text-white/70"
              >
                <span className="inline-block w-5 h-px bg-white/60" />
                Reserva online
              </div>
              <h1
                className="font-editorial text-white mb-4 tracking-[-0.025em] drop-shadow-[0_6px_30px_rgba(0,0,0,.4)]"
                style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", lineHeight: 1.02 }}
              >
                {tenant.name}
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: EASE_OUT }}
              className="text-[15px] md:text-base text-white/82 mb-7 leading-relaxed font-body max-w-md"
            >
              {displayTagline}
            </motion.p>

            {/* Quick info grid */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
              className="grid grid-cols-3 gap-3 mb-7 pb-7 border-b border-white/15"
            >
              <div>
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/55 mb-1">Comunidad</div>
                <div className="text-xl font-editorial text-white tabular-nums">{formatFollowers(followers)}</div>
              </div>
              {rating > 0 ? (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/55 mb-1">Valoración</div>
                  <div className="text-xl font-editorial text-white tabular-nums">{rating}<span className="text-sm text-white/55 ml-0.5">/5</span></div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/55 mb-1">Disponible</div>
                  <div className="text-xl font-editorial text-white">Hoy</div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/55 mb-1">Desde</div>
                <div className="text-xl font-editorial text-white tabular-nums">{since}</div>
              </div>
            </motion.div>

            {/* Location */}
            {tenant.city && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center gap-2 text-white/65 text-sm mb-6 font-body"
              >
                <MapPin className="w-4 h-4" strokeWidth={2} />
                <span>{tenant.city}</span>
              </motion.div>
            )}

            {/* CTA */}
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

        {/* RIGHT — Mosaic of secondary images (desktop only) */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE_OUT }}
          className="hidden lg:grid grid-cols-2 gap-4 max-w-md"
        >
          {/* Tall image */}
          {(mosaicImages[0] || mainImage) && (
            <div className="row-span-2 rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-[3/5]">
              <img
                src={mosaicImages[0] || mainImage!}
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          )}
          {/* Square images */}
          {[mosaicImages[1] || mainImage, mosaicImages[2] || mainImage].map(
            (img, i) =>
              img && (
                <div
                  key={i}
                  className="rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-square"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ),
          )}
        </motion.div>
      </main>
    </div>
  );
}
