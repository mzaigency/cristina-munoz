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
}

interface HeroImmersiveProps {
  tenant: Tenant;
  onBookNow: () => void;
}

/**
 * Hero rectangular: banner de foto (más bajo en móvil, alto en desktop) con
 * el nombre del salón y la valoración anclados abajo a la izquierda, sobre un
 * degradado. Limpio, editorial, sin ocupar toda la pantalla en móvil.
 */
export function HeroImmersive({ tenant, onBookNow }: HeroImmersiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.09]);

  const { rating } = useHeroStats(tenant.id);
  const t = useT();

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;
  const tagline = tenant.tagline || tenant.description || t("hero.defaultTagline");
  const accent = tenant.primary_color || "#8B5CF6";
  const secondary = tenant.secondary_color || "#D946EF";

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden h-[60vh] min-h-[420px] lg:h-[86vh] bg-neutral-900"
    >
      {/* Imagen con leve parallax */}
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        {heroImage ? (
          <img src={heroImage} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(150deg, ${accent}, ${secondary})` }}
          />
        )}
      </motion.div>

      {/* Degradado inferior para legibilidad */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(10,12,22,.85) 0%, rgba(10,12,22,.35) 42%, rgba(10,12,22,.08) 68%, transparent 100%)",
        }}
      />

      {/* Grain sutil */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Contenido abajo-izquierda */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 lg:px-12 pb-16 lg:pb-14">
        <div className="mx-auto max-w-6xl">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE_OUT }}
            className="font-heading text-white"
            style={{
              fontSize: "clamp(2.3rem, 9vw, 5rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              textShadow: "0 8px 40px rgba(0,0,0,.45)",
            }}
          >
            {tenant.name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: EASE_OUT }}
            className="mt-2.5 flex items-center gap-2 text-white/85 font-body text-[15px] md:text-lg"
          >
            {rating > 0 && (
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <Star className="h-4 w-4" style={{ color: "#e0a35f", fill: "#e0a35f" }} />
                <span className="tabular-nums font-medium">{rating.toLocaleString("es-ES")}</span>
                <span className="text-white/50">·</span>
              </span>
            )}
            <span className="line-clamp-2">{tagline}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE_OUT }}
            className="hidden lg:block mt-7"
          >
            <HeroCTA
              tenantId={tenant.id}
              onBookNow={onBookNow}
              primaryColor={accent}
              label={t("hero.bookNow")}
              iconStyle="arrow"
              variant="solid"
              showFollow={false}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
