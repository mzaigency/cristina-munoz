import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface Tenant {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  city: string | null;
  address: string | null;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  features?: {
    business_type?: string;
    business_type_label?: string;
    [key: string]: unknown;
  } | null;
}

interface TenantHeroProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export const TenantHero = ({ tenant, onBookNow }: TenantHeroProps) => {
  const hasHeroImage = !!tenant.hero_image_url;
  const containerRef = useRef<HTMLElement>(null);

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Image moves slower (parallax)
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  
  // Content fades and moves up on scroll
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  // Dynamic tagline - shorter for iOS style
  const tagline = tenant.tagline || 
    `Belleza y estilo${tenant.city ? ` en ${tenant.city}` : ''}`;

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Hero Image Background with Parallax */}
      {hasHeroImage && (
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: imageY, scale: imageScale }}
        >
          <motion.img 
            src={tenant.hero_image_url!} 
            alt={`${tenant.name}`}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
          <motion.div 
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </motion.div>
      )}

      {/* Dark gradient background when no image */}
      {!hasHeroImage && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-neutral-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}

      <motion.div 
        className="container mx-auto px-6 relative z-10"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          {tenant.logo_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <img 
                src={tenant.logo_url} 
                alt={`${tenant.name}`}
                className="h-16 md:h-20 mx-auto"
              />
            </motion.div>
          )}

          {/* Title with staggered letter animation */}
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 text-white"
            style={{ fontFamily: 'var(--font-heading, "SF Pro Display", system-ui, sans-serif)' }}
          >
            {tenant.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-base md:text-lg mb-10 font-normal text-white/70"
          >
            {tagline}
          </motion.p>

          {/* CTA Button with bounce effect */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.8, 
              ease: [0.25, 0.46, 0.45, 0.94],
              scale: { type: "spring", stiffness: 200, damping: 15 }
            }}
          >
            <Button
              size="lg"
              onClick={onBookNow}
              className="text-base font-medium px-8 py-6 rounded-full transition-all duration-300 bg-primary text-primary-foreground hover:opacity-90 hover:scale-105"
            >
              Reservar cita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Animated scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        style={{ opacity: contentOpacity }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <motion.div 
            className="w-1 h-2 bg-white/50 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      {/* Subtle fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default TenantHero;
