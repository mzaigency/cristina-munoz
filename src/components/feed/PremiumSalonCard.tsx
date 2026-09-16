import { Link } from "react-router-dom";
import { MapPin, Star, Heart, Sparkles, Zap, Navigation } from "lucide-react";
import { motion } from "motion/react";
import { useFavorites } from "@/hooks/useFavorites";
import { useFollows } from "@/hooks/useFollows";
import { cn } from "@/lib/utils";
import { supabaseImage } from "@/lib/supabaseImage";

interface PremiumSalonCardProps {
  salon: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    hero_image_url?: string | null;
    primary_color: string | null;
    city: string | null;
    tagline: string | null;
    avgRating: number | null;
    reviewCount: number;
    average_price?: number | null;
  };
  index: number;
  distance?: string | null;
  hasAvailabilityToday?: boolean;
  recommendationScore?: number;
  matchReasons?: string[];
  /** "default" para carruseles, "featured" para grid vertical principal */
  variant?: "default" | "featured";
}

export function PremiumSalonCard({
  salon,
  index,
  distance,
  hasAvailabilityToday = false,
  recommendationScore,
  matchReasons,
  variant = "default",
}: PremiumSalonCardProps) {
  const isFeatured = variant === "featured";
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isFollowing } = useFollows();
  const isFav = isFavorite(salon.id);
  const following = isFollowing(salon.id);
  const primaryColor = salon.primary_color || "#6366f1";
  const initials = salon.name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
  const isPopular = salon.reviewCount > 10;
  const isNew = salon.reviewCount === 0;
  const hasHighRecommendation = recommendationScore !== undefined && recommendationScore >= 40;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(salon.id);
  };

  // Máximo dos etiquetas, mismo lenguaje visual; el degradado de marca es el único acento
  const tags = [
    hasAvailabilityToday
      ? { label: "Huecos hoy", icon: Zap, accent: true }
      : null,
    hasHighRecommendation && !hasAvailabilityToday
      ? { label: "Para ti", icon: Sparkles, accent: true }
      : null,
    isNew ? { label: "Nuevo", icon: undefined, accent: false } : null,
    isPopular ? { label: "Popular", icon: Sparkles, accent: false } : null,
  ]
    .filter((t): t is { label: string; icon?: typeof Zap; accent: boolean } => Boolean(t))
    .slice(0, 2);


  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className="group h-full flex flex-col"
    >
      <Link to={`/${salon.slug}`} className="block h-full flex flex-col flex-1">
        <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-[#1A1A24] border border-line/70 dark:border-white/10 shadow-[0_1px_2px_rgba(19,21,32,0.04),0_10px_26px_-14px_rgba(19,21,32,0.14)] transition-[transform,box-shadow,border-color] duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1.5 group-hover:border-[var(--glow-brand)]/25 group-hover:shadow-[0_2px_4px_rgba(19,21,32,0.05),0_26px_48px_-22px_rgba(34,64,140,0.32)] h-full flex flex-col justify-between">

          {/* Image Container — strictly fixed height */}
          <div className={cn("relative overflow-hidden shrink-0", isFeatured ? "h-56 sm:h-64" : "h-44 md:h-48")}>
            {salon.hero_image_url ? (
              <img
                src={supabaseImage(salon.hero_image_url, { width: 800 })}
                alt={salon.name}
                className="w-full h-full object-cover transition-transform duration-[900ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]"
                loading={index === 0 ? "eager" : "lazy"}
                {...(index === 0 ? { fetchpriority: "high" as const } : {})}
                decoding="async"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}88)` }}
              >
                {salon.logo_url ? (
                  <img src={salon.logo_url} alt={salon.name} className="h-20 w-20 object-contain rounded-2xl bg-white/95 p-3 shadow-xl" />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl border border-white/20">
                    {initials}
                  </div>
                )}
              </div>
            )}
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#131520]/55 via-[#131520]/5 to-transparent" />

            {/* Etiquetas — un único lenguaje visual */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.label}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-tight shadow-[0_2px_8px_-2px_rgba(19,21,32,0.25)]",
                    tag.accent
                      ? "bg-[linear-gradient(100deg,var(--glow-brand),#98329A)] text-white"
                      : "bg-white/92 backdrop-blur-md text-[#131520] border border-white/60",
                  )}
                >
                  {tag.icon ? (
                    <tag.icon
                      className={cn("h-3 w-3", tag.accent ? "text-white" : "text-[var(--glow-brand)]")}
                      strokeWidth={2.4}
                    />
                  ) : null}
                  <span>{tag.label}</span>
                </span>
              ))}
            </div>

            {/* Favorito */}
            <motion.button
              whileTap={{ scale: 0.86 }}
              onClick={handleFavoriteClick}
              aria-label={isFav ? `Quitar ${salon.name} de favoritos` : `Añadir ${salon.name} a favoritos`}
              className={cn(
                "absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 border",
                isFav
                  ? "bg-white text-rose-500 border-white shadow-[0_2px_10px_-2px_rgba(19,21,32,0.3)]"
                  : "bg-white/25 backdrop-blur-md text-white border-white/45 hover:bg-white/40",
              )}
            >
              <motion.div animate={{ scale: isFav ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.25 }}>
                <Heart className={cn("h-4 w-4 transition-all duration-200", isFav && "fill-current")} />
              </motion.div>
            </motion.button>

            {/* Valoración */}
            {salon.avgRating !== null && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/92 backdrop-blur-md border border-white/60 shadow-[0_2px_8px_-2px_rgba(19,21,32,0.25)]">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-[#131520]">{salon.avgRating.toFixed(1)}</span>
                <span className="text-[10px] font-medium text-[#131520]/55">({salon.reviewCount})</span>
              </div>
            )}
          </div>

          {/* Content Container — strictly uniform slot heights */}
          <div className="p-3.5 flex flex-col justify-between flex-1">
            <div>
              {/* 1. Name & Price */}
              <div className="flex items-center justify-between gap-2 h-6">
                <h3 className="font-bold text-foreground text-[16px] leading-tight truncate group-hover:text-[var(--glow-brand)] transition-colors duration-200">
                  {salon.name}
                </h3>
                {salon.average_price ? (
                  <span className="shrink-0 text-[11px] font-extrabold text-[var(--glow-brand-ink)] bg-[var(--glow-brand-soft)] px-2 py-0.5 rounded-md leading-none">
                    Desde {salon.average_price}€
                  </span>
                ) : null}
              </div>

              {/* 2. Tagline — fixed 32px height */}
              <div className="h-8 mt-1.5 flex items-start overflow-hidden">
                {salon.tagline ? (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                    {salon.tagline}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/40 italic line-clamp-1">
                    Espacio de belleza profesional
                  </p>
                )}
              </div>

              {/* 3. Badges / Match Reasons / Lo sigues — fixed 22px height */}
              <div className="h-5.5 mt-2 flex items-center gap-1.5 overflow-hidden">
                {following && (
                  <span className="text-[10px] font-bold text-[var(--glow-brand-ink)] bg-[var(--glow-brand-soft)] px-2 py-0.5 rounded-full shrink-0">
                    Lo sigues
                  </span>
                )}
                {matchReasons && matchReasons.length > 0 ? (
                  matchReasons
                    .filter((r) => r !== "Lo sigues" || !following)
                    .slice(0, following ? 1 : 2)
                    .map((reason, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold text-[var(--glow-brand-ink)] bg-[var(--glow-brand-soft)] px-2 py-0.5 rounded-full shrink-0 truncate max-w-[130px]"
                      >
                        {reason}
                      </span>
                    ))
                ) : !following ? (
                  <span className="text-[10px] font-medium text-muted-foreground bg-surface-container px-2 py-0.5 rounded-full shrink-0">
                    Verificado
                  </span>
                ) : null}
              </div>
            </div>

            {/* 4. Bottom Divider & Location Row */}
            <div className="pt-2.5 mt-2.5 border-t border-line/60 flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-3 truncate">
                {distance && (
                  <div className="flex items-center gap-1 text-[var(--glow-brand)] shrink-0 font-bold">
                    <Navigation className="h-3 w-3" />
                    <span>{distance}</span>
                  </div>
                )}
                {salon.city && (
                  <div className="flex items-center gap-1 text-muted-foreground truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-medium">{salon.city}</span>
                  </div>
                )}
                {!distance && !salon.city && (
                  <div className="flex items-center gap-1 text-muted-foreground truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-medium">Ubicación disponible</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
