import { Sparkles } from "lucide-react";

/**
 * Envoltorio de marca GlowApp para la landing del tenant.
 * - Pastilla flotante superior derecha (liquid glass) con logo + CTA a glowapp.app
 * - Blobs ambientales sutiles con la paleta GlowApp (#22408b azul + #99329a púrpura)
 *
 * No toca los colores del tenant: vive por encima/detrás del contenido,
 * sólo añade identidad de marca GlowApp como chrome.
 */
export const GlowAppBrandFrame = ({ tenantName }: { tenantName: string }) => {
  return (
    <>
      {/* Ambient brand glow — fixed, behind content */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -top-[20%] -right-[15%] w-[55vw] h-[55vw] max-w-[640px] max-h-[640px] rounded-full blur-3xl opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #22408b 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-[20%] -left-[15%] w-[55vw] h-[55vw] max-w-[640px] max-h-[640px] rounded-full blur-3xl opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #99329a 0%, transparent 70%)" }}
        />
      </div>

      {/* Floating brand pill — top right, respecting safe area */}
      <a
        href="https://www.glowapp.app"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${tenantName} funciona con GlowApp`}
        className="fixed right-3 z-[60] flex items-center gap-1.5 rounded-full pl-2 pr-3 py-1.5 text-[11px] font-semibold tracking-tight
                   backdrop-blur-xl bg-white/55 border border-white/60
                   shadow-[0_8px_24px_-12px_rgba(34,64,139,0.35)]
                   hover:bg-white/75 active:scale-95 transition-all duration-200 touch-manipulation"
        style={{ top: `calc(env(safe-area-inset-top) + 0.5rem)` }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-white"
          style={{ background: "linear-gradient(135deg, #22408b 0%, #99329a 100%)" }}
        >
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, #22408b 0%, #99329a 100%)" }}
        >
          GlowApp
        </span>
      </a>
    </>
  );
};

export default GlowAppBrandFrame;
