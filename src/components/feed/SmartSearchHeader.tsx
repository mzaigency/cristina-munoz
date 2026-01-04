import { Building2, Shield, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

interface SmartSearchHeaderProps {
  userTenant?: { slug: string; name: string; primary_color?: string | null } | null;
  isSuperadmin?: boolean;
}

export function SmartSearchHeader({ userTenant, isSuperadmin }: SmartSearchHeaderProps) {
  return (
    <div className="sticky top-0 z-50">
      <div className="relative bg-gradient-to-b from-background via-background/98 to-background/90 backdrop-blur-3xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="px-4 pt-3 pb-3 safe-area-top">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between"
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <img src="/favicon.png" alt="GlowApp" className="h-9 w-9 drop-shadow-lg" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-none">
                  GlowApp
                </h1>
                <p className="text-[10px] text-muted-foreground/70 font-medium tracking-wide mt-0.5 hidden xs:block">
                  Tu belleza, conectada
                </p>
              </div>
            </Link>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              {userTenant && (
                <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                  <Link to={`/admin/${userTenant.slug}`}>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </Button>
              )}
              {isSuperadmin && (
                <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                  <Link to="/superadmin">
                    <Crown className="h-4 w-4 text-amber-500" />
                  </Link>
                </Button>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  size="default"
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 rounded-xl shadow-lg shadow-primary/25 text-sm"
                >
                  <Link to="/para-negocios" className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Para negocios</span>
                    <span className="sm:hidden">Para Negocios</span>
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
