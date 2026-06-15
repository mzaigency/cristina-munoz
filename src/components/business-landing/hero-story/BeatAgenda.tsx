import { Chars } from "./shared";
import { CalendarGrid } from "./motion-primitives";

/**
 * Beat 2 — Agenda con huecos vacíos → agenda llena.
 */
export function BeatAgenda() {
  return (
    <div className="ch-beat ch-beat-2 ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
      {/* PAIN FX — grid con huecos rojos en parallax */}
      <div
        className="ch-pain-fx ch-pain-fx-2 absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
        aria-hidden
      >
        <div
          className="w-full max-w-[420px] px-6"
          style={{ transform: "translateZ(-180px) rotateX(8deg)" }}
        >
          <CalendarGrid filled={false} />
        </div>
      </div>

      <p className="ch-story-pain relative z-10 font-sans text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
        Tu agenda,
        <br />
        llena de <Chars text="huecos" />.
      </p>

      <div className="ch-story-sol absolute inset-0 flex flex-col items-center justify-center px-6">
        <div
          className="ch-sol-fx ch-sol-fx-2 mb-6 w-full"
          style={{ transform: "translateZ(40px)" }}
        >
          <CalendarGrid filled={true} />
        </div>
        <p className="ch-text-gradient font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          Cada hueco, una cita.
        </p>
        <p className="mt-5 text-base font-light text-blue-100/70 md:text-xl">
          Listas de espera y recordatorios que rellenan tu día.
        </p>
      </div>
    </div>
  );
}
