import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowDown, Star, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
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

interface HeroBoldProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroBold({ tenant, onBookNow }: HeroBoldProps) {
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

  const primaryColor = tenant.primary_color || '#F97316';
  const secondaryColor = tenant.secondary_color || '#EAB308';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Full Gradient Hero */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative flex-1 flex flex-col"
      >
        {/* Background with Image or Gradient */}
        <div className="absolute inset-0">
          {heroImage ? (
            <>
              <img
                src={heroImage}
                alt={tenant.name}
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${primaryColor}CC 0%, ${secondaryColor}99 50%, ${primaryColor}EE 100%)`
                }}
              />
            </>
          ) : (
            <div 
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`
              }}
            />
          )}
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-64 h-64 border-[3px] border-white/20 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/3 -left-16 w-48 h-48 border-2 border-white/10 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-8 w-20 h-20 bg-white/10 rounded-full blur-xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          {/* Logo with Glow */}
          {tenant.logo_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="relative mb-6"
            >
              <div 
                className="absolute inset-0 blur-2xl opacity-50 rounded-3xl"
                style={{ backgroundColor: 'white' }}
              />
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="relative w-20 h-20 object-contain rounded-2xl bg-white/20 backdrop-blur-sm p-2 shadow-2xl"
              />
            </motion.div>
          )}

          {/* Name - Extra Bold */}
          <motion.h1
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-heading font-black text-white mb-4 uppercase tracking-wider drop-shadow-2xl"
          >
            {tenant.name}
          </motion.h1>

          {/* Animated Underline */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-32 h-1.5 bg-white/60 rounded-full mb-6"
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl text-white/95 font-body mb-6 max-w-sm mx-auto font-medium"
          >
            {displayTagline}
          </motion.p>

          {/* Stats Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex items-center gap-3 mb-8"
          >
            {stats.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-white/25 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span className="text-white font-bold">{stats.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/25 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg">
              <Calendar className="w-4 h-4 text-white/90" />
              <span className="text-white font-medium">En Glowapp desde {stats.since}</span>
            </div>
          </motion.div>

          {/* CTA Button - Big and Bold */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8, type: "spring" }}
          >
            <Button
              onClick={onBookNow}
              size="lg"
              className="px-12 py-8 text-xl font-black bg-white text-foreground hover:bg-white/95 shadow-2xl rounded-2xl uppercase tracking-wide hover:scale-105 transition-transform"
            >
              <Sparkles className="w-6 h-6 mr-3" />
              ¡Reservar Ahora!
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="relative z-10 flex flex-col items-center pb-8"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="w-7 h-7 text-white/70" />
          </motion.div>
          <span className="text-sm text-white/70 mt-2 font-medium">Ver más</span>
        </motion.div>
      </motion.div>
    </div>
  );
}