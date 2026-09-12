import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import {
  Home,
  Calendar,
  MessageCircle,
  User,
  ShieldCheck,
  Crown,
  Building2,
  LogOut,
  LogIn,
  Plus,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostCreator } from "@/components/social/PostCreator";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import glowappWordmark from "@/assets/glowapp-wordmark.png";

export function ClientSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const { tenant, isAdmin, isStylist } = useCurrentUserTenant();
  const { unreadCount } = useUnreadMessages();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [activeInicioSubTab, setActiveInicioSubTab] = useState<"descubrir" | "actividad">("descubrir");
  const [showPostCreator, setShowPostCreator] = useState(false);

  useEffect(() => {
    const feed = searchParams.get("feed");
    if (feed === "following") {
      setActiveInicioSubTab("actividad");
    } else {
      setActiveInicioSubTab("descubrir");
    }
  }, [searchParams]);

  useEffect(() => {
    const handleFeedChanged = (e: CustomEvent<string>) => {
      if (e.detail === "following") setActiveInicioSubTab("actividad");
      else setActiveInicioSubTab("descubrir");
    };
    window.addEventListener("glowapp:feed-mode-changed" as any, handleFeedChanged);
    return () => window.removeEventListener("glowapp:feed-mode-changed" as any, handleFeedChanged);
  }, []);

  const handleInicioSubTabClick = (tab: "descubrir" | "actividad") => {
    setActiveInicioSubTab(tab);
    const targetFeed = tab === "actividad" ? "following" : "discover";
    window.dispatchEvent(new CustomEvent("glowapp:feed-mode", { detail: targetFeed }));
    if (location.pathname !== "/") {
      navigate(tab === "actividad" ? "/?feed=following" : "/");
    } else {
      setSearchParams(tab === "actividad" ? { feed: "following" } : {});
    }
  };

  const currentCitasTab = location.pathname.startsWith("/mis-citas")
    ? searchParams.get("tab") === "history"
      ? "history"
      : searchParams.get("tab") === "waitlist"
      ? "waitlist"
      : "upcoming"
    : "upcoming";

  const handleCitasSubTabClick = (tabKey: "upcoming" | "waitlist" | "history") => {
    if (location.pathname !== "/mis-citas") {
      navigate(tabKey === "upcoming" ? "/mis-citas" : `/mis-citas?tab=${tabKey}`);
    } else {
      setSearchParams(tabKey === "upcoming" ? {} : { tab: tabKey });
    }
  };

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

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : userName
    ? userName.slice(0, 2).toUpperCase()
    : "HU";

  const roleBadge = isManager
    ? "business"
    : isSuperadmin
    ? "superadmin"
    : "cliente";

  const navItems = [
    {
      label: "Inicio",
      path: "/",
      icon: Home,
      hasSubnav: true,
      subnav: [
        {
          id: "descubrir",
          label: "Descubrir",
          onClick: () => handleInicioSubTabClick("descubrir"),
          isActive: activeInicioSubTab === "descubrir",
        },
        {
          id: "actividad",
          label: "Actividad",
          onClick: () => handleInicioSubTabClick("actividad"),
          isActive: activeInicioSubTab === "actividad",
        },
      ],
    },
    {
      label: "Mis Citas",
      path: "/mis-citas",
      icon: Calendar,
      hasSubnav: true,
      subnav: [
        {
          id: "upcoming",
          label: "Próximas",
          onClick: () => handleCitasSubTabClick("upcoming"),
          isActive: currentCitasTab === "upcoming",
        },
        {
          id: "waitlist",
          label: "Espera",
          onClick: () => handleCitasSubTabClick("waitlist"),
          isActive: currentCitasTab === "waitlist",
        },
        {
          id: "history",
          label: "Historial",
          onClick: () => handleCitasSubTabClick("history"),
          isActive: currentCitasTab === "history",
        },
      ],
    },
    {
      label: "Mensajes",
      path: "/mensajes",
      icon: MessageCircle,
      hasSubnav: false,
      badge: unreadCount,
    },
    {
      label: "Mi Perfil",
      path: "/perfil",
      icon: User,
      hasSubnav: false,
    },
  ];

  return (
    <>
      <aside
        className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 w-64 z-30 bg-[var(--glow-surface)] border-r border-[var(--glow-line)] select-none font-sans"
        aria-label="Navegación principal de escritorio"
      >
        {/* ── Brand Header (con logo de Glowapp como antes) ── */}
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

        {/* ── Main Navigation (Con el estilo y resplandor exacto de la interfaz de referencia) ── */}
        <div className="glow-nav">
          <LayoutGroup id="client-sidebar-nav">
            {navItems.map((item) => {
              const active = isCurrentActive(item.path);
              const Icon = item.icon;

              return (
                <div key={item.path} className="relative">
                  <Link
                    to={item.path}
                    className={cn(
                      "glow-navitem group relative",
                      active && "on",
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="desktopSidebarActivePill"
                        className="absolute inset-0 bg-[var(--glow-brand-soft)] border border-[var(--glow-brand-softer)]/80 rounded-[11px] -z-10 shadow-[0_2px_12px_-4px_color-mix(in_oklab,var(--glow-brand)_18%,transparent)]"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}

                    <span className="glow-navitem-ic relative z-10 transition-transform duration-200 group-hover:scale-110">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="relative z-10 font-semibold">{item.label}</span>

                    {typeof item.badge === "number" && item.badge > 0 && (
                      <span className="relative z-10 ml-auto h-5 min-w-[20px] px-1.5 bg-rose-500 text-white text-[10.5px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}

                    {/* Solo mostrar la flecha si tiene subtabs */}
                    {item.hasSubnav && (
                      <motion.div
                        animate={{ rotate: active ? 0 : -90 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          "shrink-0 flex items-center justify-center relative z-10",
                          typeof item.badge === "number" && item.badge > 0 ? "ml-1.5" : "ml-auto",
                        )}
                      >
                        <ChevronDown className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    )}
                  </Link>

                  {/* Subtabs desplegables cuando el item tiene subtabs y está activo */}
                  <AnimatePresence initial={false}>
                    {item.hasSubnav && active && item.subnav && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="glow-side-subnav overflow-hidden"
                      >
                        {item.subnav.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={sub.onClick}
                            className={cn(
                              "glow-subitem relative",
                              sub.isActive && "on",
                            )}
                          >
                            <span
                              className={cn(
                                "glow-subdot transition-all duration-200",
                                sub.isActive && "bg-[var(--glow-brand)] scale-125",
                              )}
                            />
                            <span className="relative z-10">{sub.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </LayoutGroup>

          {/* ── Botón Crear y Panel (como en la bottom bar de móvil) ── */}
          {isManager && (
            <div className="mt-3 pt-3 border-t border-[var(--glow-line)] flex flex-col gap-1.5">
              <div className="flex items-center h-[46px] p-0.5 rounded-xl border border-[var(--glow-brand)]/35 dark:border-[var(--glow-brand)]/45 gap-0.5 bg-transparent">
                {/* Botón Crear */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShowPostCreator(true)}
                  className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[var(--glow-brand)] hover:bg-[var(--glow-brand-soft)] active:bg-[var(--glow-brand-soft)]/80 transition-colors cursor-pointer h-full"
                  title="Crear publicación"
                  aria-label="Crear publicación"
                >
                  <Plus className="w-[18px] h-[18px] text-[var(--glow-brand)]" strokeWidth={2.4} />
                  <span className="text-[10px] font-bold text-[var(--glow-brand)] mt-0.5 leading-tight">
                    Crear
                  </span>
                </motion.button>

                {/* Divisor sutil entre Crear y Panel */}
                <div className="w-[1px] h-4 bg-[var(--glow-brand)]/25 shrink-0" />

                {/* Botón Panel */}
                <motion.div whileTap={{ scale: 0.94 }} className="flex-1 h-full flex">
                  <Link
                    to={adminPath}
                    className={cn(
                      "relative flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[var(--glow-brand)] hover:bg-[var(--glow-brand-soft)] transition-colors cursor-pointer h-full",
                      isCurrentActive(adminPath) && "font-bold bg-[var(--glow-brand-soft)]",
                    )}
                    title={tenant?.name ? `Panel de ${tenant.name}` : "Panel de administración"}
                  >
                    <ShieldCheck className="w-[18px] h-[18px] text-[var(--glow-brand)]" strokeWidth={2.4} />
                    <span className="text-[10px] font-bold text-[var(--glow-brand)] mt-0.5 leading-tight truncate">
                      Panel
                    </span>
                  </Link>
                </motion.div>
              </div>
            </div>
          )}

          {/* ── Botón Superadmin (como en la bottom bar / sidebar) ── */}
          {isSuperadmin && (
            <div className="mt-1">
              <Link
                to="/superadmin"
                className={cn(
                  "glow-navitem group relative",
                  isCurrentActive("/superadmin") && "on",
                )}
              >
                {isCurrentActive("/superadmin") && (
                  <motion.div
                    layoutId="desktopSidebarActivePill"
                    className="absolute inset-0 bg-amber-500/15 border border-amber-500/30 rounded-[11px] -z-10 shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="glow-navitem-ic relative z-10 text-amber-500 group-hover:scale-110">
                  <Crown className="h-4 w-4 text-amber-500" />
                </span>
                <span className="relative z-10 text-amber-700 dark:text-amber-300 font-bold">Superadmin</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-3 border-t border-[var(--glow-line)] flex flex-col gap-2.5 bg-[var(--glow-surface)]">
          {/* Call to action "Para negocios" con el degradado/fade de Glowapp */}
          <Link
            to="/negocios"
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white shadow-md shadow-[var(--glow-brand)]/20 hover:shadow-lg hover:shadow-[var(--glow-brand)]/30 hover:brightness-105 transition-all text-center"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>Para negocios</span>
          </Link>

          {/* User Card (con el estilo limpio de la interfaz HU + badge business + ...) */}
          {user ? (
            <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl border border-[var(--glow-line)] bg-white hover:border-[var(--glow-brand-softer)] transition-all shadow-none">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-black/5 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#1e2038] text-white font-bold text-xs flex items-center justify-center shrink-0 tracking-wider">
                    {initials}
                  </div>
                )}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span
                    className="text-[12px] font-bold text-slate-900 truncate"
                    title={user.email || userName}
                  >
                    {user.email || userName}
                  </span>
                  <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e0e7ff] text-[#3730a3] w-fit leading-tight">
                    {roleBadge}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                    aria-label="Más opciones"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  sideOffset={10}
                  className="w-56 rounded-xl p-1.5 shadow-lg border border-[var(--glow-line)] bg-white z-50"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      to="/perfil"
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>

                  {isManager && (
                    <DropdownMenuItem asChild>
                      <Link
                        to={adminPath}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <ShieldCheck className="h-4 w-4 text-slate-500" />
                        <span>Panel del Salón</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {isSuperadmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/superadmin"
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span>Superadmin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link
                      to="/negocios"
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
                    >
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span>Para Negocios</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-slate-100" />

                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate("/auth");
                    }}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-rose-600 cursor-pointer rounded-lg hover:bg-rose-50 focus:text-rose-600 focus:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-[var(--glow-line)] hover:bg-slate-50 text-slate-900 text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="h-4 w-4 text-[var(--glow-brand)]" />
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Modal para Crear Publicación */}
      <PostCreator
        isOpen={showPostCreator}
        onClose={() => setShowPostCreator(false)}
      />
    </>
  );
}
