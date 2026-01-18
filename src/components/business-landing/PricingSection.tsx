import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Building2, Crown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const plans = [
  {
    name: 'Starter',
    icon: Sparkles,
    description: 'Para empezar a digitalizar tu negocio',
    monthlyPrice: 19,
    annualPrice: 15,
    popular: false,
    features: [
      { text: '1 profesional', included: true },
      { text: 'Hasta 10 servicios', included: true },
      { text: 'Landing page personalizada', included: true },
      { text: 'Reservas online 24/7', included: true },
      { text: 'Calendario básico', included: true },
      { text: 'Recordatorios por email', included: true },
      { text: 'Analytics avanzados', included: false, tooltip: 'Disponible en Pro' },
      { text: 'Caja registradora', included: false, tooltip: 'Disponible en Pro' },
      { text: 'Stories y red social', included: false, tooltip: 'Disponible en Pro' },
    ],
  },
  {
    name: 'Pro',
    icon: Building2,
    description: 'La opción más popular para salones',
    monthlyPrice: 39,
    annualPrice: 29,
    popular: true,
    features: [
      { text: 'Hasta 5 profesionales', included: true },
      { text: 'Servicios ilimitados', included: true },
      { text: 'Landing page premium', included: true },
      { text: 'Reservas online 24/7', included: true },
      { text: 'Calendario multi-profesional', included: true },
      { text: 'Recordatorios automáticos', included: true },
      { text: 'Analytics avanzados', included: true },
      { text: 'Caja registradora completa', included: true },
      { text: 'Stories y red social', included: true },
    ],
  },
  {
    name: 'Business',
    icon: Crown,
    description: 'Para negocios grandes y cadenas',
    monthlyPrice: 79,
    annualPrice: 59,
    popular: false,
    features: [
      { text: 'Profesionales ilimitados', included: true },
      { text: 'Servicios ilimitados', included: true },
      { text: 'Landing page premium', included: true },
      { text: 'Reservas online 24/7', included: true },
      { text: 'Calendario avanzado', included: true },
      { text: 'Recordatorios personalizados', included: true },
      { text: 'Analytics y reportes PDF', included: true },
      { text: 'Caja + comisiones estilistas', included: true },
      { text: 'Soporte prioritario', included: true },
    ],
  },
];

export const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Precios transparentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4">
            Elige tu plan
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Todos los planes incluyen 30 días de prueba gratis. Sin tarjeta requerida. 
            Cancela cuando quieras.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted">
            <span className={`text-sm px-3 py-1.5 rounded-full transition-colors ${!isAnnual ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>
              Mensual
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm px-3 py-1.5 rounded-full transition-colors ${isAnnual ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>
              Anual
              <span className="ml-1 text-xs text-primary font-medium">-25%</span>
            </span>
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted/50 border border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-background text-primary text-xs font-medium shadow-lg">
                    Más popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <plan.icon className={`w-10 h-10 mx-auto mb-3 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">
                    €{isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className={`text-sm ${plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    /mes
                  </span>
                </div>
                {isAnnual && (
                  <p className={`text-xs mt-1 ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    Facturado anualmente (€{plan.annualPrice * 12}/año)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                <TooltipProvider>
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        feature.included
                          ? plan.popular ? 'bg-primary-foreground/20' : 'bg-primary/10'
                          : 'bg-muted'
                      }`}>
                        <Check className={`w-3 h-3 ${
                          feature.included
                            ? plan.popular ? 'text-primary-foreground' : 'text-primary'
                            : 'text-muted-foreground/50'
                        }`} />
                      </div>
                      <span className={`text-sm ${
                        !feature.included && (plan.popular ? 'text-primary-foreground/50' : 'text-muted-foreground/50')
                      }`}>
                        {feature.text}
                      </span>
                      {feature.tooltip && (
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {feature.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </li>
                  ))}
                </TooltipProvider>
              </ul>

              <Button
                className={`w-full rounded-full ${
                  plan.popular
                    ? 'bg-background text-primary hover:bg-background/90'
                    : ''
                }`}
                variant={plan.popular ? 'secondary' : 'default'}
                onClick={() => navigate('/auth?mode=register&business=true')}
              >
                Empezar gratis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            30 días gratis
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Sin tarjeta de crédito
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Cancela cuando quieras
          </span>
        </motion.div>
      </div>
    </section>
  );
};
