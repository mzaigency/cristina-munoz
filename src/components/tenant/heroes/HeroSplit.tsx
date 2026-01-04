import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Star } from "lucide-react";
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
  secondary_color?: string | null;
  address?: string | null;
  city?: string | null;
}

interface HeroSplitProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroSplit({ tenant, onBookNow }: HeroSplitProps) {
  const [stats, setStats] = useState({ rating: 0, clients: 0, since: new Date().getFullYear() });
  
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
      
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("customer_name")
        .eq("tenant_id", tenant.id);
      
      const uniqueClients = new Set(bookingsData?.map(b => b.customer_name.toLowerCase().trim()) || []).size;
      
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("created_at")
        .eq("id", tenant.id)
        .single();
      
      const createdYear = tenantData?.created_at 
        ? new Date(tenantData.created_at).getFullYear()
        : new Date().getFullYear();
      
      setStats({
        rating: Number(avgRating),
        clients: uniqueClients,
        since: createdYear
      });
    };
    
    if (tenant.id) {
      fetchStats();
    }
  }, [tenant.id]);

  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";
  const location = [tenant.city, tenant.address].filter(Boolean).join(" · ");

  return (
    <>
      {/* Mobile: Full-screen immersive hero */}
      <div className="lg:hidden min-h-screen relative overflow-hidden">
        {/* Background Image */}
        {heroImage ? (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={tenant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
          </div>
        ) : (
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${tenant.primary_color || '#0EA5E9'} 0%, ${tenant.secondary_color || '#06B6D4'} 100%)`
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col justify-end px-6 pb-12 pt-20">
          {/* Logo */}
          {tenant.logo_url && tenant.show_logo_on_landing !== false && (
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              src={tenant.logo_url}
              alt={tenant.name}
              className="w-14 h-14 object-contain mb-6 rounded-xl shadow-lg"
            />
          )}

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white mb-3 leading-tight"
          >
            {tenant.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-white/80 font-body mb-4 leading-relaxed max-w-sm"
          >
            {displayTagline}
          </motion.p>

          {/* Location */}
          {location && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-2 text-white/70 mb-6"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{location}</span>
            </motion.div>
          )}

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex items-center gap-4 mb-8"
          >
            {stats.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-sm font-medium">{stats.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5">
              <img src={glowappIcon} alt="Glowapp" className="w-3.5 h-3.5 object-contain" />
              <span className="text-white/90 text-xs">En Glowapp desde {stats.since}</span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              onClick={onBookNow}
              size="lg"
              className="w-full py-6 text-base rounded-xl shadow-xl"
              style={{
                backgroundColor: tenant.primary_color || 'hsl(var(--primary))'
              }}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Reservar cita
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Desktop: Split layout with asymmetric design */}
      <div className="hidden lg:flex min-h-screen">
        {/* Image Side - Larger portion */}
        <motion.div 
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="w-[55%] h-screen relative overflow-hidden"
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
                background: `linear-gradient(135deg, ${tenant.primary_color || '#0EA5E9'} 0%, ${tenant.secondary_color || '#06B6D4'} 100%)`
              }}
            />
          )}
          
          {/* Diagonal overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 60%, rgba(255,255,255,1) 100%)'
            }}
          />

          {/* Stats overlay on image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute bottom-12 left-12 flex items-center gap-3"
          >
            {stats.rating > 0 && (
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-gray-900 text-sm font-semibold">{stats.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
              <img src={glowappIcon} alt="Glowapp" className="w-4 h-4 object-contain" />
              <span className="text-gray-700 text-sm">En Glowapp desde {stats.since}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Content Side */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-[45%] flex flex-col justify-center px-16 xl:px-24 bg-white"
        >
          <div className="max-w-md">
            {/* Logo */}
            {tenant.logo_url && tenant.show_logo_on_landing !== false && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-16 h-16 object-contain mb-10 rounded-xl"
              />
            )}

            {/* Name */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-5xl xl:text-6xl font-heading font-bold text-gray-900 mb-6 leading-[1.1]"
            >
              {tenant.name}
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg text-gray-600 font-body mb-6 leading-relaxed"
            >
              {displayTagline}
            </motion.p>

            {/* Location */}
            {location && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center gap-2 text-gray-500 mb-10"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location}</span>
              </motion.div>
            )}

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                onClick={onBookNow}
                size="lg"
                className="px-10 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: tenant.primary_color || 'hsl(var(--primary))'
                }}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Reservar cita
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
