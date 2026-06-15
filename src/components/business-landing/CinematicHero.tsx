import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlowappPhoneCarousel, RING_C, RING_PCT } from "./mockups/GlowappPhoneCarousel";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hero cinemático de Glowapp. Acto pinned corto (híbrido): texto editorial →
 * la tarjeta premium sube y se expande → mockup 3D del producto (Mac en
 * desktop, iPhone en móvil) con parallax de ratón → badges + CTA. Al terminar
 * suelta el scroll a las secciones normales de abajo.
 *
 * Identidad Glowapp: fondo claro, gradiente azul→morado de marca, mezcla de
 * Plus Jakarta Sans + Playfair Display (italic) de la landing de tenant.
 */
const INJECTED_STYLES = `
  .ch-reveal { visibility: hidden; }

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

  /* Texto plateado dentro de la tarjeta oscura */
  .ch-card-silver {
    background: linear-gradient(180deg, #ffffff 0%, #b9c0d6 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    transform: translateZ(0);
    filter: drop-shadow(0 12px 24px rgba(0,0,0,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.4));
  }

  /* Tarjeta física profunda — navy de marca */
  .ch-card {
    background: linear-gradient(150deg, hsl(223 55% 17%) 0%, hsl(258 45% 8%) 100%);
    box-shadow:
      0 40px 100px -20px rgba(0,0,0,0.55),
      0 20px 40px -20px rgba(0,0,0,0.45),
      inset 0 1px 2px rgba(255,255,255,0.18),
      inset 0 -2px 4px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.05);
  }
  .ch-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 40;
    background: radial-gradient(700px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.07) 0%, transparent 42%);
    mix-blend-mode: screen;
  }

  /* Hardware de device */
  .ch-bezel {
    background-color: #0c0c10;
    box-shadow: inset 0 0 0 2px #3a3a44, inset 0 0 0 7px #000,
      0 40px 80px -15px rgba(0,0,0,0.7), 0 15px 25px -5px rgba(0,0,0,0.5);
  }
  .ch-mac-bezel {
    background: linear-gradient(180deg, #1a1a20 0%, #0c0c10 100%);
    box-shadow: inset 0 0 0 1px #34343c, 0 50px 90px -25px rgba(0,0,0,0.6), 0 20px 40px -10px rgba(0,0,0,0.45);
  }
  .ch-screen-glare {
    background: linear-gradient(110deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 45%);
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

  @media (prefers-reduced-motion: reduce) {
    .ch-reveal { visibility: visible !important; }
  }
`;

export const CinematicHero = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Parallax de ratón sobre el device + sheen de la tarjeta
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!cardRef.current || !deviceRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        cardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        cardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(deviceRef.current, { rotationY: xVal * 9, rotationX: -yVal * 9, ease: "power3.out", duration: 1.1 });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Timeline cinemático (pin híbrido)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    const ringCounter = { v: 0 };

    const ctx = gsap.context(() => {
      gsap.set(".ch-reveal", { visibility: "visible" });

      if (reduce) {
        // Estado final estático, sin scrub
        gsap.set([".ch-hero-text"], { autoAlpha: 0 });
        gsap.set([".ch-card", ".ch-device", ".ch-badge", ".ch-card-left", ".ch-card-right", ".ch-cta"], { autoAlpha: 1, clearProps: "transform" });
        gsap.set(".ch-res-ring", { strokeDashoffset: RING_C * (1 - RING_PCT) });
        const el = document.querySelector(".ch-res-count");
        if (el) el.textContent = "127";
        return;
      }

      gsap.set(".ch-track", { autoAlpha: 0, y: 60, scale: 0.88, filter: "blur(16px)" });
      gsap.set(".ch-track-2", { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".ch-card", { y: () => window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".ch-card-left", ".ch-card-right", ".ch-device", ".ch-badge"], { autoAlpha: 0 });
      gsap.set(".ch-cta", { autoAlpha: 0, scale: 0.85, filter: "blur(20px)" });

      const intro = gsap.timeline({ delay: 0.25 });
      intro
        .to(".ch-track", { duration: 1.4, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", ease: "expo.out" })
        .to(".ch-track-2", { duration: 1.2, clipPath: "inset(0 0% 0 0)", autoAlpha: 1, ease: "power4.inOut" }, "-=0.9");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=1800",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      tl
        .to([".ch-hero-text", ".ch-grid"], { scale: 1.12, filter: "blur(16px)", opacity: 0.15, ease: "power2.inOut", duration: 2 }, 0)
        .to(".ch-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".ch-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".ch-device",
          { y: 200, z: -400, rotationX: 42, autoAlpha: 0, scale: 0.72 },
          { y: 0, z: 0, rotationX: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.2 }, "-=0.6")
        .fromTo(".ch-card-right", { x: 70, autoAlpha: 0, scale: 0.85 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.4 }, "-=1.8")
        .fromTo(".ch-card-left", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.3 }, "-=1.4")
        .fromTo(".ch-badge", { y: 70, autoAlpha: 0, scale: 0.7 }, { y: 0, autoAlpha: 1, scale: 1, ease: "back.out(1.5)", duration: 1.2, stagger: 0.16 }, "-=1.3")
        // Anillo de reservas se rellena con el scroll + contador sube
        .to(".ch-res-ring", { strokeDashoffset: RING_C * (1 - RING_PCT), ease: "none", duration: 2.4 }, "ring")
        .to(ringCounter, {
          v: 127, snap: { v: 1 }, ease: "none", duration: 2.4,
          onUpdate: () => {
            const el = document.querySelector(".ch-res-count");
            if (el) el.textContent = String(Math.round(ringCounter.v));
          },
        }, "ring")
        .to({}, { duration: 1 })
        .set(".ch-hero-text", { autoAlpha: 0 })
        .set(".ch-cta", { autoAlpha: 1 })
        .to({}, { duration: 1 })
        .to([".ch-device", ".ch-badge", ".ch-card-left", ".ch-card-right"], { scale: 0.92, y: -30, autoAlpha: 0, ease: "power3.in", duration: 1, stagger: 0.04 })
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
          Reservas, agenda, caja y tu propia web. Todo en Glowapp.
        </p>
      </div>

      {/* CTA final (aparece al final del acto) */}
      <div className="ch-cta ch-reveal pointer-events-auto absolute z-10 flex w-screen flex-col items-center justify-center px-4 text-center">
        <h2 className="ch-text-gradient mb-4 font-serif text-4xl italic tracking-tight md:text-6xl">
          Empieza hoy.
        </h2>
        <p className="mx-auto mb-9 max-w-md text-base font-light text-muted-foreground md:text-lg">
          Crea tu salón en Glowapp en 5 minutos. Sin tarjeta, sin permanencia.
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

      {/* Tarjeta física */}
      <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ perspective: "1500px" }}>
        <div
          ref={cardRef}
          className="ch-card ch-reveal relative flex h-[92vh] w-[92vw] items-center justify-center overflow-hidden rounded-[28px] md:h-[82vh] md:w-[84vw] md:rounded-[36px]"
        >
          <div className="ch-sheen" aria-hidden />

          {/* Composición 3-col: texto · iPhone · wordmark (estilo template) */}
          <div className="relative z-10 mx-auto grid h-full w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 py-10 lg:grid-cols-[0.9fr_auto_0.9fr] lg:gap-4 lg:px-10">
            {/* LEFT — texto */}
            <div className="ch-card-left ch-reveal order-2 text-center lg:order-1 lg:pr-2 lg:text-left">
              <h3 className="font-sans text-2xl font-bold leading-[1.08] tracking-tight text-white md:text-3xl lg:text-[2.6rem]">
                Todo tu salón,<br className="hidden lg:block" /> en una app.
              </h3>
              <p className="mx-auto mt-4 max-w-xs text-sm font-light leading-relaxed text-blue-100/60 lg:mx-0">
                Tú llevas el negocio desde el panel. Tus clientes reservan desde tu web. Sin papeles, sin llamadas, sin líos.
              </p>
            </div>

            {/* CENTER — iPhone con carrusel */}
            <div className="ch-device ch-reveal order-1 flex items-center justify-center lg:order-2" style={{ perspective: "1100px" }}>
              <div ref={deviceRef} className="relative will-change-transform" style={{ transformStyle: "preserve-3d" }}>
                {/* iPhone */}
                <div className="ch-bezel relative h-[500px] w-[244px] rounded-[2.8rem] sm:h-[540px] sm:w-[264px]">
                  {/* botones laterales */}
                  <span className="absolute -left-[3px] top-[110px] h-7 w-[3px] rounded-l bg-gradient-to-r from-[#3a3a44] to-[#15151a]" />
                  <span className="absolute -left-[3px] top-[150px] h-11 w-[3px] rounded-l bg-gradient-to-r from-[#3a3a44] to-[#15151a]" />
                  <span className="absolute -left-[3px] top-[206px] h-11 w-[3px] rounded-l bg-gradient-to-r from-[#3a3a44] to-[#15151a]" />
                  <span className="absolute -right-[3px] top-[165px] h-16 w-[3px] rounded-r bg-gradient-to-l from-[#3a3a44] to-[#15151a]" />
                  {/* pantalla */}
                  <div className="absolute inset-[6px] overflow-hidden rounded-[2.4rem] bg-[#0a0f1e]">
                    <div className="ch-screen-glare pointer-events-none absolute inset-0 z-[60]" aria-hidden />
                    <div className="absolute left-1/2 top-[10px] z-[60] flex h-[26px] w-[92px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-3">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </div>
                    <GlowappPhoneCarousel />
                  </div>
                </div>

                {/* Badge glass — fuera del teléfono (arriba-izq) */}
                <motion.div
                  className="ch-badge ch-reveal absolute -left-6 top-14 flex items-center gap-2.5 rounded-2xl p-3 lg:-left-24"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <div className="text-left">
                    <p className="text-[11px] font-bold leading-tight text-white">Nueva reserva</p>
                    <p className="text-[9px] text-blue-200/60">Confirmada · 17:30</p>
                  </div>
                </motion.div>

                {/* Badge glass — fuera del teléfono (abajo-der) con mini-barras */}
                <motion.div
                  className="ch-badge ch-reveal absolute -right-6 bottom-20 flex flex-col gap-1.5 rounded-2xl p-3 lg:-right-24"
                  animate={{ y: [0, 7, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold text-blue-200/70">Ingresos</p>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400"><TrendingUp className="h-2.5 w-2.5" />+18%</span>
                  </div>
                  <div className="flex h-7 items-end gap-1">
                    {[0.5, 0.75, 0.55, 0.9, 1, 0.7].map((base, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-sm"
                        style={{ background: "linear-gradient(hsl(var(--accent)), hsl(var(--primary)))" }}
                        animate={{ height: [`${base * 55}%`, `${Math.min(base + 0.25, 1) * 100}%`, `${base * 55}%`] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* RIGHT — wordmark gigante */}
            <div className="ch-card-right ch-reveal order-3 flex justify-center lg:order-3 lg:justify-end">
              <h2 className="ch-card-silver font-ashing text-6xl leading-none tracking-tight md:text-8xl lg:text-[6.5rem]">
                Glowapp
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
