import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Hoja del panel: en móvil sale desde abajo (nativo), en escritorio es un modal
 * centrado. El markup interior es el MISMO en los dos casos — solo cambia el
 * contenedor — así que una pantalla no tiene que duplicar su formulario.
 *
 * Se monta sobre Radix directamente en vez de sobre `Sheet`/`Dialog` de shadcn:
 * esos traen `grid p-6 gap-4 max-w-lg` y una X de 16px, y dentro de
 * `@layer components` una utility de Tailwind siempre gana a una primitiva
 * `glow-*`, así que sobrescribirlos era pelearse con el orden de capas.
 *
 *   <GlowModal open={open} onOpenChange={setOpen}
 *              title="Nuevo servicio" icon={<Scissors />}
 *              footer={<><button className="glow-btn">Cancelar</button>…</>}>
 *     …campos…
 *   </GlowModal>
 */
export interface GlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** Línea de apoyo bajo el título. También es la descripción accesible. */
  description?: React.ReactNode;
  /** Icono para el círculo con degradado de marca. */
  icon?: React.ReactNode;
  /** Acciones fijas abajo. En móvil se reparten el ancho. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Ancho máximo en escritorio. */
  size?: "sm" | "md" | "lg";
  /** Clases extra para el cuerpo con scroll. */
  bodyClassName?: string;
  /** Evita cerrar tocando fuera (formularios con cambios sin guardar). */
  dismissable?: boolean;
}

const DESKTOP_WIDTH: Record<NonNullable<GlowModalProps["size"]>, string> = {
  sm: "sm:max-w-[420px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[720px]",
};

export function GlowModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  footer,
  children,
  size = "md",
  bodyClassName,
  dismissable = true,
}: GlowModalProps) {
  const isMobile = useIsMobile();
  const descriptionId = React.useId();

  const guard = dismissable ? undefined : (e: Event) => e.preventDefault();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[80] bg-on-surface/45 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={description ? descriptionId : undefined}
          onPointerDownOutside={guard}
          onInteractOutside={guard}
          className={cn(
            "fixed z-[81] flex flex-col overflow-hidden bg-surface font-poppins",
            "ease-[cubic-bezier(0.32,0.72,0,1)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:duration-300 data-[state=closed]:duration-200",
            isMobile
              ? [
                  "inset-x-0 bottom-0 max-h-[92vh] rounded-t-[24px]",
                  "pb-[calc(env(safe-area-inset-bottom)+1rem)]",
                  "shadow-[0_-8px_40px_-12px_rgba(19,21,32,.28)]",
                  "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
                ]
              : [
                  "left-1/2 top-1/2 w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2",
                  DESKTOP_WIDTH[size],
                  "max-h-[min(86vh,760px)] rounded-[24px] border border-line",
                  "shadow-[0_24px_60px_-20px_rgba(19,21,32,.30)]",
                  "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                  "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                ],
          )}
        >
          <div className="glow-sheet-h">
            {isMobile && <div className="glow-sheet-grip" />}
            <DialogPrimitive.Title className="glow-sheet-title">
              {icon && <span className="glow-sheet-ico">{icon}</span>}
              <span className="min-w-0 flex-1">{title}</span>
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description id={descriptionId} className="glow-sheet-sub">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>

          <div className={cn("glow-sheet-body", bodyClassName)}>{children}</div>

          {footer && (
            <div className={cn("glow-sheet-f", isMobile ? "glow-sheet-f--fill" : "glow-sheet-f--end")}>
              {footer}
            </div>
          )}

          {/* En móvil el tirador ya dice "arrástrame" y la X pisaría el título */}
          {!isMobile && (
            <DialogPrimitive.Close className="glow-sheet-x absolute">
              <X />
              <span className="sr-only">Cerrar</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
