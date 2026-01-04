import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  secondary_color?: string | null;
}

interface HeroImmersiveProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroImmersive({ tenant, onBookNow }: HeroImmersiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

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

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div 
        style={{ y, scale }}
        className="absolute inset-0"
      >
        {heroImage ? (
          <img
            src={heroImage}
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${tenant.primary_color || '#8B5CF6'} 0%, ${tenant.secondary_color || '#D946EF'} 100%)`
            }}
          />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Logo */}
        {tenant.show_logo_on_landing && tenant.logo_url && (
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            src={tenant.logo_url}
            alt={`${tenant.name} logo`}
            className="w-20 h-20 md:w-24 md:h-24 object-contain mb-6 rounded-2xl shadow-2xl"
          />
        )}

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-4 tracking-tight"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
        >
          {tenant.name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-white/90 mb-6 max-w-md font-body"
        >
          {displayTagline}
        </motion.p>

        {/* Stats Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center gap-4 mb-8"
        >
          {stats.rating > 0 && (
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-4 py-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-medium text-sm">{stats.rating}</span>
            </div>
          )}
          <div className="bg-white/15 backdrop-blur-md rounded-full px-4 py-2">
            <span className="text-white/90 text-sm">Desde {stats.since}</span>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <Button
            onClick={onBookNow}
            size="lg"
            className="text-base px-8 py-6 rounded-full shadow-2xl hover:scale-105 transition-transform"
            style={{
              background: `linear-gradient(135deg, ${tenant.primary_color || '#8B5CF6'} 0%, ${tenant.secondary_color || '#D946EF'} 100%)`
            }}
          >
            Reservar cita
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white/60 text-xs font-medium uppercase tracking-widest">Descubre más</span>
          <ChevronDown className="w-5 h-5 text-white/60" />
        </motion.div>
      </motion.div>
    </div>
  );
}