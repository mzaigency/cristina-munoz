import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
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
      // Fetch average rating from approved reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("tenant_id", tenant.id)
        .eq("approved", true);
      
      const avgRating = reviewsData?.length 
        ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length).toFixed(1)
        : 0;
      
      // Fetch unique customers count from bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("customer_name")
        .eq("tenant_id", tenant.id);
      
      const uniqueClients = new Set(bookingsData?.map(b => b.customer_name.toLowerCase().trim()) || []).size;
      
      // Fetch tenant creation year
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Image Side */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-1/2 h-[50vh] lg:h-screen relative"
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
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 lg:bg-none" />
        
        {/* Decorative element */}
        <div 
          className="absolute bottom-0 right-0 w-32 h-32 lg:w-48 lg:h-48"
          style={{
            background: `linear-gradient(135deg, ${tenant.primary_color || '#0EA5E9'}40 0%, transparent 100%)`
          }}
        />
      </motion.div>

      {/* Content Side */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-12 xl:px-20 py-12 lg:py-0 bg-background"
      >
        <div className="max-w-lg">
          {/* Logo */}
          {tenant.logo_url && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              src={tenant.logo_url}
              alt={`${tenant.name} logo`}
              className="w-16 h-16 object-contain mb-8 rounded-xl"
            />
          )}

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-4 leading-tight"
          >
            {tenant.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg text-muted-foreground font-body mb-6 leading-relaxed"
          >
            {displayTagline}
          </motion.p>

          {/* Location */}
          {location && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center gap-2 text-muted-foreground mb-8"
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
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={onBookNow}
              size="lg"
              className="px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{
                backgroundColor: tenant.primary_color || 'hsl(var(--primary))'
              }}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Reservar cita
            </Button>
          </motion.div>

          {/* Stats or Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 pt-8 border-t border-border"
          >
            <div className="grid grid-cols-2 gap-8">
              {[
                { value: stats.rating > 0 ? `${stats.rating}★` : "—", label: "Valoración" },
                { value: stats.since.toString(), label: "En Glowapp desde" }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: tenant.primary_color || 'hsl(var(--primary))' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
