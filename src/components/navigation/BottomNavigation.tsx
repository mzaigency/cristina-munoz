import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, MessageCircle, User, ShieldCheck, Plus } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { motion, LayoutGroup } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { PostCreator } from "@/components/social/PostCreator";
import { useHaptic } from "@/hooks/useHaptic";
import { supabase } from "@/integrations/supabase/client";

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const { tenant, isAdmin, isStylist } = useCurrentUserTenant();
  const { user } = useAuth();
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [optimisticPath, setOptimisticPath] = useState(location.pathname);
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);
  const haptic = useHaptic();

  // Sincronizar ruta optimista cuando cambia la ubicación real
  useEffect(() => {
    setOptimisticPath(location.pathname);
  }, [location.pathname]);

  // Precarga silenciosa en idle para máxima reactividad
  useEffect(() => {
    const prefetchRoutes = () => {
      import("@/pages/Messages");
      import("@/pages/MyBookings");
      import("@/pages/Profile");
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetchRoutes);
    } else {
      setTimeout(prefetchRoutes, 800);
    }

    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [user?.id]);

  const isCurrentActive = (path: string) => {
    const current = optimisticPath;
    if (path === "/" && current === "/") return true;
    if (path !== "/" && current.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    // Permitir comportamiento nativo para Cmd/Ctrl/Shift o botón central
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

    e.preventDefault();
    if (location.pathname === path) return;

    haptic.light();
    setOptimisticPath(path);

    // Precargar la ruta inmediatamente en segundo plano
    if (path === "/mensajes") {
      import("@/pages/Messages");
    } else if (path === "/mis-citas") {
      import("@/pages/MyBookings");
    } else if (path === "/perfil") {
      import("@/pages/Profile");
    } else if (path === "/") {
      import("@/pages/Index");
    }

    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => {
      navigate(path);
    }, 140);
  };

  const handleCreatePost = () => {
    haptic.medium();
    setShowPostCreator(true);
  };

  const isManager = (isAdmin || isStylist) && !!tenant;
  const adminPath = tenant?.slug ? `/admin/${tenant.slug}` : "/admin";

  return (
    <>
      <nav
        data-mobile-bottom-nav
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+8px)] left-2.5 right-2.5 z-50 max-w-lg mx-auto pointer-events-none select-none md:hidden"
        aria-label="Navegación principal"
      >
        <LayoutGroup id="public-bottom-nav-dock">
          <div className="pointer-events-auto bg-card/85 dark:bg-card/90 backdrop-blur-2xl border border-border/60 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)] rounded-2xl p-1 transition-all">
            <div
              className="grid items-center w-full gap-0.5"
              style={{ gridTemplateColumns: isManager ? "repeat(6, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" }}
            >
              {/* 1. Inicio */}
              <motion.div whileTap={{ scale: 0.92 }} className="w-full flex">
                <Link
                  to="/"
                  onClick={(e) => handleNavClick(e, "/")}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-colors cursor-pointer w-full min-h-[48px]",
                    isCurrentActive("/") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isCurrentActive("/") && (
                    <motion.div
                      layoutId="publicNavActivePill"
                      className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 440, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <Home className={cn("w-[19px] h-[19px] transition-transform", isCurrentActive("/") && "scale-105")} />
                  </span>
                  <span
                    className={cn(
                      "relative z-10 text-[10px] tracking-tight mt-0.5 truncate max-w-full leading-tight",
                      isCurrentActive("/") ? "font-bold text-primary" : "font-medium text-muted-foreground"
                    )}
                  >
                    Inicio
                  </span>
                </Link>
              </motion.div>

              {/* 2. Citas */}
              <motion.div whileTap={{ scale: 0.92 }} className="w-full flex">
                <Link
                  to="/mis-citas"
                  onClick={(e) => handleNavClick(e, "/mis-citas")}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-colors cursor-pointer w-full min-h-[48px]",
                    isCurrentActive("/mis-citas") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isCurrentActive("/mis-citas") && (
                    <motion.div
                      layoutId="publicNavActivePill"
                      className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 440, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <Calendar className={cn("w-[19px] h-[19px] transition-transform", isCurrentActive("/mis-citas") && "scale-105")} />
                  </span>
                  <span
                    className={cn(
                      "relative z-10 text-[10px] tracking-tight mt-0.5 truncate max-w-full leading-tight",
                      isCurrentActive("/mis-citas") ? "font-bold text-primary" : "font-medium text-muted-foreground"
                    )}
                  >
                    Citas
                  </span>
                </Link>
              </motion.div>

              {/* Si es Admin o Estilista del salón: Dúo unificado limpio con solo contorno sin caja de fondo */}
              {isManager && (
                <div className="col-span-2 flex items-center h-[48px] p-0.5 rounded-xl border border-primary/35 dark:border-primary/45 gap-0.5 relative bg-transparent">
                  {/* Botón Crear */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={handleCreatePost}
                    className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors cursor-pointer h-full"
                    title="Crear publicación"
                    aria-label="Crear publicación"
                  >
                    <Plus className="w-[18px] h-[18px] text-primary" strokeWidth={2.4} />
                    <span className="text-[10px] font-semibold text-primary mt-0.5 leading-tight">
                      Crear
                    </span>
                  </motion.button>

                  {/* Divisor sutil entre Crear y Panel */}
                  <div className="w-[1px] h-4 bg-primary/25 shrink-0" />

                  {/* Botón Panel */}
                  <motion.div whileTap={{ scale: 0.92 }} className="flex-1 h-full flex">
                    <Link
                      to={adminPath}
                      onClick={(e) => handleNavClick(e, adminPath)}
                      className={cn(
                        "relative flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors cursor-pointer h-full",
                        isCurrentActive(adminPath) && "font-bold"
                      )}
                      title={tenant?.name ? `Panel de administración de ${tenant.name}` : "Panel de administración"}
                    >
                      {isCurrentActive(adminPath) && (
                        <motion.div
                          layoutId="publicNavActivePill"
                          className="absolute inset-0 bg-primary/15 border border-primary/30 rounded-lg shadow-xs"
                          transition={{ type: "spring", stiffness: 440, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center">
                        <ShieldCheck className="w-[18px] h-[18px] text-primary" strokeWidth={2.4} />
                      </span>
                      <span className="relative z-10 text-[10px] font-semibold text-primary mt-0.5 leading-tight">
                        Panel
                      </span>
                    </Link>
                  </motion.div>
                </div>
              )}

              {/* 5. Mensajes */}
              <motion.div whileTap={{ scale: 0.92 }} className="w-full flex">
                <Link
                  to="/mensajes"
                  onClick={(e) => handleNavClick(e, "/mensajes")}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-colors cursor-pointer w-full min-h-[48px]",
                    isCurrentActive("/mensajes") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isCurrentActive("/mensajes") && (
                    <motion.div
                      layoutId="publicNavActivePill"
                      className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 440, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <MessageCircle className={cn("w-[19px] h-[19px] transition-transform", isCurrentActive("/mensajes") && "scale-105")} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] bg-rose-500 text-white text-[9.5px] font-bold rounded-full flex items-center justify-center px-1 shadow-xs">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "relative z-10 text-[10px] tracking-tight mt-0.5 truncate max-w-full leading-tight",
                      isCurrentActive("/mensajes") ? "font-bold text-primary" : "font-medium text-muted-foreground"
                    )}
                  >
                    Mensajes
                  </span>
                </Link>
              </motion.div>

              {/* 6. Perfil */}
              <motion.div whileTap={{ scale: 0.92 }} className="w-full flex">
                <Link
                  to="/perfil"
                  onClick={(e) => handleNavClick(e, "/perfil")}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-colors cursor-pointer w-full min-h-[48px]",
                    isCurrentActive("/perfil") ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isCurrentActive("/perfil") && (
                    <motion.div
                      layoutId="publicNavActivePill"
                      className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 440, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Perfil"
                        className={cn(
                          "w-[19px] h-[19px] rounded-full object-cover transition-transform",
                          isCurrentActive("/perfil") ? "ring-2 ring-primary scale-105" : "ring-1 ring-border/50"
                        )}
                      />
                    ) : (
                      <User className={cn("w-[19px] h-[19px] transition-transform", isCurrentActive("/perfil") && "scale-105")} />
                    )}
                  </span>
                  <span
                    className={cn(
                      "relative z-10 text-[10px] tracking-tight mt-0.5 truncate max-w-full leading-tight",
                      isCurrentActive("/perfil") ? "font-bold text-primary" : "font-medium text-muted-foreground"
                    )}
                  >
                    Perfil
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </LayoutGroup>
      </nav>

      <PostCreator
        isOpen={showPostCreator}
        onClose={() => setShowPostCreator(false)}
      />
    </>
  );
}
