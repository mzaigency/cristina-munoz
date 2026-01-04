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

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";

  const heroImages = tenant.hero_images as string[] | null;
  const mainImage = heroImages?.[0] || tenant.hero_image_url;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            {tenant.logo_url && (
              <img 
                src={tenant.logo_url} 
                alt={tenant.name}
                className="h-8 w-8 object-contain rounded-lg"
              />
            )}
            <span className="font-heading font-medium text-foreground text-sm">{tenant.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBookNow}
            className="text-xs px-3 h-8"
            style={{ color: tenant.primary_color || 'hsl(var(--primary))' }}
          >
            Reservar
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </header>

      {/* Hero Image - Full Width */}
      {mainImage && (
        <div className="relative w-full h-[55vh] mt-[52px]">
          <img 
            src={mainImage} 
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      {/* Content */}
      <main className={`flex-1 flex flex-col items-center px-6 py-10 text-center ${!mainImage ? 'pt-24' : '-mt-20 relative z-10'}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md"
        >
          {/* Name */}
          <h1 className="text-4xl md:text-5xl font-heading font-light text-foreground tracking-tight leading-tight mb-4">
            {tenant.name}
          </h1>

          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <div className="w-10 h-px bg-border" />
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: tenant.primary_color || 'hsl(var(--primary))' }}
            />
            <div className="w-10 h-px bg-border" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm md:text-base text-muted-foreground font-body leading-relaxed mb-6"
          >
            {displayTagline}
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-4 mb-8 text-xs text-muted-foreground"
          >
            {stats.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{stats.rating}</span>
              </div>
            )}
            <span className="text-border/60">·</span>
            <span>Desde {stats.since}</span>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button
              onClick={onBookNow}
              size="lg"
              className="px-8 py-5 text-sm font-medium rounded-full"
              style={{ 
                backgroundColor: tenant.primary_color || 'hsl(var(--primary))',
                color: 'white'
              }}
            >
              Reservar cita
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}