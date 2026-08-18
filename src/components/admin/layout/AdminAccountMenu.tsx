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
        className="gp-acct-trigger"
        aria-label="Más opciones de cuenta"
      >
        <MoreHorizontal style={{ width: 16, height: 16 }} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        className="relative w-72 p-0 rounded-2xl overflow-hidden border border-white/40 dark:border-white/10 bg-white supports-[backdrop-filter]:bg-white/80 dark:bg-zinc-900 dark:supports-[backdrop-filter]:bg-zinc-900/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_18px_50px_-16px_rgba(20,22,40,.34),0_0_0_1px_rgba(255,255,255,0.55)_inset] dark:shadow-[0_18px_50px_-16px_rgba(0,0,0,.55),0_0_0_1px_rgba(255,255,255,0.08)_inset]"
      >
        {/* Liquid glass refraction layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, var(--gp-accent, #8B5CF6) 28%, transparent) 0%, transparent 55%), radial-gradient(100% 70% at 100% 100%, rgba(217, 70, 239, 0.18) 0%, transparent 55%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20"
        />

        <div className="relative">
          {/* Header card */}
          <div className="flex items-center gap-3 p-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/60 dark:ring-white/10 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ring-1 ring-white/60 dark:ring-white/10 shadow-sm"
                style={{
                  background:
                    "linear-gradient(150deg, var(--gp-accent), color-mix(in oklab, var(--gp-accent), #99329a 55%))",
                }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-[var(--gp-ink)] truncate leading-tight">
                {tenantName}
              </p>
              <p className="text-[11.5px] text-[var(--gp-muted-c)] truncate font-medium">
                {userEmail}
              </p>
              {planLabel && (
                <span
                  className="inline-flex mt-2 items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    background: "var(--gp-accent-soft)",
                    color: "var(--gp-accent-ink)",
                  }}
                >
                  Plan {planLabel}
                </span>
              )}
            </div>
          </div>

          <DropdownMenuSeparator className="m-0 bg-white/40 dark:bg-white/10" />

          <div className="p-1.5">
            <DropdownMenuItem
              onClick={onGoHome}
              className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-[var(--gp-ink)] focus:bg-white/60 dark:focus:bg-white/10"
            >
              <Home className="h-4 w-4 text-[var(--gp-muted-c)]" strokeWidth={2} />
              Inicio
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onViewWeb}
              className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-[var(--gp-ink)] focus:bg-white/60 dark:focus:bg-white/10"
            >
              <Globe className="h-4 w-4 text-[var(--gp-muted-c)]" strokeWidth={2} />
              Ver web pública
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="m-0 bg-white/40 dark:bg-white/10" />

          <div className="p-1.5">
            <DropdownMenuItem
              onClick={onSignOut}
              className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-red-600 focus:bg-red-50/80 focus:text-red-700"
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
