import { Link } from "react-router-dom";
import { MapPin, Star, Heart, Clock, Sparkles, Zap, Navigation, UserPlus, UserCheck } from "lucide-react";
import { motion } from "motion/react";
import { useFavorites } from "@/hooks/useFavorites";
import { useFollows } from "@/hooks/useFollows";
import { cn } from "@/lib/utils";
import { supabaseImage } from "@/lib/supabaseImage";
import { useHaptic } from "@/hooks/useHaptic";
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
  /** "default" para carruseles, "featured" para grid vertical principal (imagen más grande) */
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
  const { isFollowing, toggleFollow, isLoading: followLoading } = useFollows();
  const haptic = useHaptic();
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

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic.medium();
    toggleFollow(salon.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link to={`/${salon.slug}`} className="block">
        <div className="relative overflow-hidden liquid-glass-card">
          
          {/* Image Container */}
          <div className={cn("relative overflow-hidden rounded-t-[24px]", isFeatured ? "h-72 sm:h-64" : "h-64")}>
            {salon.hero_image_url ? (
              index === 0 ? (
                <img
                  src={supabaseImage(salon.hero_image_url, { width: 800 })}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <motion.img
                  src={supabaseImage(salon.hero_image_url, { width: 800 })}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  initial={{ scale: 1.05 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              )
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}88)` }}
              >
                {salon.logo_url ? (
                  <img src={salon.logo_url} alt={salon.name} className="h-24 w-24 object-contain rounded-3xl bg-white/95 p-4 shadow-2xl" />
                ) : (
                  <div className="h-24 w-24 rounded-3xl bg-white/15 backdrop-blur-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl border border-white/20">
                    {initials}
                  </div>
                )}
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Primary color bottom glow accent */}
            <div
              className="absolute inset-x-0 bottom-0 h-24 opacity-35"
              style={{ background: `linear-gradient(to top, ${primaryColor}66, transparent)` }}
            />
            
            {/* Badges */}
            <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
              {hasHighRecommendation && !hasAvailabilityToday && !isPopular && !isNew && (
                <RecommendationBadge score={recommendationScore!} compact />
              )}
              {hasAvailabilityToday && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider shadow-lg"
                >
                  <Zap className="h-3 w-3" />
                  Huecos hoy
                </motion.div>
              )}
              {isPopular && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider shadow-lg"
                >
                  <Sparkles className="h-3 w-3" />
                  Popular
                </motion.div>
              )}
              {isNew && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="px-3 py-1.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-lg"
                >
                  Nuevo
                </motion.div>
              )}
            </div>

            {/* Favorite Button — glass */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleFavoriteClick}
              aria-label={isFav ? `Quitar ${salon.name} de favoritos` : `Añadir ${salon.name} a favoritos`}
              className={cn(
                "absolute top-3.5 right-3.5 h-11 w-11 rounded-full flex items-center justify-center transition-all duration-400",
                isFav
                  ? "bg-rose-500 text-white shadow-xl shadow-rose-500/40"
                  : "bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border-[0.5px] border-white/20"
              )}
            >
              <motion.div animate={{ scale: isFav ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                <Heart className={cn("h-5 w-5 transition-all duration-300", isFav && "fill-current")} />
              </motion.div>
            </motion.button>

            {/* Rating Badge — glass */}
            {salon.avgRating !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 + 0.4 }}
                className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/85 backdrop-blur-md shadow-lg border-[0.5px] border-white/40"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-zinc-900">{salon.avgRating.toFixed(1)}</span>
                <span className="text-xs text-zinc-500">({salon.reviewCount})</span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-foreground text-[19px] leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-400">
                {salon.name}
              </h3>
              {salon.average_price && (
                <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  Desde {salon.average_price}€
                </span>
              )}
            </div>
            
            {salon.tagline && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                {salon.tagline}
              </p>
            )}

            {matchReasons && matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {matchReasons.slice(0, 2).map((reason, i) => (
                  <span key={i} className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                    {reason}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-3">
                {distance && (
                  <div className="flex items-center gap-1.5 text-primary">
                    <Navigation className="h-3.5 w-3.5" />
                    <span className="text-sm font-bold">{distance}</span>
                  </div>
                )}
                {salon.city && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{salon.city}</span>
                  </div>
                )}
              </div>

              {/* Liquid Glass Buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleFollowClick}
                  disabled={followLoading}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition-all flex-1",
                    following
                      ? "bg-primary/10 text-primary border-[0.5px] border-primary/30"
                      : "liquid-glass-pill text-foreground/70"
                  )}
                >
                  {following ? (
                    <>
                      <UserCheck className="h-4 w-4 shrink-0" />
                      <span>Siguiendo</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 shrink-0" />
                      <span>Seguir</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.93 }}
                  className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-full gradient-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 flex-1"
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Reservar</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
