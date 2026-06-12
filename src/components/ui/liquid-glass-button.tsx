import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * LiquidButton — botón "liquid glass" estilo iOS 26.
 *
 * Capas (de atrás hacia delante):
 *  1. Refracción base: backdrop blur + saturación (funciona en todos los
 *     navegadores, incluido WebKit/Capacitor).
 *  2. Distorsión líquida: filtro SVG de desplazamiento sobre el backdrop.
 *     Solo Chromium soporta `backdrop-filter: url(...)`; en iOS/Safari esta
 *     capa no hace nada y queda el blur de la capa 1 como fallback.
 *  3. Borde especular: inset shadows que dibujan el canto del cristal.
 *  4. Contenido.
 */

const liquidButtonVariants = cva(
  "group relative isolate inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold tracking-tight transition-all duration-300 will-change-transform hover:scale-[1.03] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Se adapta al tema — para botones sobre contenido de la app. */
        default: "text-foreground",
        /** Texto blanco y cantos brillantes — para botones sobre fotos o fondos oscuros. */
        "on-media": "text-white",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        default: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-[15px]",
        xl: "h-14 px-9 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const specularByVariant: Record<"default" | "on-media", string> = {
  default: cn(
    "border border-white/40 dark:border-white/10",
    "shadow-[inset_1.5px_1.5px_1px_-1px_rgba(255,255,255,0.9),inset_-1.5px_-1.5px_1px_-1px_rgba(255,255,255,0.55),inset_0_0_10px_4px_rgba(255,255,255,0.14),0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.14)]",
    "dark:shadow-[inset_1.5px_1.5px_1px_-1px_rgba(255,255,255,0.28),inset_-1.5px_-1.5px_1px_-1px_rgba(255,255,255,0.16),inset_0_0_10px_4px_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.35),0_8px_24px_-8px_rgba(0,0,0,0.5)]",
  ),
  "on-media": cn(
    "border border-white/35",
    "shadow-[inset_2px_2px_1px_-1px_rgba(255,255,255,0.75),inset_-2px_-2px_1px_-1px_rgba(255,255,255,0.45),inset_0_0_12px_5px_rgba(255,255,255,0.16),0_4px_16px_rgba(0,0,0,0.25),0_12px_32px_-10px_rgba(0,0,0,0.35)]",
  ),
};

const tintByVariant: Record<"default" | "on-media", string> = {
  default: "bg-white/20 dark:bg-white/[0.06]",
  "on-media": "bg-white/[0.12]",
};

export interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof liquidButtonVariants> {
  asChild?: boolean;
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant = "default", size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const resolvedVariant = variant ?? "default";

    return (
      <Comp
        ref={ref}
        data-slot="liquid-button"
        className={cn(
          liquidButtonVariants({ variant, size }),
          specularByVariant[resolvedVariant],
          className,
        )}
        {...props}
      >
        {/* Capa 1 — refracción base (fallback universal) */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 -z-20 rounded-[inherit] backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300 group-hover:bg-white/25 dark:group-hover:bg-white/10",
            tintByVariant[resolvedVariant],
          )}
        />
        {/* Capa 2 — distorsión líquida (solo Chromium; inocua en WebKit) */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-[inherit]"
          style={{ backdropFilter: 'url("#liquid-glass-distortion")' }}
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
        <LiquidGlassFilter />
      </Comp>
    );
  },
);
LiquidButton.displayName = "LiquidButton";

/**
 * Filtro SVG de desplazamiento compartido. Se referencia por id, así que
 * aunque se monte una vez por botón el navegador resuelve siempre el primero.
 */
function LiquidGlassFilter() {
  return (
    <svg className="hidden" aria-hidden focusable="false">
      <defs>
        <filter
          id="liquid-glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="40"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="3" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export { LiquidButton, liquidButtonVariants };
