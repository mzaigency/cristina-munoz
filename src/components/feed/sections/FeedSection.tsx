import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import {
  useSectionImpression,
  trackEvent,
  rememberSectionClick,
  type FeedSectionId,
} from "@/lib/telemetry";

interface FeedSectionProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** Tinte del icono (gradiente). default: primary→purple */
  iconTint?: "primary" | "emerald" | "amber" | "rose";
  /** Identificador para telemetría */
  sectionId?: FeedSectionId;
  children: React.ReactNode;
}

const TINT_CLASS: Record<NonNullable<FeedSectionProps["iconTint"]>, string> = {
  primary: "bg-[var(--glow-brand-soft)] text-[var(--glow-brand)] border border-[var(--glow-brand)]/20",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

export function FeedSection({
  icon: Icon,
  title,
  subtitle,
  count,
  expanded = false,
  onToggleExpand,
  iconTint = "primary",
  sectionId,
  children,
}: FeedSectionProps) {
  const haptic = useHaptic();
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Telemetry: impression once per mount
  useSectionImpression(
    sectionRef,
    sectionId ?? ("foryou" as FeedSectionId),
    typeof count === "number" ? count : 0,
  );

  const handleToggle = () => {
    haptic.light();
    if (sectionId) {
      void trackEvent({
        event_type: "click",
        section_id: sectionId,
        metadata: { kind: "toggle_expand", expanded: !expanded },
      });
    }
    onToggleExpand?.();
  };


  return (
    <motion.section
      ref={sectionRef as any}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 sm:mb-10"
      data-section-id={sectionId}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 px-1 sm:px-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
              TINT_CLASS[iconTint],
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] sm:text-[17px] font-bold text-foreground leading-tight truncate flex items-center gap-1.5">
              <span>{title}</span>
              {typeof count === "number" && count > 0 && (
                <span className="text-[11px] font-semibold text-muted-foreground bg-surface-container px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {onToggleExpand && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleToggle}
              className="shrink-0 flex items-center gap-1 text-[13px] font-semibold text-[var(--glow-brand)] px-3 py-1.5 rounded-full border border-[var(--glow-brand)]/20 bg-[var(--glow-brand-soft)] hover:bg-[var(--glow-brand)]/12 transition-colors"
            >
              {expanded ? "Ver menos" : "Ver más"}
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-300",
                  expanded ? "-rotate-90" : "rotate-90",
                )}
              />
            </motion.button>
          )}
        </div>
      </div>

      {/* Body: carrusel en móvil, rejilla en escritorio */}
      <div
        ref={carouselRef}
        className={cn(
          "items-stretch",
          expanded
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
            : "flex gap-3.5 overflow-x-auto no-scrollbar scrollbar-hide snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-0 -mx-4 px-4 pb-2 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-5 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:snap-none",
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* Ver más en móvil */}
      {onToggleExpand && (
        <div className="mt-3 flex md:hidden justify-center">
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-1 text-[13px] font-semibold text-[var(--glow-brand)] px-4 py-2 rounded-full border border-[var(--glow-brand)]/20 bg-[var(--glow-brand-soft)] active:scale-[0.97] transition-transform"
          >
            {expanded ? "Ver menos" : "Ver más"}
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                expanded ? "-rotate-90" : "rotate-90",
              )}
            />
          </button>
        </div>
      )}
    </motion.section>
  );
}

interface CarouselItemProps {
  children: React.ReactNode;
  sectionId?: FeedSectionId;
  tenantId?: string;
  position?: number;
  score?: number;
}

/** Wrapper de ancho responsivo: táctil en móvil, 3 col en tablet, 4 col exactas en desktop */
export function FeedCarouselItem({
  children,
  sectionId,
  tenantId,
  position,
  score,
}: CarouselItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const handleClickCapture = () => {
    if (!sectionId || !tenantId) return;
    rememberSectionClick(sectionId, tenantId, position, score);
    void trackEvent({
      event_type: "click",
      section_id: sectionId,
      tenant_id: tenantId,
      position: position ?? null,
      score: score ?? null,
      metadata: { kind: "card" },
    });
  };
  return (
    <div
      ref={itemRef}
      className="snap-start shrink-0 w-[74vw] sm:w-[275px] md:w-auto md:shrink flex flex-col h-full"
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
}
