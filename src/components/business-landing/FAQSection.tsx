import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "¿De verdad es gratis? ¿Dónde está la trampa?",
    answer: "El primer mes es gratis y sin compromiso. Stripe te pedirá una tarjeta solo para verificar tu cuenta, pero no te cobramos nada durante ese mes. Puedes cancelar cuando quieras antes de que termine y no pagarás ni un euro. Empezamos siendo accesibles para que cualquier negocio pueda digitalizarse sin barreras.",
  },
  {
    question: "¿Cobráis comisión por reserva o por cliente?",
    answer: "Nunca. Precio plano por plan, sin comisión por reserva ni por captar clientas. Solo pagas la comisión de Stripe cuando cobras online, igual que cualquier pago con tarjeta.",
  },
  {
    question: "¿Mis datos y los de mis clientes están seguros?",
    answer: "Sí. Tus datos y los de tus clientes están cifrados y alojados en servidores europeos, cumpliendo el RGPD. No vendemos ni cedemos información a terceros, y tus clientes son tuyos — no de un marketplace.",
  },
  {
    question: "¿Puedo pasar mi agenda desde otra app o desde papel?",
    answer: "Sí. Puedes empezar de cero en minutos o traer tus servicios, horarios y clientes. Si vienes de otra herramienta o de la libreta de toda la vida, te echamos una mano para que no pierdas nada por el camino.",
  },
  {
    question: "¿Cuánto tiempo tarda en configurarse?",
    answer: "La configuración básica toma unos 5 minutos. Solo necesitas añadir tus servicios, horarios y una foto de tu negocio. El sistema te guía paso a paso.",
  },
  {
    question: "¿Necesito conocimientos técnicos?",
    answer: "Para nada. Glowapp está diseñado para usarse desde el móvil sin ningún conocimiento técnico. Si sabes usar WhatsApp, sabes usar Glowapp.",
  },
  {
    question: "¿Funciona con mi equipo de profesionales?",
    answer: "Sí. Puedes añadir varios profesionales, cada uno con su propio horario y calendario. Los clientes eligen con quién quieren reservar.",
  },
  {
    question: "¿Qué pasa si tengo problemas o dudas?",
    answer: "Tienes soporte en español por WhatsApp y email incluido. Respondemos en menos de 24 horas (normalmente mucho antes). También tienes tutoriales y guías en la app.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-14 max-w-2xl text-balance text-center text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
        >
          Lo que preguntáis{" "}
          <span
            style={{
              background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            antes de empezar.
          </span>
        </motion.h2>

        <div className="mx-auto max-w-3xl">
          {faqs.map((faq, index) => {
            const open = openIndex === index;
            return (
              <div key={index} className="border-b border-border">
                <button
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={open}
                >
                  <span className="text-base font-semibold text-foreground">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-shrink-0 ${open ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <Plus className="h-5 w-5" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
