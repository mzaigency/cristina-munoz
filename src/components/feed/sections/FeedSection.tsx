import { motion } from "motion/react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

interface FeedSectionProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** Tinte del icono (gradiente). default: primary→purple */
  iconTint?: "primary" | "emerald" | "amber" | "rose";
  children: React.ReactNode;
}

const TINT_CLASS: Record<NonNullable<FeedSectionProps["iconTint"]>, string> = {
  primary: "bg-gradient-to-br from-primary to-[#99329a] text-white",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
  amber: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
  rose: "bg-gradient-to-br from-rose-400 to-rose-600 text-white",
};

export function FeedSection({
  icon: Icon,
  title,
  subtitle,
  count,
  expanded = false,
  onToggleExpand,
  iconTint = "primary",
  children,
}: FeedSectionProps) {
  const haptic = useHaptic();

  const handleToggle = () => {
    haptic.light();
    onToggleExpand?.();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-7"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-3 px-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "h-9 w-9 rounded-2xl flex items-center justify-center shadow-md shrink-0",
              TINT_CLASS[iconTint],
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-foreground leading-tight truncate">
              {title}
              {typeof count === "number" && count > 0 && (
                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                  {count}
                </span>
              )}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {onToggleExpand && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleToggle}
            className="shrink-0 flex items-center gap-0.5 text-xs font-semibold text-primary px-2 py-1 rounded-full hover:bg-primary/10 transition-colors"
          >
            {expanded ? "Ver menos" : "Ver todo"}
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                expanded && "rotate-90",
              )}
            />
          </motion.button>
        )}
      </div>

      {/* Body: carrusel o grid */}
      {expanded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {children}
        </div>
      ) : (
        <div
          className={cn(
            "flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory",
            "-mx-4 px-4 pb-2",
            "[mask-image:linear-gradient(to_right,transparent_0,black_16px,black_calc(100%-16px),transparent_100%)]",
          )}
        >
          {children}
        </div>
      )}
    </motion.section>
  );
}

interface CarouselItemProps {
  children: React.ReactNode;
}

/** Wrapper de ancho fijo para cada tarjeta dentro del carrusel */
export function FeedCarouselItem({ children }: CarouselItemProps) {
  return (
    <div className="snap-start shrink-0 w-[78vw] max-w-[300px]">
      {children}
    </div>
  );
}
