import { Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import glowappLogo from "@/assets/glowapp-logo.png";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SmartSearchHeader() {
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    const checkSuperadmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  return (
    <div className="sticky top-0 z-50">
      <div className="relative bg-background/60 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-white/20 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Safe area spacer for notch */}
        <div className="h-[env(safe-area-inset-top)] bg-background/40" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

        <div className="px-4 pt-3 pb-3">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between"
          >
            {/* Logo */}
            <Link to="/">
              <motion.img
                src={glowappLogo}
                alt="GlowApp"
                className="h-8 object-contain rounded-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              />
            </Link>

            {/* Right side: Superadmin + Notifications + Para negocios */}
            <div className="flex items-center gap-2">
              {/* Superadmin link */}
              {isSuperadmin && (
                <Link
                  to="/superadmin"
                  className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-colors"
                >
                  <Crown className="h-5 w-5" />
                </Link>
              )}

              {/* Notification Bell */}
              <NotificationBadge />

              {/* Para negocios button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  className="rounded-full gradient-primary border-0"
                  asChild
                >
                  <Link to="/para-negocios" className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Para negocios</span>
                    <span className="sm:hidden">Negocios</span>
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
