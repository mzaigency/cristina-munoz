import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ClientPageHeaderProps {
  /** Título de la pantalla (h1) */
  title: string;
  /** Subtítulo opcional; oculto en móvil para no comer alto */
  subtitle?: string;
  /** Contenido a la izquierda del título (logo en móvil, back, etc.) */
  leading?: ReactNode;
  /** Acciones a la derecha (campana, botones) */
  actions?: ReactNode;
  /** Fila secundaria: pestañas, filtros… va bajo el título, dentro del sticky */
  children?: ReactNode;
  className?: string;
}

/**
 * Cabecera única de las pantallas del cliente.
 * Mismos espacios, altura, tipografías y safe-area en Inicio, Mis Citas,
 * Mensajes y Mi Perfil. No inventar cabeceras propias por pantalla.
 */
export function ClientPageHeader({
  title,
  subtitle,
  leading,
  actions,
  children,
  className,
}: ClientPageHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40", className)}>
      <div className="bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 border-b border-line">
        <div className="h-[env(safe-area-inset-top)]" />

        {/* Fila 1 — siempre 60px en móvil / 64px en escritorio */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] md:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {leading}
            <div className={cn("flex flex-col min-w-0", leading && "md:flex hidden")}>
              <h1 className="text-[19px] md:text-2xl font-bold tracking-tight text-foreground leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden md:block text-sm text-muted-foreground leading-tight mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>

        {/* Fila 2 opcional — pestañas / filtros */}
        {children && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2.5">{children}</div>
        )}
      </div>
    </header>
  );
}
