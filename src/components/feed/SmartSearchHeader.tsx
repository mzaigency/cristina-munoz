import { Building2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import glowappLogo from "@/assets/glowapp-logo.png";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { ClientPageHeader } from "@/components/navigation/ClientPageHeader";
import { useIsSuperadmin } from "@/hooks/useIsSuperadmin";

export function SmartSearchHeader() {
  const isSuperadmin = useIsSuperadmin();

  return (
    <ClientPageHeader
      title="Explorar Salones"
      subtitle="Peluquería, barbería, estética y bienestar cerca de ti"
      leading={
        <Link to="/" className="flex items-center shrink-0 md:hidden" aria-label="Glowapp - Inicio">
          <img src={glowappLogo} alt="GlowApp" width={85} height={32} className="h-8 w-auto" />
        </Link>
      }
      actions={
        <>
          {isSuperadmin && (
            <motion.div whileTap={{ scale: 0.92 }} className="md:hidden">
              <Link
                to="/superadmin"
                aria-label="Panel Superadmin"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-white/65 backdrop-blur-md border border-white/70 text-foreground shadow-[0_1px_3px_rgba(19,21,32,0.06)] transition-all"
              >
                <Shield className="h-4 w-4" />
              </Link>
            </motion.div>
          )}
          <NotificationBadge />


          {/* Solo móvil: en escritorio vive en el menú lateral */}
          <motion.div whileTap={{ scale: 0.95 }} className="md:hidden">
            <Link
              to="/negocios"
              className="flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold bg-[linear-gradient(100deg,var(--glow-brand),#98329A)] text-white shadow-[0_6px_18px_-8px_rgba(34,64,140,0.6)] transition-all"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Negocios</span>
            </Link>
          </motion.div>
        </>
      }
    />
  );
}
