import { Chars } from "./shared";
import { GoogleSearchEmpty } from "./motion-primitives";
import cristinaMobileAsset from "@/assets/business-landing/cristina-mobile.png.asset.json";
const cristinaMobile = cristinaMobileAsset.url;

/**
 * Beat 4 — Sin web, invisible → tu propia web en 5 min.
 */
export function BeatWeb() {
  return (
    <div className="ch-beat ch-beat-4 ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
      {/* PAIN FX — búsqueda fallida en Google, desplazada arriba para no tapar el texto */}
      <div
        className="ch-pain-fx ch-pain-fx-4 absolute inset-0 flex flex-col items-center justify-start pt-[12vh]"
        style={{ transformStyle: "preserve-3d" }}
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-[12vh] -translate-x-1/2"
          style={{ transform: "translate(-50%, 0) translateZ(-220px)" }}
        >
          <div className="flex gap-3 opacity-60 blur-[1px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 w-32 rounded-xl border border-white/10 bg-white/[0.05]"
              />
            ))}
          </div>
        </div>
        <div style={{ transform: "translateZ(0px)" }}>
          <GoogleSearchEmpty />
        </div>
      </div>

      <p className="ch-story-pain relative z-10 max-w-[20ch] font-sans text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
        Sin web propia,
        <br />
        eres <Chars text="invisible" />.
      </p>

      <div className="ch-story-sol absolute inset-0 flex flex-col items-center justify-center px-6">
        <div
          className="ch-sol-fx ch-sol-fx-4 mb-5 flex items-center justify-center"
          style={{ transform: "translateZ(50px)" }}
        >
          <div
            className="relative h-[260px] w-[140px] overflow-hidden rounded-[28px] border-2 border-white/15 bg-black md:h-[300px] md:w-[160px]"
            style={{
              boxShadow:
                "0 40px 80px -20px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.15)",
            }}
          >
            <img
              src={cristinaMobile}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-2 top-2 z-10 mx-auto flex h-4 w-14 items-center justify-center rounded-full bg-black/70" />
          </div>
        </div>
        <p className="ch-text-gradient font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          Tu propio sitio, hoy.
        </p>
        <p className="mt-4 text-base font-light text-muted-foreground md:text-xl">
          tusalon<span className="text-foreground/40">.glowapp.app</span> · listo en 5 min
        </p>
      </div>
    </div>
  );
}
