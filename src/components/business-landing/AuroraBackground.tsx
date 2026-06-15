import { motion } from "framer-motion";

/**
 * Fondo "aurora" para secciones oscuras de la landing de negocios.
 * Base oscura de marca + blobs gradiente (azul→morado) en movimiento lento,
 * haz de luz superior, grano sutil y rejilla tenue. Solo anima transform/opacity
 * (compositor GPU). Pensado para ir detrás de texto blanco.
 */
export const AuroraBackground = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {/* Base oscura con tinte de marca */}
      <div className="absolute inset-0 bg-[#070a16]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, hsl(var(--primary) / 0.45) 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 85% 20%, hsl(var(--accent) / 0.30) 0%, transparent 55%)",
        }}
      />

      {/* Haz de luz superior (la "aurora") */}
      <motion.div
        className="absolute -top-1/3 left-1/2 h-[70%] w-[140%] -translate-x-1/2 blur-[90px]"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, hsl(var(--primary) / 0.0), hsl(var(--primary) / 0.55), hsl(var(--accent) / 0.45), hsl(var(--primary) / 0.0))",
          borderRadius: "50%",
        }}
        animate={{ rotate: [0, 12, -8, 0], scaleX: [1, 1.1, 0.95, 1], opacity: [0.6, 0.85, 0.55, 0.6] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob primario */}
      <motion.div
        className="absolute -top-32 -left-24 h-[560px] w-[560px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.6), transparent 68%)" }}
        animate={{ x: [0, 50, -25, 0], y: [0, 35, -15, 0], scale: [1, 1.12, 0.92, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob acento */}
      <motion.div
        className="absolute top-10 -right-24 h-[520px] w-[520px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.5), transparent 68%)" }}
        animate={{ x: [0, -45, 25, 0], y: [0, 45, -20, 0], scale: [1, 0.9, 1.12, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Realce blanco central (refracción) */}
      <motion.div
        className="absolute top-0 left-1/2 h-[260px] w-[420px] -translate-x-1/2 rounded-full blur-[70px]"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)" }}
        animate={{ scaleX: [1, 1.25, 0.9, 1], opacity: [0.6, 1, 0.5, 0.6] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rejilla tenue */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent 80%)",
        }}
      />

      {/* Grano sutil */}
      <div
        className="absolute inset-0 opacity-[0.5] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Fundido inferior al fondo de página */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
};
