import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { motion } from "motion/react";

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    city: string | null;
    tagline: string | null;
    avgRating: number | null;
    reviewCount: number;
  };
  index: number;
}

export function SalonCard({ salon, index }: SalonCardProps) {
  const primaryColor = salon.primary_color || "#6366f1";
  const initials = salon.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/salon/${salon.slug}`} className="block">
        <div className="ios-card group overflow-hidden active:scale-[0.98] transition-transform duration-200">
          {/* Image Container */}
          <div
            className="relative h-36 flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor})`,
            }}
          >
            {salon.logo_url ? (
              <img
                src={salon.logo_url}
                alt={salon.name}
                className="h-16 w-16 object-contain rounded-2xl bg-white/95 p-2 shadow-lg"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {initials}
              </div>
            )}

            {/* Rating Badge */}
            {salon.avgRating !== null && (
              <div className="absolute top-3 right-3 ios-badge flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold">
                  {salon.avgRating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground text-base mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">
              {salon.name}
            </h3>
            
            {salon.tagline && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1 italic">
                {salon.tagline}
              </p>
            )}

            <div className="flex items-center justify-between">
              {salon.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{salon.city}</span>
                </p>
              )}

              {salon.reviewCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {salon.reviewCount} reseñas
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
