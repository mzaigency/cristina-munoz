import { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  /** Subtle line below title (default true). */
  divider?: boolean;
  description?: ReactNode;
  accentColor?: string | null;
  align?: "left" | "center";
  className?: string;
}

/**
 * Cabecera de sección de la web pública (firma Glowapp clara).
 * Rótulo pequeño en azul de marca + título en la tipografía del cuerpo
 * (una sola fuente; el override de .font-editorial en index.css lo hace
 * Jakarta bold). La "palabra acento" que pasan los callers en
 * .font-editorial-italic sale en el gradiente de marca. Sin serif, sin
 * mayúsculas tracked — nada de plantilla editorial.
 */
export function SectionHeader({
  eyebrow,
  title,
  divider = true,
  description,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <header className={`flex flex-col ${alignClass} mb-6 md:mb-9 ${className}`}>
      {eyebrow && <span className="tv-kicker mb-1.5 lowercase">{eyebrow}</span>}

      <h2
        className="font-editorial text-neutral-900 leading-[1.1] tracking-[-0.02em]"
        style={{ fontSize: "clamp(1.35rem, 3.2vw, 2.1rem)" }}
      >
        {title}
      </h2>

      {divider && (
        <div className={`mt-4 h-[3px] w-9 rounded-full ${align === "center" ? "self-center" : ""}`} style={{ background: "linear-gradient(100deg, #22408C, #98329A)" }} />
      )}

      {description && (
        <p
          className="mt-3.5 text-[14px] md:text-[16px] text-neutral-500 leading-relaxed font-body max-w-2xl"
          style={align === "center" ? { textAlign: "center" } : undefined}
        >
          {description}
        </p>
      )}
    </header>
  );
}
