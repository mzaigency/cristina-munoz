import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowDown } from "lucide-react";

interface Tenant {
  name: string;
  tagline?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  hero_images?: unknown;
  logo_url?: string | null;
  show_logo_on_landing?: boolean | null;
  primary_color?: string | null;
  secondary_color?: string | null;
}

interface HeroBoldProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export function HeroBold({ tenant, onBookNow }: HeroBoldProps) {
  const heroImages = tenant.hero_images as string[] | null;
  const heroImage = heroImages?.[0] || tenant.hero_image_url;

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";

  const primaryColor = tenant.primary_color || '#F97316';
  const secondaryColor = tenant.secondary_color || '#EAB308';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Color Block Header */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative px-4 pt-8 pb-12"
      >
        {/* Background Shape */}
        <div 
          className="absolute inset-x-4 top-4 bottom-0 rounded-3xl"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          }}
        />

        {/* Decorative circles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-8 right-8 w-24 h-24 border-2 border-white/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-16 right-16 w-16 h-16 border border-white/10 rounded-full"
        />

        {/* Content */}
        <div className="relative z-10 text-center px-6 py-8">
          {/* Logo */}
          {tenant.logo_url && (
            <motion.img
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              src={tenant.logo_url}
              alt={tenant.name}
              className="w-16 h-16 object-contain mx-auto mb-6 rounded-2xl bg-white/10 p-2"
            />
          )}

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-white mb-4 uppercase tracking-wide"
          >
            {tenant.name}
          </motion.h1>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-20 h-1 bg-white/40 mx-auto mb-4 rounded-full"
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg text-white/90 font-body mb-8 max-w-sm mx-auto"
          >
            {displayTagline}
          </motion.p>

          {/* CTA Button - Big and Bold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Button
              onClick={onBookNow}
              size="lg"
              className="px-10 py-7 text-lg font-bold bg-white text-foreground hover:bg-white/90 shadow-2xl rounded-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              ¡Reservar Ahora!
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Featured Image */}
      {heroImage && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="px-4 -mt-4"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={heroImage}
              alt={tenant.name}
              className="w-full aspect-[4/3] object-cover"
            />
            
            {/* Gradient overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            />
            
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg"
            >
              <span className="text-2xl">✨</span>
              <span className="text-sm font-medium text-foreground">Experiencia única</span>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col items-center py-8"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
        <span className="text-sm text-muted-foreground mt-2">Ver más</span>
      </motion.div>
    </div>
  );
}
