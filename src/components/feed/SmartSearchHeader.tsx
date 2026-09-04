import { Building2, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import glowappLogo from "@/assets/glowapp-logo.png";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";

export function SmartSearchHeader() {

  return (
    <header className="sticky top-0 z-50">
      <div className="relative bg-surface/85 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/75 border-b border-line/60">
        <div className="h-[env(safe-area-inset-top)]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex items-center justify-between gap-4"
          >
            {/* Mobile Logo */}
            <div className="flex items-center md:hidden">
              <Link to="/" className="flex items-center shrink-0">
                <motion.img
                  src={glowappLogo}
                  alt="GlowApp"
                  width={85}
                  height={32}
                  className="h-8 w-auto"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                />
              </Link>
            </div>

            {/* Desktop Consistent Heading */}
            <div className="hidden md:flex flex-col min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
                Explorar Salones
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight hidden sm:block mt-0.5">
                Peluquería, barbería, estética y bienestar cerca de ti
              </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <NotificationBadge />

              {/* Mobile-only "Negocios" button (in desktop it's in the sidebar) */}
              <div className="md:hidden">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/negocios"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white shadow-md shadow-[var(--glow-brand)]/25 hover:shadow-lg transition-all h-8.5"
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Negocios</span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
