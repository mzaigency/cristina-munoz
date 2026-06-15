/**
 * Relato del acto 2 del hero — scrollytelling kinético-abstracto.
 *
 * Solo markup presentacional. NO contiene lógica de animación: el timeline GSAP
 * de `CinematicHero` lo conduce vía `gsap.context` scopeado al contenedor pinned
 * (las clases `.ch-beat-*`, `.ch-story-pain`, `.ch-story-sol`, `.ch-char`,
 * `.ch-story-glow` se resuelven porque esto se renderiza dentro del escenario).
 *
 * Tres beats dolor→solución + slogan + remate. La palabra-dolor (`WhatsApps`,
 * `a mano`, `caos`) va partida carácter a carácter en spans `.ch-char` para que
 * el timeline la desintegre (scatter + blur) al llegar la solución de Glowapp.
 */

/** Parte una palabra en spans por carácter (para desintegración GSAP). */
function Chars({ text }: { text: string }) {
  return (
    <span className="ch-word">
      {Array.from(text).map((c, i) => (
        <span key={i} className="ch-char inline-block will-change-transform">
          {c}
        </span>
      ))}
    </span>
  );
}

export function HeroStory() {
  return (
    <div
      className="ch-story absolute inset-0 z-10 flex items-center justify-center"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Escenario 3D — rota con el parallax de ratón (stageRef en CinematicHero) */}
      <div
        className="ch-story-stage relative h-full w-full will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Blobs glow a distintas profundidades → parallax real bajo el tilt */}
        <div
          className="ch-story-glow pointer-events-none absolute left-[12%] top-[18%] h-[42vmin] w-[42vmin] rounded-full opacity-70"
          style={{ transform: "translateZ(-360px)", background: "radial-gradient(circle, hsl(var(--primary)/0.55), transparent 68%)" }}
          aria-hidden
        />
        <div
          className="ch-story-glow pointer-events-none absolute right-[10%] bottom-[14%] h-[50vmin] w-[50vmin] rounded-full opacity-60"
          style={{ transform: "translateZ(-260px)", background: "radial-gradient(circle, hsl(var(--accent)/0.5), transparent 70%)" }}
          aria-hidden
        />
        <div
          className="ch-story-glow pointer-events-none absolute left-1/2 top-1/2 h-[30vmin] w-[30vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50"
          style={{ transform: "translateZ(-160px)", background: "radial-gradient(circle, #c084fc88, transparent 72%)" }}
          aria-hidden
        />

        {/* ───────── Beat 1 · WhatsApps ───────── */}
        <div className="ch-beat ch-beat-1 ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="ch-story-pain font-sans text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Todo el día
            <br />
            respondiendo <Chars text="WhatsApps" />.
          </p>
          <div className="ch-story-sol absolute inset-0 flex flex-col items-center justify-center px-6">
            <p className="ch-sol-main ch-text-gradient font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              <span className="font-ashing not-italic">Glowapp</span> responde por ti.
            </p>
            <p className="ch-sol-sub mt-5 text-base font-light text-blue-100/70 md:text-xl">
              Reservas solas, 24/7.
            </p>
          </div>
        </div>

        {/* ───────── Beat 2 · contabilidad ───────── */}
        <div className="ch-beat ch-beat-2 ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="ch-story-pain font-sans text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            La contabilidad,
            <br />
            <Chars text="a mano" />, cada noche.
          </p>
          <div className="ch-story-sol absolute inset-0 flex flex-col items-center justify-center px-6">
            <p className="ch-sol-main ch-text-gradient font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              La caja se cuadra sola.
            </p>
            <p className="ch-sol-sub mt-5 text-base font-light text-blue-100/70 md:text-xl">
              Cada cobro, contado solo.
            </p>
          </div>
        </div>

        {/* ───────── Beat 3 · agenda ───────── */}
        <div className="ch-beat ch-beat-3 ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="ch-story-pain font-sans text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            La agenda,
            <br />
            siempre un <Chars text="caos" />.
          </p>
          <div className="ch-story-sol absolute inset-0 flex flex-col items-center justify-center px-6">
            <p className="ch-sol-main ch-text-gradient font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Cada cita, en su sitio.
            </p>
            <p className="ch-sol-sub mt-5 text-base font-light text-blue-100/70 md:text-xl">
              Sin plantones, sin huecos.
            </p>
          </div>
        </div>

        {/* ───────── Slogan ───────── */}
        <div className="ch-beat ch-beat-slogan ch-story-layer pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-sans text-3xl font-bold leading-[1.06] tracking-tight text-white md:text-5xl lg:text-6xl">
            El software de salón
          </p>
          <p className="ch-text-gradient mt-1 font-serif text-4xl italic leading-[1.06] tracking-tight md:text-6xl lg:text-7xl">
            que no te cuesta nada.
          </p>
        </div>

        {/* ───────── Remate ───────── */}
        <div className="ch-beat ch-beat-remate ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <h2 className="ch-remate relative font-serif text-4xl italic leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl">
            Tú, a hacer brillar el salón.
            <span className="ch-shine pointer-events-none absolute inset-0" aria-hidden />
          </h2>
        </div>
      </div>
    </div>
  );
}
