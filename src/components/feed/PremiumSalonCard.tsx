import { Link } from "react-router-dom";
import { MapPin, Star, Heart, Sparkles, Zap, Navigation } from "lucide-react";
import { motion } from "motion/react";
import { useFavorites } from "@/hooks/useFavorites";
import { useFollows } from "@/hooks/useFollows";
import { cn } from "@/lib/utils";
import { supabaseImage } from "@/lib/supabaseImage";
import { RecommendationBadge } from "./RecommendationBadge";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group h-full flex flex-col"
    >
      <Link to={`/${salon.slug}`} className="block h-full flex flex-col flex-1">
        <div className="relative overflow-hidden rounded-[20px] bg-white dark:bg-[#1A1A24] border border-line/80 dark:border-white/10 shadow-[0_2px_10px_-2px_rgba(19,21,32,0.06),0_12px_24px_-10px_rgba(19,21,32,0.08)] transition-all duration-300 group-hover:shadow-[0_4px_18px_-2px_rgba(19,21,32,0.12),0_20px_32px_-12px_rgba(19,21,32,0.12)] group-hover:-translate-y-1 h-full flex flex-col justify-between">

          {/* Image Container — strictly fixed height */}
          <div className={cn("relative overflow-hidden shrink-0", isFeatured ? "h-56 sm:h-64" : "h-44")}>
            {salon.hero_image_url ? (
              index === 0 ? (
                <img
                  src={supabaseImage(salon.hero_image_url, { width: 800 })}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  {...{ fetchpriority: "high" }}
                  decoding="async"
                />
              ) : (
                <motion.img
                  src={supabaseImage(salon.hero_image_url, { width: 800 })}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  initial={{ scale: 1.03 }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              )
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              {hasHighRecommendation && !hasAvailabilityToday && !isPopular && !isNew && (
                <RecommendationBadge score={recommendationScore!} compact />
              )}
              {hasAvailabilityToday && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.06 + 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
                >
                  <Zap className="h-3 w-3" />
                  <span>Huecos hoy</span>
                </motion.div>
              )}
              {isPopular && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.06 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Popular</span>
                </motion.div>
              )}
              {isNew && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.06 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
                >
                  Nuevo
                </motion.div>
              )}
            </div>

            {/* Favorite Button — glassmorphic */}
            <motion.button
              whileTap={{ scale: 0.84 }}
              onClick={handleFavoriteClick}
              aria-label={isFav ? `Quitar ${salon.name} de favoritos` : `Añadir ${salon.name} a favoritos`}
              className={cn(
                "absolute top-2.5 right-2.5 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300",
                isFav
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/40"
                  : "bg-black/35 backdrop-blur-md text-white hover:bg-black/50 border border-white/25"
              )}
            >
              <motion.div animate={{ scale: isFav ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.25 }}>
                <Heart className={cn("h-4.5 w-4.5 transition-all duration-200", isFav && "fill-current")} />
              </motion.div>
            </motion.button>

            {/* Rating Badge — glass */}
            {salon.avgRating !== null && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-black/75 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/10">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-foreground">{salon.avgRating.toFixed(1)}</span>
                <span className="text-[10px] font-medium text-muted-foreground">({salon.reviewCount})</span>
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
