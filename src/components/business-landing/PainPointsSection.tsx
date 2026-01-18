import { motion } from 'framer-motion';
import { 
  MessageSquareX, 
  CalendarX, 
  TrendingDown, 
  Clock, 
  UserX,
  ArrowDown
} from 'lucide-react';

const painPoints = [
  {
    icon: MessageSquareX,
    problem: '¿Pierdes citas por WhatsApp?',
    description: 'Mensajes que se olvidan, doble reservas, clientes frustrados.',
  },
  {
    icon: CalendarX,
    problem: '¿Tu agenda es un caos?',
    description: 'Libretas, post-its, hojas sueltas... imposible organizarse.',
  },
  {
    icon: TrendingDown,
    problem: '¿No sabes cuánto facturas?',
    description: 'Sin control de ingresos, difícil tomar decisiones.',
  },
  {
    icon: Clock,
    problem: '¿Pierdes tiempo al teléfono?',
    description: 'Llamadas durante servicios, clientes que no contestan.',
  },
  {
    icon: UserX,
    problem: '¿Los clientes no vuelven?',
    description: 'Sin recordatorios ni seguimiento, se olvidan de ti.',
  },
];

export const PainPointsSection = () => {
  return (
    <section className="py-20 bg-[hsl(230,20%,8%)]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-red-400 uppercase tracking-wider">
            ¿Te suena familiar?
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-white">
            Los problemas de siempre
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Si gestionas tu negocio con WhatsApp, llamadas y libretas... 
            probablemente estés perdiendo tiempo y dinero cada día.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-6 rounded-2xl bg-[hsl(230,15%,12%)] border border-white/5 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <point.icon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">
                {point.problem}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transition to solution */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-flex items-center gap-2 text-primary font-medium"
          >
            <ArrowDown className="w-5 h-5" />
            <span>GlowApp soluciona todo esto</span>
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};