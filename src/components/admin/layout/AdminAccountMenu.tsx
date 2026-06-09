import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, LogOut, MoreHorizontal, Globe } from "lucide-react";

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
 * Compact 3-dot menu that lives next to the user pill in the sidebar foot.
 * Holds the secondary actions (view public site, sign out) that used to clutter
 * the sidebar.
 */
export function AdminAccountMenu({
  tenantName,
  logoUrl,
  userEmail,
  plan,
  onViewWeb,
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
        className="w-72 p-0 rounded-2xl border border-[var(--gp-line)] shadow-[0_18px_50px_-16px_rgba(20,22,40,.34)] overflow-hidden bg-[var(--gp-surface)]"
      >
        {/* Header card */}
        <div className="flex items-center gap-3 p-4 bg-[var(--gp-chip)]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-11 w-11 rounded-xl object-cover ring-1 ring-black/5 flex-shrink-0"
            />
          ) : (
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
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

        <DropdownMenuSeparator className="m-0 bg-[var(--gp-line)]" />

        <div className="p-1.5">
          <DropdownMenuItem
            onClick={onViewWeb}
            className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-[var(--gp-ink)] focus:bg-[var(--gp-chip)]"
          >
            <Globe className="h-4 w-4 text-[var(--gp-muted-c)]" strokeWidth={2} />
            Ver web pública
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="m-0 bg-[var(--gp-line2)]" />

        <div className="p-1.5">
          <DropdownMenuItem
            onClick={onSignOut}
            className="gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Cerrar sesión
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
