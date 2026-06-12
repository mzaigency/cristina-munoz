import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { FollowButton } from "@/components/social/FollowButton";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { EASE_OUT } from "./heroAnimations";
import type { CSSProperties } from "react";

interface HeroCTAProps {
  tenantId: string;
  onBookNow: () => void;
  primaryColor?: string | null;
  label?: string;
  /** "solid" = filled accent button (default). "white" = white-on-dark. "outline" = transparent border. "glass" = liquid glass over imagery. */
  variant?: "solid" | "white" | "outline" | "glass";
  /** "icon" = Calendar icon left. "arrow" = ArrowRight on right. */
  iconStyle?: "icon" | "arrow" | "none";
  className?: string;
  showFollow?: boolean;
  /** "row" = side by side. "stack" = vertical (mobile). */
  layout?: "row" | "stack";
}

export function HeroCTA({
  tenantId,
  onBookNow,
  primaryColor,
  label = "Reservar cita",
  variant = "solid",
  iconStyle = "icon",
  className = "",
  showFollow = true,
  layout = "row",
}: HeroCTAProps) {
  const accent = primaryColor || "hsl(var(--primary))";

  const baseBtn =
    "group relative inline-flex items-center justify-center gap-2.5 font-semibold tracking-tight " +
    "transition-all duration-300 will-change-transform " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40";

  const sizeBtn = "h-12 sm:h-14 px-7 sm:px-9 text-base sm:text-[15px]";
  const radiusBtn = "rounded-2xl";

  const variantStyle: CSSProperties =
    variant === "solid"
      ? { background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent}, #000 18%))`, color: "#fff" }
      : variant === "white"
        ? { background: "#fff", color: "#0a0a0a" }
        : { background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,.55)" };

  const shadowClass = variant === "outline" ? "" : "shadow-[0_18px_40px_-14px_rgba(0,0,0,.35)] hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,.45)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6, ease: EASE_OUT }}
      className={`flex ${layout === "stack" ? "flex-col w-full max-w-sm" : "flex-row flex-wrap items-center"} gap-3 ${className}`}
    >
      {variant === "glass" ? (
        <LiquidButton
          onClick={onBookNow}
          variant="on-media"
          size="xl"
          className={`${sizeBtn} ${radiusBtn} gap-2.5`}
        >
          {iconStyle === "icon" && <Calendar className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.4} />}
          <span>{label}</span>
          {iconStyle === "arrow" && (
            <ArrowRight
              className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          )}
        </LiquidButton>
      ) : (
        <motion.button
          onClick={onBookNow}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1.5 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className={`${baseBtn} ${sizeBtn} ${radiusBtn} ${shadowClass} hover:brightness-[1.06]`}
          style={variantStyle}
        >
          {iconStyle === "icon" && <Calendar className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.4} />}
          <span>{label}</span>
          {iconStyle === "arrow" && (
            <ArrowRight
              className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          )}
        </motion.button>
      )}

      {showFollow && (
        <FollowButton
          tenantId={tenantId}
          variant="default"
          className={
            variant === "white"
              ? "h-12 sm:h-14 px-6 rounded-2xl bg-black/5 backdrop-blur-md border-black/10 text-gray-900 hover:bg-black/10"
              : "h-12 sm:h-14 px-6 rounded-2xl bg-white/12 backdrop-blur-xl border-white/25 text-white hover:bg-white/20"
          }
        />
      )}
    </motion.div>
  );
}
