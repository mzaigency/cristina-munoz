import { Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import glowappLogo from "@/assets/glowapp-logo.png";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function SmartSearchHeader() {
  const { user } = useAuth();
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSuperadmin(false);
      return;
    }
    const checkSuperadmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .maybeSingle();
      setIsSuperadmin(!!data);
    };
    checkSuperadmin();
  }, [user?.id]);

  return (
    <div className="sticky top-0 z-50">
      <div className="relative liquid-glass-solid">
        <div className="h-[env(safe-area-inset-top)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

        <div className="px-4 pt-3 pb-3">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between"
          >
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

            <div className="flex items-center gap-2">
              {isSuperadmin && (
                <Link
                  to="/superadmin"
                  className="p-2 rounded-full liquid-glass-pill text-amber-500"
                >
                  <Crown className="h-5 w-5" />
                </Link>
              )}

              <NotificationBadge />

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  className="rounded-full gradient-primary border-0 shadow-lg shadow-primary/20"
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
