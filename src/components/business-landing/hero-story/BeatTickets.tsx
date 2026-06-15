import { Chars } from "./shared";
import { CashClose, PaperReceipt } from "./motion-primitives";

/**
 * Beat 3 — Tickets en una caja → cierre digital.
 */
export function BeatTickets() {
  const tickets = [
    { amount: "€ 28", x: "8%", y: "10%", z: -280, r: -14 },
    { amount: "€ 65", x: "72%", y: "8%", z: -220, r: 10 },
    { amount: "€ 42", x: "15%", y: "72%", z: -160, r: -6 },
    { amount: "€ 18", x: "65%", y: "78%", z: -100, r: 18 },
    { amount: "€ 95", x: "78%", y: "28%", z: -40, r: -3 },
    { amount: "€ 32", x: "85%", y: "65%", z: 20, r: 7 },
    { amount: "€ 50", x: "5%", y: "55%", z: 60, r: -22 },
  ];

  return (
    <div className="ch-beat ch-beat-3 ch-story-layer pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
      {/* PAIN FX — tickets desperdigados */}
      <div
        className="ch-pain-fx ch-pain-fx-3 absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        aria-hidden
      >
        {tickets.map((t, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: t.x,
              top: t.y,
              transform: `translateZ(${t.z}px) rotate(${t.r}deg)`,
            }}
          >
            <PaperReceipt amount={t.amount} />
          </div>
        ))}
      </div>

      <p className="ch-story-pain relative z-10 font-sans text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
        Cuadras la caja
        <br />
        <Chars text="a mano" />, cada noche.
      </p>

      <div className="ch-story-sol absolute inset-0 flex flex-col items-center justify-center px-6">
        <div
          className="ch-sol-fx ch-sol-fx-3 mb-6 w-full"
          style={{ transform: "translateZ(40px)" }}
        >
          <CashClose amountLabel="€ 1.247" />
        </div>
        <p className="ch-text-gradient font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          Cada euro, contado solo.
        </p>
        <p className="mt-5 text-base font-light text-muted-foreground md:text-xl">
          Caja, ingresos y comisiones, en tiempo real.
        </p>
      </div>
    </div>
  );
}
