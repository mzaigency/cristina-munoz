/**
 * Fondo de la landing de negocios: base clara + rejilla sutil + glow radial
 * violeta de marca. Pensado como capa fija detrás del contenido (las secciones
 * van transparentes para que se vea). Solo decorativo.
 */
export const LandingBackground = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 bg-white ${className}`} aria-hidden>
      {/* Rejilla + glow violeta central */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(71,85,105,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(71,85,105,0.07) 1px, transparent 1px),
            radial-gradient(circle at 50% 18%, hsl(var(--accent) / 0.16) 0%, hsl(var(--primary) / 0.08) 38%, transparent 78%)
          `,
          backgroundSize: "34px 34px, 34px 34px, 100% 100%",
        }}
      />
      {/* Glow secundario inferior */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55vh]"
        style={{
          backgroundImage: "radial-gradient(circle at 75% 100%, hsl(var(--primary) / 0.10) 0%, transparent 60%)",
        }}
      />
    </div>
  );
};

export default LandingBackground;
