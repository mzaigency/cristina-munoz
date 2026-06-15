/**
 * Motion primitives para los beats del HeroStory.
 *
 * Solo markup presentacional (SVG inline + capas con `translateZ`). El timeline
 * GSAP del CinematicHero los anima vía las clases `.ch-fx-layer`, `.ch-fx-item`
 * y los selectores específicos `.ch-pain-fx-N` / `.ch-sol-fx-N`.
 */

/** Burbuja de chat estilo iOS para el beat 1. */
export function ChatBubble({
  text,
  side = "left",
  tone = "muted",
}: {
  text: string;
  side?: "left" | "right";
  tone?: "muted" | "brand";
}) {
  const isRight = side === "right";
  const bg =
    tone === "brand"
      ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))"
      : "rgba(0,0,0,0.04)";
  const color = tone === "brand" ? "#fff" : "rgba(0,0,0,0.72)";
  return (
    <div
      className="ch-fx-item flex max-w-[78%] items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium leading-snug shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md md:text-base"
      style={{
        background: bg,
        color,
        alignSelf: isRight ? "flex-end" : "flex-start",
        borderTopLeftRadius: isRight ? 18 : 6,
        borderTopRightRadius: isRight ? 6 : 18,
        border: tone === "brand" ? "none" : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {tone === "muted" && (
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
      )}
      <span className="truncate">{text}</span>
    </div>
  );
}

/** Tarjeta "Reserva confirmada" — estado solución del beat 1. */
export function BookingCard() {
  return (
    <div
      className="ch-fx-item mx-auto flex w-full max-w-[320px] items-center gap-3 rounded-2xl border border-black/6 bg-gradient-to-br from-white to-white/70 px-4 py-3 backdrop-blur-xl shadow-lg"
      style={{
        boxShadow:
          "0 12px 40px -12px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.8)",
      }}
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M5 12l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/90">
          Reserva confirmada
        </p>
        <p className="truncate text-base font-semibold text-white">
          Lucía · Corte + color
        </p>
        <p className="text-xs text-white/60">Jueves 18:30 · 1 h 30 min</p>
      </div>
    </div>
  );
}

/** Grid de calendario con slots; usado en beat 2 para huecos vacíos. */
export function CalendarGrid({ filled }: { filled: boolean }) {
  const slots = Array.from({ length: 28 });
  return (
    <div className="ch-fx-item mx-auto grid w-full max-w-[420px] grid-cols-7 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
      {slots.map((_, i) => {
        const isFilled = filled && i % 3 !== 0;
        const isGap = !filled && i % 3 === 0;
        return (
          <div
            key={i}
            className="aspect-[4/5] rounded-md"
            style={{
              background: isFilled
                ? "linear-gradient(160deg, hsl(var(--primary)/0.85), hsl(var(--accent)/0.75))"
                : isGap
                  ? "repeating-linear-gradient(45deg, rgba(239,68,68,0.18) 0 4px, transparent 4px 8px)"
                  : "rgba(255,255,255,0.06)",
              border: isGap
                ? "1px dashed rgba(239,68,68,0.45)"
                : isFilled
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid rgba(255,255,255,0.04)",
              boxShadow: isFilled
                ? "0 4px 12px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)"
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}

/** Recibo de papel para el beat 3 (caja). */
export function PaperReceipt({ amount }: { amount: string }) {
  return (
    <div
      className="ch-fx-item w-[120px] rounded-md bg-[#f7f3ea] px-2.5 py-2 text-[#3a2f24] shadow-[0_18px_30px_-12px_rgba(0,0,0,0.6)] md:w-[140px]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg, transparent 0 14px, rgba(0,0,0,0.04) 14px 15px)",
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
        Ticket
      </p>
      <p className="font-serif text-base font-bold leading-none">{amount}</p>
      <div className="mt-1 h-[2px] w-full bg-[#3a2f24]/20" />
      <div className="mt-1 flex items-end gap-px">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="block w-px bg-[#3a2f24]/80"
            style={{ height: 6 + ((i * 7) % 10) }}
          />
        ))}
      </div>
    </div>
  );
}

/** Cierre de caja digital — estado solución del beat 3. */
export function CashClose({ amountLabel }: { amountLabel: string }) {
  return (
    <div
      className="ch-fx-item mx-auto w-full max-w-[340px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/15 to-white/[0.03] p-5 text-left backdrop-blur-xl"
      style={{
        boxShadow:
          "0 30px 60px -20px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.18)",
      }}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
        Cierre de caja · hoy
      </p>
      <p
        className="mt-1 font-serif text-4xl font-bold leading-none text-white md:text-5xl"
        style={{
          backgroundImage:
            "linear-gradient(100deg, #ffffff 0%, #b9c0d6 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {amountLabel}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-white/70">
        <span>14 servicios</span>
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-semibold text-emerald-300">
          +18% vs ayer
        </span>
      </div>
    </div>
  );
}

/** Resultado de Google "No encontrado" — pain beat 4. */
export function GoogleSearchEmpty() {
  return (
    <div className="ch-fx-item mx-auto w-full max-w-[360px] rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left backdrop-blur-md">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="none">
          <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-xs text-white/70">tu salón cerca de mí</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-3/4 rounded bg-white/10" />
        <div className="h-2 w-2/3 rounded bg-white/10" />
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-red-400/25">
            ✕
          </span>
          Tu salón no aparece
        </div>
      </div>
    </div>
  );
}
