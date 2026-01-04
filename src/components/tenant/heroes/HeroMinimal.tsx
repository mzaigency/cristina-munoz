import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Tenant {
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
  const heroImages = tenant.hero_images as string[] | null;
  const images = heroImages?.slice(0, 2) || [tenant.hero_image_url].filter(Boolean);

  const displayTagline = tenant.tagline || tenant.description || "Tu espacio de belleza y bienestar";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        {tenant.logo_url && (
          <img 
            src={tenant.logo_url} 
            alt={tenant.name}
            className="h-10 w-10 object-contain rounded-lg"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookNow}
          className="text-muted-foreground hover:text-foreground"
        >
          Reservar
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          {/* Name - Typography focused */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-light text-foreground tracking-tight leading-none mb-6">
            {tenant.name}
          </h1>

          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-24 h-px mx-auto mb-6"
            style={{ backgroundColor: tenant.primary_color || 'hsl(var(--primary))' }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed mb-10"
          >
            {displayTagline}
          </motion.p>

          {/* CTA Button - Outline style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Button
              onClick={onBookNow}
              variant="outline"
              size="lg"
              className="px-10 py-6 text-base border-2 hover:bg-foreground hover:text-background transition-all duration-300"
              style={{ borderColor: tenant.primary_color || 'hsl(var(--foreground))' }}
            >
              Reservar cita
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Images Grid */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="px-6 pb-12"
        >
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {images.slice(0, 2).map((img, idx) => (
              <div 
                key={idx}
                className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted"
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
