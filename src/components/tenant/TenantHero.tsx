import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

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
}

interface TenantHeroProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export const TenantHero = ({ tenant, onBookNow }: TenantHeroProps) => {
  const hasHeroImage = !!tenant.hero_image_url;

  // Dynamic tagline - shorter for iOS style
  const tagline = tenant.tagline || 
    `Belleza y estilo${tenant.city ? ` en ${tenant.city}` : ''}`;

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-black">
      {/* Hero Image Background */}
      {hasHeroImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={tenant.hero_image_url!} 
            alt={`${tenant.name}`}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Dark gradient background when no image */}
      {!hasHeroImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-neutral-900" />
      )}

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          {tenant.logo_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <img 
                src={tenant.logo_url} 
                alt={`${tenant.name}`}
                className="h-16 md:h-20 mx-auto"
              />
            </motion.div>
          )}

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4 text-white"
            style={{ fontFamily: 'var(--font-heading, "SF Pro Display", system-ui, sans-serif)' }}
          >
            {tenant.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-base md:text-lg mb-10 font-normal text-white/70"
          >
            {tagline}
          </motion.p>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Button
              size="lg"
              onClick={onBookNow}
              className="text-base font-medium px-8 py-6 rounded-full transition-all duration-300 bg-primary text-primary-foreground hover:opacity-90"
            >
              Reservar cita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Subtle fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default TenantHero;
