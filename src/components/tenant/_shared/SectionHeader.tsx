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
 * Cabecera de sección de la web pública. El vibe del tenant (clase tv-* del
 * contenedor) decide la voz tipográfica vía CSS (.tv-section-*).
 *
 * Sin "eyebrow" en mayúsculas con rayitas: esa gramática (— LABEL —) es la
 * plantilla genérica de IA que queremos matar. El label ahora es una palabra
 * pequeña en el color del salón, en minúsculas, pegada al título.
 */
export function SectionHeader({
  eyebrow,
  title,
  divider = true,
  description,
  accentColor,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const accent = accentColor || "hsl(var(--primary))";
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <header className={`tv-section-header flex flex-col ${alignClass} mb-10 md:mb-14 ${className}`}>
      {eyebrow && (
        <span
          className="tv-section-eyebrow text-[13px] font-body font-bold lowercase mb-2.5"
          style={{ color: accent }}
        >
          {eyebrow.toLowerCase()}
        </span>
      )}

      <h2
        className="tv-section-title font-editorial text-neutral-900 leading-[1.04]"
        style={{ fontSize: "clamp(2rem, 4.2vw, 3.25rem)" }}
      >
        {title}
      </h2>

      {divider && (
        <div
          className={`tv-section-divider mt-6 h-px w-16 ${align === "center" ? "self-center" : ""}`}
          style={{ background: `color-mix(in oklab, ${accent}, transparent 55%)` }}
        />
      )}

      {description && (
        <p
          className="mt-6 text-base md:text-[17px] text-neutral-600 leading-relaxed font-body max-w-2xl"
          style={align === "center" ? { textAlign: "center" } : undefined}
        >
          {description}
        </p>
      )}
    </header>
  );
}
