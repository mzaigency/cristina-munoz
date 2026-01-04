import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";
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
    <>
      {/* Mobile: Elegant card-style hero */}
      <div className="lg:hidden min-h-screen bg-gray-50 relative overflow-hidden">
        {/* Hero Image as card */}
        <div className="pt-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl"
          >
            {mainImage ? (
              <img 
                src={mainImage} 
                alt={tenant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full"
                style={{
                  background: `linear-gradient(180deg, ${tenant.primary_color || '#18181B'} 0%, #374151 100%)`
                }}
              />
            )}
            
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Content on image */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Logo */}
              {tenant.logo_url && tenant.show_logo_on_landing !== false && (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="w-12 h-12 object-contain mb-4 rounded-xl shadow-lg"
                />
              )}

              {/* Name */}
              <h1 className="text-3xl font-heading font-bold text-white tracking-tight leading-tight mb-2">
                {tenant.name}
              </h1>

              {/* Tagline */}
              <p className="text-sm text-white/80 font-body leading-relaxed mb-4 max-w-[280px]">
                {displayTagline}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-3">
                {stats.rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-medium">{stats.rating}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5">
                  <img src={glowappIcon} alt="Glowapp" className="w-3.5 h-3.5 object-contain" />
                  <span className="text-white/90 text-xs">Desde {stats.since}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Button below card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="px-4 py-8"
        >
          <Button
            onClick={onBookNow}
            size="lg"
            className="w-full group py-6 text-base font-medium rounded-2xl text-white shadow-lg transition-all duration-300"
            style={{
              backgroundColor: tenant.primary_color || '#18181B',
            }}
          >
            Reservar cita
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>

      {/* Desktop: Split layout */}
      <div className="hidden lg:flex min-h-screen bg-white">
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col justify-center px-16 xl:px-24 py-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            {/* Logo */}
            {tenant.logo_url && tenant.show_logo_on_landing !== false && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-14 h-14 object-contain mb-10 rounded-xl"
              />
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex items-center gap-4 mb-8"
            >
              {stats.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-gray-700 text-sm font-medium">{stats.rating}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <img src={glowappIcon} alt="Glowapp" className="w-4 h-4 object-contain" />
                <span>En Glowapp desde {stats.since}</span>
              </div>
            </motion.div>

            {/* Name */}
            <h1 
              className="text-5xl xl:text-6xl 2xl:text-7xl font-heading font-bold tracking-tight leading-[1.1] mb-8"
              style={{ color: tenant.primary_color || '#18181B' }}
            >
              {tenant.name}
            </h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-gray-600 font-body leading-relaxed mb-12 max-w-md"
            >
              {displayTagline}
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                onClick={onBookNow}
                size="lg"
                className="group px-10 py-6 text-base font-medium rounded-full text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                style={{
                  backgroundColor: tenant.primary_color || '#18181B',
                }}
              >
                Reservar cita
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Image */}
        <div className="flex-1 relative">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-8 rounded-3xl overflow-hidden shadow-2xl"
          >
            {mainImage ? (
              <img 
                src={mainImage} 
                alt={tenant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${tenant.primary_color || '#f4f4f5'} 0%, #e4e4e7 100%)`
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
