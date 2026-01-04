import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, ArrowDown } from "lucide-react";
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
  const [stats, setStats] = useState({ rating: 0, since: new Date().getFullYear() });
  
  useEffect(() => {
    const fetchStats = async () => {
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("tenant_id", tenant.id)
        .eq("approved", true);
      
      const avgRating = reviewsData?.length 
        ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length).toFixed(1)
        : 0;
      
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("created_at")
        .eq("id", tenant.id)
        .single();
      
      const createdYear = tenantData?.created_at 
        ? new Date(tenantData.created_at).getFullYear()
        : new Date().getFullYear();
      
      setStats({ rating: Number(avgRating), since: createdYear });
    };
    
    if (tenant.id) fetchStats();
  }, [tenant.id]);

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";

  const heroImages = tenant.hero_images as string[] | null;
  const mainImage = heroImages?.[0] || tenant.hero_image_url;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Screen Hero Image */}
      {mainImage ? (
        <div className="absolute inset-0">
          <img 
            src={mainImage} 
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
          {/* Elegant dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        </div>
      ) : (
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${tenant.primary_color || '#18181B'} 0%, #000 100%)`
          }}
        />
      )}

      {/* Content - Centered */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg"
        >
          {/* Logo */}
          {tenant.logo_url && tenant.show_logo_on_landing !== false && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              src={tenant.logo_url}
              alt={tenant.name}
              className="w-16 h-16 md:w-20 md:h-20 object-contain mx-auto mb-8 rounded-xl"
            />
          )}

          {/* Name - Elegant typography */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight leading-tight mb-6">
            {tenant.name}
          </h1>

          {/* Subtle decorative line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-16 h-px mx-auto mb-6"
            style={{ backgroundColor: tenant.primary_color || 'rgba(255,255,255,0.4)' }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base md:text-lg text-white/80 font-body leading-relaxed mb-8 max-w-sm mx-auto"
          >
            {displayTagline}
          </motion.p>

          {/* Stats - Minimal pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center gap-4 mb-10"
          >
            {stats.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-sm font-medium">{stats.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <img src={glowappIcon} alt="Glowapp" className="w-4 h-4 object-contain" />
              <span className="text-white/90 text-sm">En Glowapp desde {stats.since}</span>
            </div>
          </motion.div>

          {/* CTA Button - Clean and elegant */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              onClick={onBookNow}
              size="lg"
              className="px-10 py-6 text-base font-medium rounded-full bg-white text-gray-900 hover:bg-white/90 shadow-xl transition-all duration-300 hover:scale-105"
            >
              Reservar cita
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-white/50 text-xs tracking-widest uppercase">Descubrir</span>
            <ArrowDown className="w-4 h-4 text-white/50" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
