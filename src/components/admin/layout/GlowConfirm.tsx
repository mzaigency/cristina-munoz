import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface GlowConfirmOptions {
  title: string;
  description?: React.ReactNode;
  /** Texto del botón que confirma. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pinta el botón en rojo; es el caso por defecto (borrados). */
  tone?: "danger" | "brand";
}

interface ConfirmState extends GlowConfirmOptions {
  resolve: (ok: boolean) => void;
}

/**
 * Sustituye a `confirm()` del navegador, que rompe la ilusión de app nativa
 * (diálogo del sistema, tipografía ajena, y en iOS con el nombre del dominio).
 *
 *   const { confirm, confirmDialog } = useGlowConfirm();
 *   if (!(await confirm({ title: "¿Eliminar paquete?" }))) return;
 *   …
 *   return <>{…}{confirmDialog}</>;
 */
export function useGlowConfirm() {
  const [state, setState] = React.useState<ConfirmState | null>(null);
  const [busy, setBusy] = React.useState(false);
  const isMobile = useIsMobile();

  const confirm = React.useCallback(
    (options: GlowConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setBusy(false);
        setState({ ...options, resolve });
      }),
    [],
  );

  const settle = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };

  const danger = (state?.tone ?? "danger") === "danger";

  const confirmDialog = (
    <AlertDialogPrimitive.Root
      open={state !== null}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-on-surface/45 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-surface font-poppins",
            "ease-[cubic-bezier(0.32,0.72,0,1)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:duration-300 data-[state=closed]:duration-200",
            isMobile
              ? [
                  "inset-x-0 bottom-0 rounded-t-[24px] pb-[env(safe-area-inset-bottom)]",
                  "shadow-[0_-8px_40px_-12px_rgba(19,21,32,.28)]",
                  "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
                ]
              : [
                  "left-1/2 top-1/2 w-[calc(100vw-32px)] max-w-[400px]",
                  "-translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-line",
                  "shadow-[0_24px_60px_-20px_rgba(19,21,32,.30)]",
                  "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                  "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                ],
          )}
        >
          <div className="glow-sheet-h border-b-0 pb-0">
            {isMobile && <div className="glow-sheet-grip" />}
            <AlertDialogPrimitive.Title className="glow-sheet-title">
              <span
                className={cn("glow-sheet-ico", danger && "glow-sheet-ico--danger")}
              >
                <AlertTriangle />
              </span>
              <span className="min-w-0 flex-1">{state?.title}</span>
            </AlertDialogPrimitive.Title>
            {state?.description && (
              <AlertDialogPrimitive.Description className="glow-sheet-sub">
                {state.description}
              </AlertDialogPrimitive.Description>
            )}
          </div>

          <div
            className={cn(
              "glow-sheet-f border-t-0 pt-5",
              isMobile ? "glow-sheet-f--fill" : "glow-sheet-f--end",
            )}
          >
            <AlertDialogPrimitive.Cancel asChild>
              <button type="button" className="glow-btn">
                {state?.cancelLabel ?? "Cancelar"}
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button
                type="button"
                disabled={busy}
                className={cn("glow-btn", danger ? "glow-btn--danger-solid" : "glow-btn--primary")}
                onClick={(e) => {
                  // Radix cierra al pulsar Action; el estado se limpia en settle()
                  e.preventDefault();
                  setBusy(true);
                  settle(true);
                }}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {state?.confirmLabel ?? "Eliminar"}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );

  return { confirm, confirmDialog };
}
