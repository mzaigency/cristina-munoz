import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">30 días gratis · Sin tarjeta</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-foreground">Deja de perder clientes</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              por WhatsApp
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Tu salón de belleza merece más que una libreta. Reservas automáticas 24/7, 
            cero llamadas perdidas y clientes que vuelven.
          </motion.p>

          {/* Key benefits pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {[
              { icon: Calendar, text: 'Tu propia web' },
              { icon: Clock, text: 'Reservas 24/7' },
              { icon: Sparkles, text: 'Listo en 15 min' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border"
              >
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              onClick={() => navigate('/auth?mode=register&business=true')}
            >
              Empezar gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-full"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Play className="mr-2 w-5 h-5" />
              Ver funciones
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 text-sm text-muted-foreground"
          >
            ✓ Configuración guiada · ✓ Sin conocimientos técnicos · ✓ Soporte incluido
          </motion.p>
        </div>

        {/* Hero mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent rounded-2xl blur-2xl transform scale-95" />
            
            {/* Mockup frame */}
            <div className="relative bg-gradient-to-b from-muted/80 to-muted/40 backdrop-blur-sm rounded-2xl border border-border/50 p-2 shadow-2xl">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-background/50 text-xs text-muted-foreground">
                    tunegocio.glowapp.es
                  </div>
                </div>
              </div>
              
              {/* Dashboard preview placeholder */}
              <div className="aspect-[16/9] bg-gradient-to-br from-background to-muted/50 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-48 mx-auto bg-muted rounded animate-pulse" />
                      <div className="h-3 w-32 mx-auto bg-muted/70 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square rounded-xl bg-muted/50 animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
        >
          <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
        </motion.div>
      </motion.div>
    </section>
  );
};
