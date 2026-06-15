import { Chars } from "./shared";
import { BookingCard, ChatBubble } from "./motion-primitives";

/**
 * Beat 1 — "El móvil no para".
 * Pain FX: cascada de burbujas de WhatsApp en 3 planos Z.
 * Sol FX:  una única tarjeta "Reserva confirmada" que florece.
 */
export function BeatWhatsapps() {
  return (
    <div className="ch-beat ch-beat-1 ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
      {/* PAIN FX — burbujas en parallax Z */}
      <div
        className="ch-pain-fx ch-pain-fx-1 absolute inset-0 flex flex-col items-stretch justify-center gap-2 px-6 md:px-20"
        style={{ transformStyle: "preserve-3d" }}
        aria-hidden
      >
        <div
          className="flex flex-col gap-2"
          style={{ transform: "translateZ(-220px)" }}
        >
          <ChatBubble text="¿Tenéis hueco mañana?" side="left" />
          <ChatBubble text="¿Cuánto cuesta el balayage?" side="right" />
        </div>
        <div
          className="flex flex-col gap-2"
          style={{ transform: "translateZ(-100px)" }}
        >
          <ChatBubble text="Hola, ¿abrís el sábado?" side="left" />
          <ChatBubble text="¿Puedo cambiar mi cita?" side="right" />
          <ChatBubble text="No me ha llegado confirmación 😬" side="left" />
        </div>
        <div className="flex flex-col gap-2" style={{ transform: "translateZ(40px)" }}>
          <ChatBubble text="¿Hola? ¿Hay alguien?" side="right" />
          <ChatBubble text="Sigo esperando respuesta…" side="left" />
        </div>
      </div>

      {/* PAIN TEXT */}
      <p className="ch-story-pain relative z-10 font-sans text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
        El móvil no para.
        <br />
        <Chars text="WhatsApps" /> a todas horas.
      </p>

      {/* SOL */}
      <div className="ch-story-sol absolute inset-0 flex flex-col items-center justify-center px-6">
        <div
          className="ch-sol-fx ch-sol-fx-1 mb-6 w-full"
          style={{ transform: "translateZ(30px)" }}
        >
          <BookingCard />
        </div>
        <p className="ch-text-gradient font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          <span className="font-ashing not-italic">Glowapp</span> responde por ti.
        </p>
        <p className="mt-5 text-base font-light text-blue-100/70 md:text-xl">
          Reservas solas, 24/7. Tú, tranquila.
        </p>
      </div>
    </div>
  );
}
