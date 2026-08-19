import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, LogOut, MoreHorizontal, Globe, Home } from "lucide-react";

interface AdminAccountMenuProps {
  tenantName: string;
  tenantSlug: string;
  logoUrl?: string | null;
  userEmail: string;
  plan?: string | null;
  onViewWeb: () => void;
  onGoHome: () => void;
  onSignOut: () => void;
}

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  premium: "Premium",
};

/**
 * Compact 3-dot menu in the sidebar foot. Liquid-glass surface holds the
 * account header plus the secondary actions (Inicio, view public site, sign out).
 */
export function AdminAccountMenu({
  tenantName,
  logoUrl,
  userEmail,
  plan,
  onViewWeb,
  onGoHome,
  onSignOut,
}: AdminAccountMenuProps) {
  const planLabel = plan ? PLAN_LABEL[plan] || plan : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="glow-acct-trigger"
        aria-label="Más opciones de cuenta"
      >
        <MoreHorizontal style={{ width: 16, height: 16 }} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        className="relative w-72 p-0 rounded-2xl overflow-hidden border border-white/40 bg-white supports-[backdrop-filter]:bg-white/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_18px_50px_-16px_rgba(20,22,40,.34),0_0_0_1px_rgba(255,255,255,0.55)_inset]"
      >
        {/* Liquid glass refraction layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, var(--glow-brand) 28%, transparent) 0%, transparent 55%), radial-gradient(100% 70% at 100% 100%, rgb(var(--glow-accent-rgb) / .18) 0%, transparent 55%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
        />

        <div className="relative">
          {/* Header card */}
          <div className="flex items-center gap-3 p-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/60 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ring-1 ring-white/60 shadow-sm"
                style={{
                  background:
                    "linear-gradient(150deg, var(--glow-brand), color-mix(in oklab, var(--glow-brand), var(--glow-accent) 55%))",
                }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-[var(--glow-ink)] truncate leading-tight">
                {tenantName}
              </p>
              <p className="text-[11.5px] text-[var(--glow-ink-3)] truncate font-medium">
                {userEmail}
              </p>
              {planLabel && (
                <span
                  className="inline-flex mt-2 items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    background: "var(--glow-brand-soft)",
                    color: "var(--glow-brand-ink)",
                  }}
                >
                  Plan {planLabel}
                </span>
              )}
            </div>
          </div>

          <DropdownMenuSeparator className="m-0 bg-white/40" />

          <div className="p-1.5">
            <DropdownMenuItem
              onClick={onGoHome}
              className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-[var(--glow-ink)] focus:bg-white/60"
            >
              <Home className="h-4 w-4 text-[var(--glow-ink-3)]" strokeWidth={2} />
              Inicio
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onViewWeb}
              className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-[var(--glow-ink)] focus:bg-white/60"
            >
              <Globe className="h-4 w-4 text-[var(--glow-ink-3)]" strokeWidth={2} />
              Ver web pública
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="m-0 bg-white/40" />

          <div className="p-1.5">
            <DropdownMenuItem
              onClick={onSignOut}
              className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-glow-danger-ink focus:bg-glow-danger/80 focus:text-glow-danger-ink"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Cerrar sesión
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
