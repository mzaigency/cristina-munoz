import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, MessageCircle, Search, User } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: "/mis-citas", icon: Calendar, label: "Citas" },
  { path: "/buscar", icon: Search, label: "Buscar" },
  { path: "/mensajes", icon: MessageCircle, label: "Mensajes" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNavigation() {
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 ios-nav-blur border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          const showBadge = path === "/mensajes" && unreadCount > 0;

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full relative transition-all duration-200",
                "active:scale-95"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {showBadge && (
                  <span className="absolute top-1 right-2 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 font-medium transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
