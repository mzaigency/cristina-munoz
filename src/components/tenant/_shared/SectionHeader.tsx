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
    <header className={`flex flex-col ${alignClass} mb-9 md:mb-12 ${className}`}>
      {eyebrow && <span className="tv-kicker mb-2 lowercase">{eyebrow}</span>}

      <h2
        className="font-editorial text-neutral-900 leading-[1.08]"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.6rem)" }}
      >
        {title}
      </h2>

      {divider && (
        <div className={`mt-5 h-[3px] w-9 rounded-full ${align === "center" ? "self-center" : ""}`} style={{ background: "linear-gradient(100deg, #22408C, #98329A)" }} />
      )}

      {description && (
        <p
          className="mt-5 text-base md:text-[17px] text-neutral-600 leading-relaxed font-body max-w-2xl"
          style={align === "center" ? { textAlign: "center" } : undefined}
        >
          {description}
        </p>
      )}
    </header>
  );
}
