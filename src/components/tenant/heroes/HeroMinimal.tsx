import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import glowappIcon from "@/assets/glowapp-icon.png";
import { FollowButton } from "@/components/social/FollowButton";
import { useFollows } from "@/hooks/useFollows";

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
  const { useFollowerCount } = useFollows();
  const { data: followerCount = 0 } = useFollowerCount(tenant.id);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return count.toString();
  };
  
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

  const displayTagline = tenant.tagline || tenant.description;
  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background Image - Very dark overlay */}
      {heroImage && (
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/85" />
        </div>
      )}
      
      {/* Fallback dark background */}
      {!heroImage && (
        <div className="absolute inset-0 bg-gray-950" />
      )}

      {/* Main Content - Centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-20">
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
              className="w-16 h-16 md:w-20 md:h-20 object-contain mx-auto mb-12 rounded-xl"
            />
          )}

          {/* Name - Large, elegant typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-light tracking-tight text-white mb-6"
          >
            {tenant.name}
          </motion.h1>

          {/* Stats - Subtle and minimal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center gap-6 mb-6 text-white/50 text-sm"
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{formatFollowers(followerCount)}</span>
            </div>
            {stats.rating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{stats.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <img src={glowappIcon} alt="Glowapp" className="w-3.5 h-3.5 object-contain opacity-70" />
              <span>Desde {stats.since}</span>
            </div>
          </motion.div>

          {/* Minimal line divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="w-12 h-px bg-white/30 mx-auto mb-6"
          />

          {/* Tagline - Subtle */}
          {displayTagline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base md:text-lg text-white/60 font-body font-light leading-relaxed mb-10 max-w-md mx-auto"
            >
              {displayTagline}
            </motion.p>
          )}

          {/* CTA Buttons - Clean and minimal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <FollowButton 
              tenantId={tenant.id} 
              variant="default" 
              className="px-8 py-5 text-sm font-medium tracking-wide uppercase border-white/30 text-white hover:bg-white/10 rounded-none transition-all duration-300 bg-transparent"
            />
            <Button
              onClick={onBookNow}
              variant="outline"
              size="lg"
              className="px-10 py-5 text-sm font-medium tracking-wide uppercase border-white/40 text-white hover:bg-white hover:text-gray-900 rounded-none transition-all duration-300 bg-transparent"
            >
              Reservar
            </Button>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
