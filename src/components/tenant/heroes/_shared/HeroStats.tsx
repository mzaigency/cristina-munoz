import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";
import { EASE_OUT } from "./heroAnimations";
import { formatFollowers } from "./useHeroStats";

interface HeroStatsProps {
  followers: number;
  rating?: number;
  since?: number;
  /** "glass" = white/translucent pills (on dark/image backgrounds). "soft" = neutral light pills (on white bg). */
  variant?: "glass" | "soft" | "subtle";
  size?: "sm" | "md";
  delay?: number;
  className?: string;
}

export function HeroStats({
  followers,
  rating,
  since,
  variant = "glass",
  size = "md",
  delay = 0.5,
  className = "",
}: HeroStatsProps) {
  const pillBase =
    "inline-flex items-center gap-2 transition-colors duration-300 backdrop-blur-md " +
    (size === "sm" ? "px-3 py-1.5 text-[12px] rounded-full" : "px-3.5 py-2 text-[13px] rounded-full");

  const pillStyle =
    variant === "glass"
      ? "bg-white/15 border border-white/20 text-white"
      : variant === "soft"
        ? "bg-black/[.04] border border-black/[.06] text-gray-700"
        : "bg-transparent border border-white/15 text-white/80";

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
    >
      <div className={`${pillBase} ${pillStyle}`}>
        <Users className={iconSize} strokeWidth={2.2} />
        <span className="font-semibold tabular-nums">{formatFollowers(followers)}</span>
      </div>
      {rating != null && rating > 0 && (
        <div className={`${pillBase} ${pillStyle}`}>
          <Star className={`${iconSize} fill-current text-amber-300`} />
          <span className="font-semibold tabular-nums">{rating}</span>
        </div>
      )}
      {since != null && (
        <div className={`${pillBase} ${pillStyle}`}>
          <img src="/favicon.png" alt="" className={size === "sm" ? "h-4 w-4 rounded" : "h-[18px] w-[18px] rounded"} />
          <span className="font-medium opacity-80">Desde {since}</span>
        </div>
      )}
    </motion.div>
  );
}
