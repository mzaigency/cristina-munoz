import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
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

  const heroImages = tenant.hero_images as string[] | null;
  const images = heroImages?.slice(0, 2) || [tenant.hero_image_url].filter(Boolean);

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Elegant Header */}
      <header className="w-full px-6 py-6 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-3">
          {tenant.logo_url && (
            <img 
              src={tenant.logo_url} 
              alt={tenant.name}
              className="h-10 w-10 object-contain rounded-lg"
            />
          )}
          <span className="font-heading font-medium text-foreground">{tenant.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookNow}
          className="text-muted-foreground hover:text-foreground group"
        >
          Reservar
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </header>

      {/* Main Content - Refined Typography */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          {/* Name - Elegant serif-style */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-light text-foreground tracking-tight leading-none mb-8">
            {tenant.name}
          </h1>

          {/* Decorative Line with dot */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-16 h-px bg-border" />
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tenant.primary_color || 'hsl(var(--primary))' }}
            />
            <div className="w-16 h-px bg-border" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed mb-8 max-w-md mx-auto"
          >
            {displayTagline}
          </motion.p>

          {/* Minimal Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center gap-6 mb-10 text-sm text-muted-foreground"
          >
            {stats.rating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{stats.rating}</span>
              </div>
            )}
            <span className="text-border">·</span>
            <span>Desde {stats.since}</span>
          </motion.div>

          {/* CTA Button - Refined outline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Button
              onClick={onBookNow}
              variant="outline"
              size="lg"
              className="px-10 py-6 text-base border-2 rounded-none hover:bg-foreground hover:text-background transition-all duration-300"
              style={{ borderColor: tenant.primary_color || 'hsl(var(--foreground))' }}
            >
              Reservar cita
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Images Grid - Refined */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="px-6 pb-16"
        >
          <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
            {images.slice(0, 2).map((img, idx) => (
              <div 
                key={idx}
                className="aspect-[3/4] overflow-hidden bg-muted"
              >
                <img 
                  src={img as string} 
                  alt={`${tenant.name} ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}