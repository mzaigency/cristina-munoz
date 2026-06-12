import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface PreloaderProps {
  /**
   * Cuándo lanzar la animación de salida. Si se omite, espera a que el
   * documento termine de cargar (útil en páginas estáticas). En páginas con
   * datos asíncronos, pásalo enlazado al estado de carga (`ready={!loading}`).
   */
  ready?: boolean;
  /** Texto bajo el logo (o central si no hay logo). Si se omite, no hay texto. */
  text?: string;
  /** Logo central. La salida espera a que la imagen cargue para que se vea. */
  logoUrl?: string | null;
  /**
   * "card": logo en tarjeta blanca estilo icono de app (logos cuadrados de
   * negocios, legible sea cual sea su color).
   * "bare": logo tal cual, sin tarjeta (wordmarks anchos con transparencia).
   */
  logoVariant?: "card" | "bare";
  /** Color de marca para el lavado de fondo y el glow. Por defecto, primary. */
  accentColor?: string | null;
  /** Tiempo mínimo en pantalla antes de la salida, en ms. */
  minDuration?: number;
}

/**
 * Cortina de carga a pantalla completa con marca. Cubre la página mientras
 * `ready` es false; al pasar a true (y tras `minDuration` y la carga del
 * logo), el bloque central escala hacia el espectador y la cortina sube con
 * el borde inferior curvado.
 */
export function Preloader({
  ready,
  text,
  logoUrl,
  logoVariant = "card",
  accentColor,
  minDuration = 300,
}: PreloaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [docReady, setDocReady] = useState(false);
  const [done, setDone] = useState(false);
  const [minElapsed, setMinElapsed] = useState(minDuration <= 0);
  const [logoLoaded, setLogoLoaded] = useState(!logoUrl);

  const accent = accentColor || "hsl(var(--primary))";

  // Fallback para páginas sin estado de carga propio: documento completo.
  useLayoutEffect(() => {
    if (ready !== undefined) return;
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
  }, [ready]);

  useEffect(() => {
    if (minDuration <= 0) return;
    const t = setTimeout(() => setMinElapsed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  const isReady = (ready ?? docReady) && minElapsed && logoLoaded;

  // Entrada suave del bloque central. La salida nunca arranca antes de
  // minDuration, así que no compite con esta animación.
  useLayoutEffect(() => {
    if (!centerRef.current) return;
    gsap.fromTo(
      centerRef.current,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" },
    );
  }, []);

  useLayoutEffect(() => {
    if (!isReady || !loaderRef.current || !centerRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => setDone(true),
    });

    tl.to(centerRef.current, { scale: 3, opacity: 0, duration: 0.35 });
    tl.to(
      loaderRef.current,
      {
        y: "-105%",
        borderBottomLeftRadius: "50% 20%",
        borderBottomRightRadius: "50% 20%",
        duration: 0.5,
      },
      "<",
    );

    return () => {
      tl.kill();
    };
  }, [isReady]);

  // Si la imagen ya está en caché, onLoad puede no dispararse: comprobar.
  const handleLogoRef = (el: HTMLImageElement | null) => {
    if (el?.complete) setLogoLoaded(true);
  };
  const markLogoLoaded = () => setLogoLoaded(true);

  if (done) return null;

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-white shadow-2xl"
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
          background: `radial-gradient(120% 90% at 50% 28%, color-mix(in oklab, ${accent} 14%, transparent) 0%, transparent 65%)`,
        }}
      />

      <div ref={centerRef} className="relative flex flex-col items-center gap-5 px-6">
        {/* Glow pulsante tras el logo */}
        <div
          aria-hidden
          className="absolute -inset-12 rounded-full opacity-20 blur-3xl animate-pulse-soft"
          style={{ backgroundColor: accent }}
        />

        {logoUrl &&
          (logoVariant === "bare" ? (
            <img
              ref={handleLogoRef}
              onLoad={markLogoLoaded}
              onError={markLogoLoaded}
              src={logoUrl}
              alt=""
              className="relative h-14 w-auto max-w-[280px] object-contain"
            />
          ) : (
            <div className="relative h-20 w-20 rounded-[24px] bg-white p-3 shadow-xl ring-1 ring-black/10">
              <img
                ref={handleLogoRef}
                onLoad={markLogoLoaded}
                onError={markLogoLoaded}
                src={logoUrl}
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          ))}

        {text && (
          <div className="relative max-w-xs text-center font-display text-xl font-semibold tracking-tight text-neutral-900">
            {text}
          </div>
        )}
      </div>
    </div>
  );
}

export default Preloader;
