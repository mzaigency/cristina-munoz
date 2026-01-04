import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Sparkles } from "lucide-react";
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
}

interface HeroGlassProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroGlass({ tenant, onBookNow }: HeroGlassProps) {
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
  const mainImage = heroImages?.[0] || tenant.hero_image_url;
  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      {mainImage && (
        <div className="absolute inset-0">
          <img 
            src={mainImage} 
            alt={tenant.name}
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: tenant.primary_color || 'hsl(var(--primary))' }}
        />
        <motion.div
          animate={{ 
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: tenant.primary_color || 'hsl(var(--primary))' }}
        />
      </div>

      {/* Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-2">
              {tenant.logo_url && (
                <img 
                  src={tenant.logo_url} 
                  alt={tenant.name}
                  className="h-8 w-8 object-contain rounded-lg"
                />
              )}
              <span className="font-heading font-medium text-white text-sm drop-shadow-sm">{tenant.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBookNow}
              className="text-xs px-3 h-8 text-white hover:bg-white/20"
            >
              Reservar
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="relative p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/30 shadow-2xl">
            {/* Sparkle decoration */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-3 -right-3"
            >
              <div 
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </motion.div>

            {/* Logo */}
            {tenant.logo_url && tenant.show_logo_on_landing !== false && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 p-3 shadow-lg">
                  <img 
                    src={tenant.logo_url} 
                    alt={tenant.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </motion.div>
            )}

            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center mb-3 drop-shadow-lg">
              {tenant.name}
            </h1>

            {/* Tagline */}
            <p className="text-sm md:text-base text-white/80 text-center mb-6 leading-relaxed">
              {displayTagline}
            </p>

            {/* Stats in glass pills */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {stats.rating > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-medium text-white">{stats.rating}</span>
                </div>
              )}
              <div className="flex items-center px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                <span className="text-xs text-white/80">Desde {stats.since}</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={onBookNow}
              size="lg"
              className="w-full py-6 text-base font-semibold rounded-2xl bg-white text-gray-900 hover:bg-white/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              Reservar cita
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-white/50"
              />
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
