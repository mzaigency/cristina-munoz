import { ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { motion, useSpring } from "framer-motion";

/** Curva de easing de marca (Emil Kowalski, más fuerte que las nativas). */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Tarjeta navy premium — mismo lenguaje que el hero cinemático. */
export const brandCard: React.CSSProperties = {
  background: "linear-gradient(150deg, hsl(223 55% 17%) 0%, hsl(258 45% 8%) 100%)",
  boxShadow:
    "0 40px 90px -30px rgba(20,22,48,.5), inset 0 1px 2px rgba(255,255,255,.14)",
};

/** Gradiente de marca azul→morado en texto. */
export const gradientText: React.CSSProperties = {
  background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export const gradientBg = "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))";

/* ---------- Eyebrow / cabecera de sección ---------- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-accent">
      {children}
    </span>
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}
export function SectionHeader({ eyebrow, title, subtitle, className = "" }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`mx-auto max-w-2xl text-center ${className}`}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* ---------- Contador animado (no re-renderiza React por frame) ---------- */

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  /** Más rígido = más rápido al asentarse. */
  stiffness?: number;
  damping?: number;
  className?: string;
}
export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString("es-ES"),
  stiffness = 90,
  damping = 20,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(value, { stiffness, damping });

  // format puede ser una arrow inline (identidad nueva por render): la guardamos
  // en una ref para no re-suscribir el spring en cada render.
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  // El texto se gestiona SOLO de forma imperativa sobre un <span> sin hijos de
  // React, para no chocar con la reconciliación de React (insertBefore errors).
  useLayoutEffect(() => {
    const write = (v: number) => {
      if (ref.current) ref.current.textContent = formatRef.current(v);
    };
    write(spring.get());
    return spring.on("change", write);
  }, [spring]);

  return <span ref={ref} className={className} />;
}
