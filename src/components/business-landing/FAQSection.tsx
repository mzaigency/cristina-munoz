import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

const faqs = [
  {
    question: "¿Cuánto tiempo tarda en configurarse?",
    answer: "La configuración básica toma unos 5 minutos. Solo necesitas añadir tus servicios, horarios y una foto de tu negocio. El sistema te guía paso a paso.",
  },
  {
    question: "¿Necesito conocimientos técnicos?",
    answer: "Para nada. GlowApp está diseñado para ser usado desde el móvil sin ningún conocimiento técnico. Si sabes usar WhatsApp, sabes usar GlowApp.",
  },
  {
    question: "¿Cómo funciona el período de prueba?",
    answer: "Tienes 30 días completamente gratis con todas las funciones del plan. Al terminar la prueba, eliges si continuar o no.",
  },
  {
    question: "¿Mis clientes tienen que instalar algo?",
    answer: "No. Tus clientes acceden a tu página web y reservan desde el navegador del móvil. Si quieren, pueden añadir GlowApp a la pantalla de inicio como una app — es opcional, pero más cómodo.",
  },
  {
    question: "¿Funciona con mi equipo de estilistas?",
    answer: "Sí. Puedes añadir varios profesionales, cada uno con su propio horario y calendario. Los clientes eligen con quién quieren reservar.",
  },
  {
    question: "¿Qué pasa si tengo problemas o dudas?",
    answer: "Tienes soporte incluido por chat y email. Respondemos en menos de 24 horas (normalmente mucho antes). También tenemos tutoriales y guías en la app.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <SectionEyebrow icon={HelpCircle} label="Preguntas frecuentes" />
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-foreground">¿Tienes dudas?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aquí respondemos las preguntas más comunes. Si no encuentras lo que buscas, escríbenos y te ayudamos.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className={`w-full text-left p-5 rounded-xl transition-all ${
                    openIndex === index
                      ? "bg-primary/5 shadow-sm border border-primary/20"
                      : "bg-secondary/50 border border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-foreground">{faq.question}</span>
                    <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className={`w-5 h-5 flex-shrink-0 ${openIndex === index ? "text-primary" : "text-muted-foreground"}`} />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
