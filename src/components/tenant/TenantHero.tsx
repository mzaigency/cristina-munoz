import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
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

  // Dynamic tagline
  const tagline = tenant.tagline || 
    `Tu peluquería de confianza${tenant.city ? ` en ${tenant.city}` : ''}. Donde la belleza y el estilo se encuentran.`;

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10"
    >
      {/* Hero Image Background */}
      {hasHeroImage && (
        <>
          <div className="absolute inset-0 z-0">
            <img 
              src={tenant.hero_image_url!} 
              alt={`${tenant.name} - Peluquería profesional`}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
        </>
      )}

      {/* Background Pattern (when no hero image) */}
      {!hasHeroImage && (
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo */}
          {tenant.logo_url && (
            <motion.img 
              src={tenant.logo_url} 
              alt={`Logo de ${tenant.name}`}
              className="h-20 md:h-24 mx-auto mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 ${
              hasHeroImage ? 'text-white' : 'text-primary'
            }`}
          >
            {tenant.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${
              hasHeroImage ? 'text-white/90' : 'text-muted-foreground'
            }`}
          >
            {tagline}
          </motion.p>

          {/* Location */}
          {(tenant.city || tenant.address) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className={`flex items-center justify-center gap-2 mb-8 ${
                hasHeroImage ? 'text-white/80' : 'text-muted-foreground'
              }`}
            >
              <MapPin className={`h-5 w-5 ${hasHeroImage ? 'text-white' : 'text-primary'}`} />
              <span>{tenant.address ? `${tenant.address}, ` : ''}{tenant.city}</span>
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={onBookNow}
              className="text-lg px-8 py-6 rounded-full hover:scale-105 transition-transform bg-primary text-primary-foreground"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Reservar Cita
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Decorative gradient at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-background to-transparent"
      />
    </section>
  );
};

export default TenantHero;
