import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, LayoutGroup } from "motion/react";
import {
  Compass,
  Calendar,
  MessageCircle,
  User,
  ShieldCheck,
  Crown,
  Building2,
  LogOut,
  LogIn,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import glowappWordmark from "@/assets/glowapp-wordmark.png";

export function ClientSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const { tenant, isAdmin, isStylist } = useCurrentUserTenant();
  const { unreadCount } = useUnreadMessages();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      setUserName("");
      setIsSuperadmin(false);
      return;
    }

    const fetchProfileAndRole = async () => {
      // 1. Perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, username")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setAvatarUrl(profile.avatar_url || null);
        setUserName(profile.full_name || profile.username || user.email?.split("@")[0] || "Mi Cuenta");
      } else {
        setUserName(user.email?.split("@")[0] || "Mi Cuenta");
      }

      // 2. Superadmin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .maybeSingle();

      setIsSuperadmin(!!roleData);
    };

    fetchProfileAndRole();
  }, [user?.id]);

  const isCurrentActive = (path: string) => {
    const current = location.pathname;
    if (path === "/" && current === "/") return true;
    if (path !== "/" && current.startsWith(path)) return true;
    return false;
  };

  const isManager = (isAdmin || isStylist) && !!tenant;
  const adminPath = tenant?.slug ? `/admin/${tenant.slug}` : "/admin";

  const navItems = [
    {
      label: "Explorar",
      path: "/",
      icon: Compass,
    },
    {
      label: "Mis Citas",
      path: "/mis-citas",
      icon: Calendar,
    },
    {
      label: "Mensajes",
      path: "/mensajes",
      icon: MessageCircle,
      badge: unreadCount,
    },
    {
      label: "Mi Perfil",
      path: "/perfil",
      icon: User,
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 w-64 z-30 bg-[var(--glow-surface)] border-r border-[var(--glow-line)] select-none"
      aria-label="Navegación principal de escritorio"
    >
      {/* ── Brand Header ── */}
      <div className="px-5 py-5 border-b border-[var(--glow-line)]/70">
        <Link
          to="/"
          className="flex items-center group transition-transform duration-200 active:scale-98"
          title="Glowapp - Inicio"
        >
          <img
            src={glowappWordmark}
            alt="Glowapp"
            className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </Link>
      </div>

      {/* ── Main Navigation ── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 no-scrollbar">
        <div className="px-3 pb-2 pt-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Navegación
        </div>

        <LayoutGroup id="client-sidebar-nav">
          {navItems.map((item) => {
            const active = isCurrentActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-150 group",
                  active
                    ? "text-[var(--glow-brand-ink)] font-bold"
                    : "text-[var(--glow-ink-2)] hover:text-foreground hover:bg-[var(--glow-sunk)]",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="clientSidebarActivePill"
                    className="absolute inset-0 bg-[var(--glow-brand-soft)] border border-[var(--glow-brand)]/20 rounded-xl -z-10 shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                <span
                  className={cn(
                    "relative z-10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0",
                    active ? "text-[var(--glow-brand)]" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {item.path === "/perfil" && avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className={cn(
                        "w-5 h-5 rounded-full object-cover shrink-0 transition-all",
                        active ? "ring-2 ring-[var(--glow-brand)] scale-105" : "ring-1 ring-border/70",
                      )}
                    />
                  ) : (
                    <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.3 : 2} />
                  )}
                </span>

                <span className="relative z-10 truncate">{item.label}</span>

                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="relative z-10 ml-auto h-5 min-w-[20px] px-1.5 bg-rose-500 text-white text-[10.5px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </LayoutGroup>

        {/* ── Business / Management Shortcuts ── */}
        {(isManager || isSuperadmin) && (
          <div className="mt-5 pt-4 border-t border-[var(--glow-line)]/70 flex flex-col gap-1">
            <div className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Administración
            </div>

            {isManager && (
              <Link
                to={adminPath}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all group",
                  isCurrentActive(adminPath)
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10",
                )}
              >
                <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate leading-tight">Panel del Salón</span>
                  {tenant?.name && (
                    <span className="text-[11px] text-muted-foreground truncate leading-tight font-normal">
                      {tenant.name}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {isSuperadmin && (
              <Link
                to="/superadmin"
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all group",
                  isCurrentActive("/superadmin")
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-amber-500/10",
                )}
              >
                <Crown className="h-4.5 w-4.5 text-amber-500 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">Superadmin</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-[var(--glow-line)] flex flex-col gap-2.5 bg-[var(--glow-surface)]">
        {/* Call to action "Para negocios" */}
        <Link
          to="/negocios"
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white shadow-md shadow-[var(--glow-brand)]/20 hover:shadow-lg hover:shadow-[var(--glow-brand)]/30 hover:brightness-105 transition-all text-center"
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span>Para negocios</span>
        </Link>

        {/* User Card */}
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[var(--glow-surface)] hover:bg-[var(--glow-sunk)] border border-[var(--glow-line)] transition-all">
            <Link
              to="/perfil"
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
              title="Ver mi perfil"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover border border-line shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[var(--glow-brand-soft)] text-[var(--glow-brand)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--glow-brand)]/20">
                  {userName ? userName[0]?.toUpperCase() : "U"}
                </div>
              )}
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {userName || "Mi Cuenta"}
                </span>
                <span className="text-[10.5px] text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/auth");
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--glow-line)] hover:bg-[var(--glow-sunk)] text-foreground text-xs font-bold transition-all shadow-xs"
          >
            <LogIn className="h-3.5 w-3.5 text-primary" />
            <span>Iniciar Sesión</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
