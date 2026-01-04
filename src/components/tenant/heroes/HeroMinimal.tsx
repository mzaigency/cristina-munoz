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
    <div className="min-h-screen bg-white">
      {/* Main Content - Split layout on desktop */}
      <div className="min-h-screen flex flex-col lg:flex-row">
        
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-16 lg:py-0 order-2 lg:order-1">
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
                className="w-12 h-12 md:w-14 md:h-14 object-contain mb-8 rounded-lg"
              />
            )}

            {/* Stats - Subtle top info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex items-center gap-4 mb-6"
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

            {/* Name - Large editorial typography */}
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight leading-[1.1] mb-6"
              style={{ color: tenant.primary_color || '#18181B' }}
            >
              {tenant.name}
            </h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-gray-600 font-body leading-relaxed mb-10 max-w-md"
            >
              {displayTagline}
            </motion.p>

            {/* CTA Button - Minimal with arrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                onClick={onBookNow}
                size="lg"
                className="group px-8 py-6 text-base font-medium rounded-full text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
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
        <div className="lg:flex-1 h-[50vh] lg:h-screen order-1 lg:order-2 relative">
          {mainImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img 
                src={mainImage} 
                alt={tenant.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${tenant.primary_color || '#f4f4f5'} 0%, #e4e4e7 100%)`
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
