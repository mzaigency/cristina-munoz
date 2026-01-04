import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import glowappLogo from "@/assets/glowapp-logo.png";

export function SmartSearchHeader() {
  return (
    <div className="sticky top-0 z-50">
      <div className="relative bg-gradient-to-b from-background via-background/98 to-background/90 backdrop-blur-3xl">
        {/* Safe area spacer for notch */}
        <div className="h-[env(safe-area-inset-top)] bg-background" />
        <div className="absolute inset-x-0 top-[env(safe-area-inset-top)] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="px-4 pt-3 pb-3">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between"
          >
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <img 
                  src="/favicon.png" 
                  alt="GlowApp" 
                  className="h-8 w-8 drop-shadow-lg mr-1" 
                />
              </motion.div>
              <img 
                src={glowappLogo} 
                alt="GlowApp" 
                className="h-7 object-contain" 
              />
            </Link>

            {/* Para negocios button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                asChild
                size="default"
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 rounded-xl shadow-lg shadow-primary/25 text-sm"
              >
                <Link to="/para-negocios" className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Para negocios</span>
                  <span className="sm:hidden">Negocios</span>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
