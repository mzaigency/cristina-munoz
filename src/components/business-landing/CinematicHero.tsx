import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeroStory } from "./HeroStory";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hero cinemático de Glowapp. Un único acto pinned y scrubbeado:
 *   1. Texto editorial → la tarjeta navy sube y se expande a escenario fullscreen.
 *   2. Relato parallax 3D (`HeroStory`): 3 beats dolor→solución con tipografía
 *      cinética — la palabra-dolor se desintegra char a char y resuelve en
 *      gradiente de marca (WhatsApps, contabilidad a mano, agenda caótica).
 *   3. Slogan "El software de salón que no te cuesta nada" + remate con barrido
 *      de luz "Tú, a hacer brillar el salón." → CTA. Suelta el scroll abajo.
 *
 * Identidad Glowapp: gradiente azul→morado de marca, Plus Jakarta Sans +
 * Playfair Display (italic). GSAP solo vive aquí (pin único + scrub).
 */
const INJECTED_STYLES = `
  .ch-reveal { visibility: hidden; }

  /* Estado inicial oculto para evitar FOUC antes de que GSAP arranque
     (si no, todos los beats salen apilados de golpe al cargar). */
  .ch-beat,
  .ch-pain-fx,
  .ch-sol-fx,
  .ch-story-sol,
  .ch-story,
  .ch-cta { opacity: 0; visibility: hidden; }


  .ch-grain {
    position: absolute; inset: 0; pointer-events: none; z-index: 50;
    opacity: 0.04; mix-blend-mode: multiply;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%25" height="100%25" filter="url(%23n)"/></svg>');
  }

  .ch-grid {
    background-size: 56px 56px;
    background-image:
      linear-gradient(to right, hsl(var(--foreground) / 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--foreground) / 0.05) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* Texto editorial fuera de la tarjeta (fondo claro) */
  .ch-text-matte {
    color: hsl(var(--foreground));
    text-shadow: 0 10px 30px hsl(var(--foreground) / 0.12), 0 2px 4px hsl(var(--foreground) / 0.08);
  }
  .ch-text-gradient {
    background: linear-gradient(100deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 55%, #c084fc 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    transform: translateZ(0);
    filter: drop-shadow(0 10px 24px hsl(var(--accent) / 0.18));
  }

  /* Texto plateado dentro de la tarjeta clara */
  .ch-card-silver {
    background: linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    transform: translateZ(0);
    filter: drop-shadow(0 8px 16px hsl(var(--accent) / 0.25));
  }

  /* Tarjeta física profunda — fondo claro */
  .ch-card {
    background: linear-gradient(150deg, #f4f7fb 0%, #ece8f4 100%);
    box-shadow:
      0 40px 100px -20px rgba(0,0,0,0.12),
      0 20px 40px -20px rgba(0,0,0,0.08),
      inset 0 1px 2px rgba(255,255,255,0.8),
      inset 0 -2px 4px rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.06);
  }
  .ch-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 40;
    background: radial-gradient(700px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.07) 0%, transparent 42%);
    mix-blend-mode: screen;
  }

  /* Badge flotante de cristal */
  .ch-badge {
    background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.10), 0 25px 50px -12px rgba(0,0,0,0.55),
      inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -1px 1px rgba(0,0,0,0.4);
  }

  /* Botón táctil primario (gradiente marca) */
  .ch-btn-primary {
    background-image: linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)));
    color: #fff;
    box-shadow: 0 8px 30px -6px hsl(var(--primary)/0.6), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.2);
    transition: transform 0.25s cubic-bezier(0.23,1,0.32,1), box-shadow 0.25s cubic-bezier(0.23,1,0.32,1);
  }
  .ch-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 44px -6px hsl(var(--accent)/0.65), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.2); }
  .ch-btn-primary:active { transform: translateY(1px) scale(0.99); }

  .ch-btn-ghost {
    background: hsl(var(--foreground) / 0.04);
    color: hsl(var(--foreground));
    box-shadow: inset 0 0 0 1px hsl(var(--foreground) / 0.12);
    transition: transform 0.25s cubic-bezier(0.23,1,0.32,1), background-color 0.25s;
  }
  .ch-btn-ghost:hover { transform: translateY(-3px); background: hsl(var(--foreground) / 0.08); }
  .ch-btn-ghost:active { transform: translateY(1px) scale(0.99); }

  /* ── Relato parallax (acto 2) ── */
  /* Dolor: gris oscuro sobre fondo claro. */
  .ch-story-pain { color: hsl(var(--muted-foreground)); text-shadow: none; }
  .ch-story-pain .ch-char { color: hsl(var(--foreground)); }
  /* Barrido de luz sobre el remate (banda diagonal que cruza, scrubbeada). */
  .ch-shine {
    background: linear-gradient(100deg, transparent 38%, rgba(255,255,255,0.85) 50%, transparent 62%);
    mix-blend-mode: overlay;
  }

  @media (prefers-reduced-motion: reduce) {
    .ch-reveal,
    .ch-story,
    .ch-cta { opacity: 1 !important; visibility: visible !important; }
  }
`;


export const CinematicHero = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Parallax de ratón sobre el escenario 3D + sheen de la tarjeta (solo desktop)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    if (reduce || isMobile) return;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!cardRef.current || !stageRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        cardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        cardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(stageRef.current, { rotationY: xVal * 6, rotationX: -yVal * 6, ease: "power3.out", duration: 1.2 });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Timeline cinemático (pin único). En móvil NO se pinea: el hero se
  // renderiza como bloque estático (ver markup más abajo) para que el usuario
  // alcance el CTA sin tener que scrollear 6 pantallas.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    if (isMobile) return; // Plan 2: sin pin en móvil

    const zIn = -520;
    const zOut = 320;
    const scatter = 90;

    const ctx = gsap.context(() => {
      gsap.set(".ch-reveal", { visibility: "visible" });

      if (reduce) {
        // Sin scrub: hero editorial estático. El relato y el CTA se omiten
        // (las secciones de abajo siguen ofreciendo conversión).
        gsap.set([".ch-card", ".ch-story", ".ch-cta"], { autoAlpha: 0 });
        return;
      }

      gsap.set(".ch-track", { autoAlpha: 0, y: 60, scale: 0.88, filter: "blur(16px)" });
      gsap.set(".ch-track-2", { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".ch-card", { y: () => window.innerHeight + 200, autoAlpha: 1 });
      gsap.set(".ch-story", { autoAlpha: 0 });
      gsap.set(".ch-beat", { autoAlpha: 0 });
      gsap.set(".ch-story-sol", { autoAlpha: 0 });
      gsap.set(".ch-cta", { autoAlpha: 0, scale: 0.85, filter: "blur(20px)" });

      const intro = gsap.timeline({ delay: 0.25 });
      intro
        .to(".ch-track", { duration: 1.4, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", ease: "expo.out" })
        .to(".ch-track-2", { duration: 1.2, clipPath: "inset(0 0% 0 0)", autoAlpha: 1, ease: "power4.inOut" }, "-=0.9");

      // Estado inicial de los motion graphics de cada beat
      gsap.set(".ch-pain-fx", { autoAlpha: 0 });
      gsap.set(".ch-sol-fx", { autoAlpha: 0, scale: 0.9 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=6200",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // ── Acto 1 → escenario: la tarjeta navy sube y se expande a fullscreen
      tl
        .to([".ch-hero-text", ".ch-grid"], { scale: 1.12, filter: "blur(16px)", opacity: 0.15, ease: "power2.inOut", duration: 2 }, 0)
        .to(".ch-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".ch-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .set(".ch-hero-text", { autoAlpha: 0 })
        .to(".ch-story", { autoAlpha: 1, ease: "power2.out", duration: 0.6 }, "-=0.4");

      // ── Helper: un beat dolor→solución con motion graphic propio.
      // Cada beat tiene `.ch-pain-fx-N` (gráfico del dolor) y `.ch-sol-fx-N`
      // (gráfico de la solución) además del texto.
      const beat = (idx: number) => {
        const sel = `.ch-beat-${idx}`;
        const painFx = `${sel} .ch-pain-fx`;
        const solFx = `${sel} .ch-sol-fx`;

        tl
          // dolor entra desde el fondo: texto + motion graphic juntos
          .fromTo(sel,
            { autoAlpha: 0, z: zIn, filter: "blur(14px)" },
            { autoAlpha: 1, z: 0, filter: "blur(0px)", ease: "expo.out", duration: 1.4 })
          .fromTo(painFx,
            { autoAlpha: 0, scale: 0.85, y: 40, rotateX: 12 },
            { autoAlpha: 1, scale: 1, y: 0, rotateX: 0, ease: "expo.out", duration: 1.4 },
            "<")
          // hijos del gráfico entran en cascada para sensación de "se acumula"
          .fromTo(`${painFx} .ch-fx-item`,
            { autoAlpha: 0, y: -30, scale: 0.7, rotation: () => gsap.utils.random(-12, 12) },
            { autoAlpha: 1, y: 0, scale: 1, rotation: 0, ease: "back.out(1.6)", duration: 0.9, stagger: { each: 0.06, from: "random" } },
            "<0.15")
          .to({}, { duration: 0.7 }) // sostiene el dolor
          // la palabra-dolor se desintegra char a char
          .to(`${sel} .ch-char`, {
            x: () => gsap.utils.random(-scatter, scatter),
            y: () => gsap.utils.random(-scatter * 0.7, scatter * 0.7),
            rotation: () => gsap.utils.random(-55, 55),
            filter: "blur(10px)", autoAlpha: 0,
            stagger: { each: 0.04, from: "random" },
            ease: "power2.in", duration: 0.9,
          })
          // el resto del texto de dolor se apaga
          .to(`${sel} .ch-story-pain`, { autoAlpha: 0, filter: "blur(8px)", ease: "power2.in", duration: 0.6 }, "<0.2")
          // el gráfico del dolor se dispersa hacia el fondo
          .to(`${painFx} .ch-fx-item`, {
            autoAlpha: 0,
            scale: 0.5,
            y: () => gsap.utils.random(-60, 60),
            x: () => gsap.utils.random(-80, 80),
            rotation: () => gsap.utils.random(-30, 30),
            filter: "blur(6px)",
            ease: "power2.in",
            duration: 0.8,
            stagger: { each: 0.03, from: "random" },
          }, "<")
          // la solución florece: gráfico + texto
          .fromTo(solFx,
            { autoAlpha: 0, scale: 0.85, y: 30, filter: "blur(12px)" },
            { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", ease: "expo.out", duration: 1.1 },
            "<0.2")
          .fromTo(`${sel} .ch-story-sol`,
            { autoAlpha: 0, scale: 0.94, filter: "blur(12px)" },
            { autoAlpha: 1, scale: 1, filter: "blur(0px)", ease: "expo.out", duration: 1.1 }, "<")
          .to({}, { duration: 0.8 }) // sostiene la solución
          // todo el beat sale empujado hacia el frente
          .to(sel, { autoAlpha: 0, z: zOut, filter: "blur(10px)", ease: "power2.in", duration: 0.9 });
      };

      beat(1);
      beat(2);
      beat(3);
      beat(4);

      // ── Slogan: bloom tipográfico desde el centro
      tl
        .fromTo(".ch-beat-slogan",
          { autoAlpha: 0, scale: 0.85, filter: "blur(16px)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", ease: "expo.out", duration: 1.6 })
        .to({}, { duration: 1.2 })
        .to(".ch-beat-slogan", { autoAlpha: 0, scale: 1.06, filter: "blur(10px)", ease: "power2.in", duration: 1 });

      // (Remate eliminado — el slogan cierra el acto antes del CTA)

      // ── CTA: el escenario se contrae y aparece la llamada a la acción
      tl
        .set(".ch-cta", { autoAlpha: 1 })
        .to(".ch-story", { autoAlpha: 0, ease: "power2.in", duration: 1 }, "pullback")
        .to(".ch-card", { width: isMobile ? "92vw" : "84vw", height: isMobile ? "90vh" : "82vh", borderRadius: isMobile ? "28px" : "36px", ease: "expo.inOut", duration: 1.6 }, "pullback")
        .to(".ch-cta", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.6 }, "pullback");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground"
      style={{ perspective: "1500px" }}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="ch-grain" aria-hidden />
      <div className="ch-grid pointer-events-none absolute inset-0 z-0" aria-hidden />

      {/* Texto editorial de fondo */}
      <div className="ch-hero-text absolute z-10 flex w-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="ch-track ch-reveal ch-text-matte mb-1 font-sans text-5xl font-bold tracking-tight md:text-7xl lg:text-[5.5rem]">
          El salón que sueñas,
        </h1>
        <h1 className="ch-track-2 ch-reveal ch-text-gradient font-serif text-5xl italic tracking-tight md:text-7xl lg:text-[5.5rem]">
          gestionado solo.
        </h1>
        <p className="ch-track ch-reveal mx-auto mt-6 max-w-lg text-base font-light text-muted-foreground md:text-lg">
          Reservas, agenda, caja y tu propia web. Todo en <span className="font-ashing">Glowapp</span>, <span className="font-medium text-foreground">gratis</span>.
        </p>
      </div>

      {/* CTA final (aparece al final del acto) */}
      <div className="ch-cta ch-reveal pointer-events-auto absolute z-10 flex w-screen flex-col items-center justify-center px-4 text-center">
        <h2 className="ch-text-gradient mb-4 font-serif text-4xl italic tracking-tight md:text-6xl">
          Empieza hoy.
        </h2>
        <p className="mx-auto mb-9 max-w-md text-base font-light text-muted-foreground md:text-lg">
          Crea tu salón en <span className="font-ashing">Glowapp</span> en 5 minutos. Sin permanencia.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button onClick={() => navigate("/onboarding")} className="ch-btn-primary group inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold">
            Crea tu salón gratis
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => document.getElementById("producto")?.scrollIntoView({ behavior: "smooth" })}
            className="ch-btn-ghost inline-flex items-center justify-center rounded-2xl px-7 py-4 text-base font-medium"
          >
            Ver el producto
          </button>
        </div>
      </div>

      {/* Tarjeta física → escenario del relato */}
      <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ perspective: "1500px" }}>
        <div
          ref={cardRef}
          className="ch-card ch-reveal relative flex h-[92vh] w-[92vw] items-center justify-center overflow-hidden rounded-[28px] md:h-[82vh] md:w-[84vw] md:rounded-[36px]"
          style={{ perspective: "1400px" }}
        >
          <div className="ch-sheen" aria-hidden />
          <div ref={stageRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <HeroStory />
          </div>
        </div>
      </div>
    </section>
  );
};
