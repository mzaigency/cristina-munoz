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
 * Editorial magazine-style section header.
 * Eyebrow (small uppercase accent label) + serif display title + thin divider.
 * Used across all tenant landing sections for consistency.
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
    <header className={`flex flex-col ${alignClass} mb-10 md:mb-14 ${className}`}>
      {eyebrow && (
        <div
          className="inline-flex items-center gap-2.5 text-[10.5px] font-bold tracking-[0.22em] uppercase mb-5"
          style={{ color: accent }}
        >
          <span className="inline-block w-7 h-px" style={{ backgroundColor: accent }} />
          <span>{eyebrow}</span>
          {align === "center" && (
            <span className="inline-block w-7 h-px" style={{ backgroundColor: accent }} />
          )}
        </div>
      )}

      <h2
        className="font-editorial text-neutral-900 tracking-[-0.025em] leading-[1.04]"
        style={{ fontSize: "clamp(2rem, 4.2vw, 3.25rem)" }}
      >
        {title}
      </h2>

      {divider && (
        <div className={`mt-6 h-px bg-neutral-300 w-16 ${align === "center" ? "self-center" : ""}`} />
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
