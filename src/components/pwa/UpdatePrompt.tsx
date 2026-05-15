import { useEffect } from "react";
import { toast } from "sonner";
import { useAppVersion, consumeJustUpdatedFlag } from "@/hooks/useAppVersion";

/**
 * Antes mostraba un prompt "Nueva versión disponible".
 * Ahora: arranca el polling silencioso y muestra un toast discreto
 * solo después de una recarga real por actualización.
 */
export function UpdatePrompt() {
  // Activa el hook de auto-update silencioso
  useAppVersion();

  useEffect(() => {
    if (consumeJustUpdatedFlag()) {
      toast.success("Actualizado a la última versión", {
        duration: 2200,
      });
    }
  }, []);

  return null;
}
