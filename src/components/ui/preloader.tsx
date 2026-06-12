import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";

interface PreloaderProps {
  /**
   * Cuándo lanzar la animación de salida. Si se omite, espera a que el
   * documento termine de cargar (útil en páginas estáticas). En páginas con
   * datos asíncronos, pásalo enlazado al estado de carga (`ready={!loading}`).
   */
  ready?: boolean;
  /** Texto central. Escala y se desvanece al salir. */
  text?: string;
}

/**
 * Cortina de carga a pantalla completa. Cubre la página mientras `ready` es
 * false; al pasar a true, el texto escala hacia el espectador y la cortina
 * sube con el borde inferior curvado.
 */
export function Preloader({ ready, text = "Cargando…" }: PreloaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [docReady, setDocReady] = useState(false);
  const [done, setDone] = useState(false);

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

  const isReady = ready ?? docReady;

  useLayoutEffect(() => {
    if (!isReady || !loaderRef.current || !textRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => setDone(true),
    });

    tl.to(textRef.current, { scale: 5, opacity: 0, duration: 0.8 });
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
  }, [isReady]);

  if (done) return null;

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-950 shadow-2xl"
      style={{
        transform: "translateY(0%)",
        borderBottomLeftRadius: "0%",
        borderBottomRightRadius: "0%",
      }}
    >
      <div
        ref={textRef}
        className="px-6 text-center text-white text-3xl font-display font-semibold tracking-tight animate-pulse"
      >
        {text}
      </div>
    </div>
  );
}

export default Preloader;
