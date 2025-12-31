import { Link } from "react-router-dom";
import { MapPin, Star, Heart, Clock, Sparkles, Zap, Navigation } from "lucide-react";
import { motion } from "motion/react";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

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
}

export function PremiumSalonCard({ salon, index, distance }: PremiumSalonCardProps) {
  const { isFavorite, toggleFavorite, isAuthenticated } = useFavorites();
  const isFav = isFavorite(salon.id);
  const primaryColor = salon.primary_color || "#6366f1";
  
  const initials = salon.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Check if salon has availability today (mock for now)
  const hasAvailabilityToday = index % 3 === 0;
  const isPopular = salon.reviewCount > 10;
  const isNew = salon.reviewCount === 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(salon.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link to={`/salon/${salon.slug}`} className="block">
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-lg shadow-foreground/5 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:border-primary/20">
          
          {/* Image Container with Gradient Overlay */}
          <div className="relative h-44 overflow-hidden">
            {salon.hero_image_url ? (
              <img
                src={salon.hero_image_url}
                alt={salon.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}99)`,
                }}
              >
                {salon.logo_url ? (
                  <img
                    src={salon.logo_url}
                    alt={salon.name}
                    className="h-20 w-20 object-contain rounded-2xl bg-white/95 p-3 shadow-2xl"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl border border-white/20">
                    {initials}
                  </div>
                )}
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Badges Container */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {hasAvailabilityToday && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 + 0.3 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide"
                >
                  <Zap className="h-3 w-3" />
                  Huecos hoy
                </motion.div>
              )}
              {isPopular && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 + 0.35 }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide"
                >
                  <Sparkles className="h-3 w-3" />
                  Popular
                </motion.div>
              )}
              {isNew && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 + 0.35 }}
                  className="px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide"
                >
                  Nuevo
                </motion.div>
              )}
            </div>

            {/* Favorite Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleFavoriteClick}
              className={cn(
                "absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                isFav 
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" 
                  : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/20"
              )}
            >
              <Heart 
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isFav && "fill-current scale-110"
                )} 
              />
            </motion.button>

            {/* Rating Badge - Bottom Right */}
            {salon.avgRating !== null && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-foreground">
                  {salon.avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({salon.reviewCount})
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-300">
                {salon.name}
              </h3>
              {salon.average_price && (
                <span className="shrink-0 text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                  Desde {salon.average_price}€
                </span>
              )}
            </div>
            
            {salon.tagline && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                {salon.tagline}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                {distance && (
                  <div className="flex items-center gap-1 text-primary">
                    <Navigation className="h-3.5 w-3.5" />
                    <span className="text-sm font-semibold">{distance}</span>
                  </div>
                )}
                {salon.city && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{salon.city}</span>
                  </div>
                )}
              </div>

              {/* Quick Book Button */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
              >
                <Clock className="h-3.5 w-3.5" />
                Reservar
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
