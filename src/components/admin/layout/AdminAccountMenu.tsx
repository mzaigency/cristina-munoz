import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Home, LogOut, Scissors, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * Desktop account menu — unifies "Ver web", "Inicio" and "Cerrar sesión"
 * behind a single avatar trigger. Keeps the header uncluttered.
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
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 px-1.5 gap-2 rounded-full hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menú de cuenta"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/30">
              <Scissors className="h-4 w-4 text-primary" />
            </div>
          )}
          {planLabel && (
            <span
              className={cn(
                "hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                "text-[10px] font-semibold uppercase tracking-wide",
                "bg-gradient-to-r from-primary/15 to-purple-500/15 text-primary",
              )}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {planLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{tenantName}</p>
              <p className="text-[11px] font-normal text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewWeb} className="gap-2 cursor-pointer">
          <ExternalLink className="h-4 w-4" />
          Ver web pública
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGoHome} className="gap-2 cursor-pointer">
          <Home className="h-4 w-4" />
          Inicio
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSignOut}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
