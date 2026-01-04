import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, MessageCircle, User, Shield, Crown, Plus } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCreator } from "@/components/social/PostCreator";
import { useHaptic } from "@/hooks/useHaptic";

const baseNavItems = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: "/mis-citas", icon: Calendar, label: "Citas" },
  { path: "/mensajes", icon: MessageCircle, label: "Mensajes" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNavigation() {
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();
  const { tenant, isAdmin } = useCurrentUserTenant();
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    const checkSuperadmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "superadmin")
          .maybeSingle();
        setIsSuperadmin(!!data);
      }
    };
    checkSuperadmin();
  }, []);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Build nav items dynamically based on permissions
  const navItems = [...baseNavItems];
  
  // Add admin item if user has tenant admin access
  if (isAdmin && tenant) {
    navItems.splice(3, 0, { 
      path: `/admin/${tenant.slug}`, 
      icon: Shield, 
      label: "Admin" 
    });
  }
  
  // Add superadmin item if user is superadmin
  if (isSuperadmin) {
    navItems.splice(isAdmin && tenant ? 4 : 3, 0, { 
      path: "/superadmin", 
      icon: Crown, 
      label: "Super" 
    });
  }

  const handleCreatePost = () => {
    haptic.medium();
    setShowPostCreator(true);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-t border-border/30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto px-2">
          {navItems.map(({ path, icon: Icon, label }, index) => {
            const active = isActive(path);
            const showBadge = path === "/mensajes" && unreadCount > 0;
            
            // Insert create button after "Citas" (index 1) for admins
            const showCreateButton = isAdmin && tenant && index === 2;

            return (
              <div key={path} className="contents">
                {showCreateButton && (
                  <button
                    onClick={handleCreatePost}
                    className="flex flex-col items-center justify-center min-w-[56px] h-full relative active:scale-95 transition-transform duration-200"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      <Plus className="h-6 w-6" strokeWidth={2.5} />
                    </motion.div>
                  </button>
                )}
                <Link
                  to={path}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] h-full relative",
                    "active:scale-95 transition-transform duration-200"
                  )}
                >
                  <motion.div
                    animate={{
                      scale: active ? 1 : 1,
                      y: active ? -1 : 0
                    }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 relative",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        active && "scale-105"
                      )}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    
                    {/* Notification Badge */}
                    {showBadge && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-destructive/30"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </motion.span>
                    )}
                  </motion.div>
                  
                  <motion.span
                    animate={{
                      opacity: active ? 1 : 0.6,
                    }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "text-[10px] mt-0.5 font-medium transition-colors duration-300",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </motion.span>
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Post Creator Modal */}
      <PostCreator 
        isOpen={showPostCreator} 
        onClose={() => setShowPostCreator(false)} 
      />
    </>
  );
}
