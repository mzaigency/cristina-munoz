import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PreloaderProps {
  /**
   * Cuándo lanzar la animación de salida. Si se omite, espera a que el
   * documento termine de cargar (útil en páginas estáticas). En páginas con
   * datos asíncronos, pásalo enlazado al estado de carga (`ready={!loading}`).
   */
  ready?: boolean;
  /** Texto bajo el logo (o central si no hay logo). Si se omite, no hay texto. */
  text?: string;
  /** Logo central. */
  logoUrl?: string | null;
  /**
   * "card": logo en tarjeta blanca estilo icono de app (logos cuadrados de
   * negocios, legible sobre oscuro sea cual sea su color).
   * "bare": logo tal cual, sin tarjeta (wordmarks anchos con transparencia).
   */
  logoVariant?: "card" | "bare";
  /** Color de marca para el lavado de fondo y el glow. Por defecto, primary. */
  accentColor?: string | null;
  /**
   * Clave de sessionStorage: la cortina solo se muestra la primera vez por
   * sesión; en visitas siguientes se sustituye por un spinner discreto que
   * desaparece sin animación. Para páginas de uso frecuente (panel admin).
   */
  once?: string;
}

/**
 * Cortina de carga a pantalla completa con marca. Cubre la página mientras
 * `ready` es false; al pasar a true, el bloque central escala hacia el
 * espectador y la cortina sube con el borde inferior curvado.
 */
export function Preloader({ ready, text, logoUrl, logoVariant = "card", accentColor, once }: PreloaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [docReady, setDocReady] = useState(false);
  const [done, setDone] = useState(false);
  const [suppressed] = useState(() => {
    if (!once || typeof window === "undefined") return false;
    return sessionStorage.getItem(`preloader:${once}`) === "1";
  });

  const accent = accentColor || "hsl(var(--primary))";

  // Fallback para páginas sin estado de carga propio: documento completo.
  useLayoutEffect(() => {
    if (ready !== undefined || suppressed) return;
    let raf: number;
    const check = () => {
      if (document.readyState === "complete") {
        setDocReady(true);
      } else {
        raf = requestAnimationFrame(check);
      }
    };
    check();
    return () => cancelAnimationFrame(raf);
  }, [ready, suppressed]);

  const isReady = ready ?? docReady;

  // Entrada suave del bloque central — solo si la cortina va a quedarse un
  // momento en pantalla. Si ya está ready al montar, se va directa a la
  // salida (animar entrada y salida a la vez dejaría la opacidad en 0).
  useLayoutEffect(() => {
    if (suppressed || isReady || !centerRef.current) return;
    gsap.fromTo(
      centerRef.current,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppressed]);

  useLayoutEffect(() => {
    if (suppressed || !isReady || !loaderRef.current || !centerRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        if (once) sessionStorage.setItem(`preloader:${once}`, "1");
        setDone(true);
      },
    });

    tl.to(centerRef.current, { scale: 3, opacity: 0, duration: 0.8 });
    tl.to(
      loaderRef.current,
      {
        y: "-105%",
        borderBottomLeftRadius: "50% 20%",
        borderBottomRightRadius: "50% 20%",
        duration: 1,
      },
      "<",
    );

    return () => {
      tl.kill();
    };
  }, [isReady, suppressed, once]);

  if (done) return null;

  // Ya vista esta sesión: spinner discreto mientras carga, nada al terminar.
  if (suppressed) {
    if (isReady) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-neutral-950 shadow-2xl"
      style={{
        transform: "translateY(0%)",
        borderBottomLeftRadius: "0%",
        borderBottomRightRadius: "0%",
      }}
    >
      {/* Lavado radial con el color de marca */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 50% 28%, color-mix(in oklab, ${accent} 26%, transparent) 0%, transparent 65%)`,
        }}
      />

      <div ref={centerRef} className="relative flex flex-col items-center gap-5 px-6">
        {/* Glow pulsante tras el logo */}
        <div
          aria-hidden
          className="absolute -inset-12 rounded-full opacity-35 blur-3xl animate-pulse-soft"
          style={{ backgroundColor: accent }}
        />

        {logoUrl &&
          (logoVariant === "bare" ? (
            <img
              src={logoUrl}
              alt=""
              className="relative h-14 w-auto max-w-[280px] object-contain drop-shadow-[0_4px_24px_rgba(255,255,255,0.25)]"
            />
          ) : (
            <div className="relative h-20 w-20 rounded-[24px] bg-white p-3 shadow-2xl ring-1 ring-white/30">
              <img src={logoUrl} alt="" className="h-full w-full object-contain" />
            </div>
          ))}

        {text && (
          <div className="relative max-w-xs text-center font-display text-xl font-semibold tracking-tight text-white">
            {text}
          </div>
        )}
      </div>
    </div>
  );
}

export default Preloader;
