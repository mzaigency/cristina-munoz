import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import glowappIcon from "@/assets/glowapp-icon.png";

interface Tenant {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  hero_images?: unknown;
  logo_url?: string | null;
  show_logo_on_landing?: boolean | null;
  primary_color?: string | null;
}

interface HeroMinimalProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroMinimal({ tenant, onBookNow }: HeroMinimalProps) {
  const [stats, setStats] = useState({ since: new Date().getFullYear() });
  
  useEffect(() => {
    const fetchStats = async () => {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("created_at")
        .eq("id", tenant.id)
        .single();
      
      const createdYear = tenantData?.created_at 
        ? new Date(tenantData.created_at).getFullYear()
        : new Date().getFullYear();
      
      setStats({ since: createdYear });
    };
    
    if (tenant.id) fetchStats();
  }, [tenant.id]);

  const displayTagline = tenant.tagline || tenant.description;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content - Centered vertically */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl"
        >
          {/* Logo - Small and subtle */}
          {tenant.logo_url && tenant.show_logo_on_landing !== false && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              src={tenant.logo_url}
              alt={tenant.name}
              className="w-16 h-16 md:w-20 md:h-20 object-contain mx-auto mb-12"
            />
          )}

          {/* Name - Large, elegant typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-light tracking-tight text-gray-900 mb-6"
          >
            {tenant.name}
          </motion.h1>

          {/* Minimal line divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-12 h-px bg-gray-300 mx-auto mb-6"
          />

          {/* Tagline - Subtle */}
          {displayTagline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base md:text-lg text-gray-500 font-body font-light leading-relaxed mb-12 max-w-md mx-auto"
            >
              {displayTagline}
            </motion.p>
          )}

          {/* CTA Button - Clean and minimal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Button
              onClick={onBookNow}
              variant="outline"
              size="lg"
              className="px-10 py-6 text-sm font-medium tracking-wide uppercase border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-none transition-all duration-300"
            >
              Reservar
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer info - Subtle at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="py-8 border-t border-gray-100"
      >
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs tracking-wide">
          <img src={glowappIcon} alt="Glowapp" className="w-3.5 h-3.5 object-contain opacity-60" />
          <span>En Glowapp desde {stats.since}</span>
        </div>
      </motion.div>
    </div>
  );
}
