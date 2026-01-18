import { motion } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const comparisons = [
  {
    before: 'Agenda en papel o WhatsApp',
    after: 'Calendario digital sincronizado',
  },
  {
    before: 'No sabes cuánto facturas',
    after: 'Analytics en tiempo real',
  },
  {
    before: 'Clientes olvidan sus citas',
    after: 'Recordatorios automáticos',
  },
  {
    before: 'Sin presencia online',
    after: 'Tu propia web profesional',
  },
  {
    before: 'Pierdes clientes potenciales',
    after: 'Reservas 24/7 automáticas',
  },
  {
    before: 'Gestión manual del equipo',
    after: 'Agenda por estilista',
  },
];

export const BeforeAfterSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-[hsl(230,20%,8%)]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            El cambio es real
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-white">
            Antes vs Después
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Mira cómo GlowApp transforma la gestión de tu negocio día a día.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 font-medium text-sm border border-red-500/20">
                <X className="w-4 h-4" />
                Sin GlowApp
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20">
                <Check className="w-4 h-4" />
                Con GlowApp
              </span>
            </div>
          </div>

          {/* Comparison rows */}
          <div className="space-y-3">
            {comparisons.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="p-4 rounded-xl bg-[hsl(230,15%,12%)] border border-red-500/10 flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-white/50">{item.before}</span>
                </div>
                <div className="p-4 rounded-xl bg-[hsl(230,15%,12%)] border border-primary/20 flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-white">{item.after}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              className="rounded-full gradient-primary border-0 shadow-lg shadow-primary/30"
              onClick={() => navigate('/auth?mode=register&business=true')}
            >
              Quiero el "después"
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};