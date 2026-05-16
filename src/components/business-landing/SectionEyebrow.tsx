import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  icon?: LucideIcon;
  label: string;
  /** 'primary' (default) | 'accent' | 'destructive' | 'white' */
  tone?: "primary" | "accent" | "destructive" | "white";
  className?: string;
}

const TONES: Record<NonNullable<SectionEyebrowProps["tone"]>, string> = {
  primary: "text-primary bg-primary/10 border-primary/15",
  accent: "text-accent bg-accent/10 border-accent/15",
  destructive: "text-destructive bg-destructive/10 border-destructive/15",
  white: "text-white bg-white/15 border-white/25 backdrop-blur",
};

/**
 * Eyebrow unificado para todas las secciones de la landing B2B.
 * Reemplaza la mezcla de spans/divs por un único pill consistente.
 */
export const SectionEyebrow = ({
  icon: Icon,
  label,
  tone = "primary",
  className,
}: SectionEyebrowProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider",
      TONES[tone],
      className,
    )}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
  </span>
);
