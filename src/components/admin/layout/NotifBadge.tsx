import { cn } from "@/lib/utils";

interface NotifBadgeProps {
  /** Numeric count. If 0 or undefined, badge is hidden (unless `forceDot`). */
  count?: number;
  /** If true, renders a small dot only (no number) when count > 0. Used for top-level tabs. */
  dot?: boolean;
  /** Absolute positioning preset. */
  position?: "top-right"|"inline";
  className?: string;
}

/**
 * Unified notification badge used across the admin panel.
 * - `dot` mode (top-level nav): tiny red pulse, no number — keeps the nav clean.
 * - count mode (sub-nav): pill with the number, capped at 99+.
 */
export function NotifBadge({ count = 0, dot = false, position = "top-right", className }: NotifBadgeProps) {
  if (!count || count <= 0) return null;

  const positionClasses =
    position === "top-right"?"absolute -top-1 -right-1":"relative";

  if (dot) {
    return (
      <span
        aria-hidden="true"className={cn( positionClasses,"flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background shadow-sm",
          "before:absolute before:inset-0 before:rounded-full before:bg-destructive before:animate-ping before:opacity-60",
          className,
        )}
      />
    );
  }

  const display = count > 99 ? "99+": String(count); return ( <span aria-label={`${count} pendientes`} className={cn( positionClasses,"inline-flex h-5 min-w-[20px] items-center justify-center rounded-full",
        "bg-destructive text-destructive-foreground font-bold text-[11px] leading-none px-1.5",
        "ring-2 ring-background shadow-sm",
        className,
      )}
    >
      {display}
    </span>
  );
}
