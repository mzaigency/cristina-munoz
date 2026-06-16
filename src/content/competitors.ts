export interface CompetitorData {
  slug: string; // url slug after /alternativa-a-
  name: string; // competitor name
  tagline: string;
  intro: string;
  whyChange: string[];
  comparison: {
    feature: string;
    glow: string;
    other: string;
    winner: "glow" | "other" | "tie";
  }[];
  faq: { question: string; answer: string }[];
  migration: string[];
}

export const COMPETITORS: Record<string, CompetitorData> = {
  booksy: {
    slug: "booksy",
    name: "Booksy",
    tagline: "La alternativa a Booksy para salones que quieren ser dueños de su cliente",
    intro:
      "Booksy te da visibilidad en su marketplace, pero cobra comisión por cita nueva y la web de tu salón vive dentro de su plataforma. Glowapp es la alternativa española: tu propia web profesional, sin comisiones por reserva y con el primer mes gratis.",
    whyChange: [
      "Sin comisión por reservas conseguidas en tu propia web.",
      "Tu marca, tu dominio, tu cliente — no compartido con la competencia.",
      "Plan plano en euros, sin sorpresas por cita o por SMS.",
      "Agenda multiprofesional, caja, CRM y recordatorios WhatsApp incluidos.",
      "Soporte humano en español por WhatsApp.",
    ],
    comparison: [
      { feature: "Comisión por reserva nueva del marketplace", glow: "0%", other: "Comisión por cita nueva", winner: "glow" },
      { feature: "Página web con tu dominio", glow: "Incluida y editable", other: "Perfil dentro de Booksy", winner: "glow" },
      { feature: "Primer mes", glow: "Gratis, sin permanencia", other: "Periodo de prueba con condiciones", winner: "glow" },
      { feature: "Recordatorios WhatsApp", glow: "Incluidos", other: "Coste extra por SMS", winner: "glow" },
      { feature: "Agenda multiprofesional", glow: "Sí, sin coste extra", other: "Sí", winner: "tie" },
      { feature: "Marketplace de descubrimiento", glow: "Feed social en España", other: "Marketplace internacional", winner: "tie" },
      { feature: "Soporte en español", glow: "WhatsApp humano", other: "Chat / email", winner: "glow" },
    ],
    faq: [
      {
        question: "¿Glowapp es realmente una alternativa a Booksy?",
        answer:
          "Sí. Glowapp combina marketplace de descubrimiento, web propia con tu dominio, agenda multiprofesional, caja y CRM en un solo plan. Sin comisión por cita nueva.",
      },
      {
        question: "¿Cuánto puedo ahorrar respecto a Booksy?",
        answer:
          "Depende de tu volumen, pero un salón con 80 reservas/mes desde marketplace suele ahorrar entre 100 y 200€/mes en comisiones evitadas más SMS.",
      },
      {
        question: "¿Puedo importar mis servicios, horarios y clientes?",
        answer:
          "Sí. Te ayudamos con migración guiada gratuita en menos de 24h.",
      },
      {
        question: "¿Y las reseñas que tengo en Booksy?",
        answer:
          "Las reseñas son propiedad de Booksy, pero te ayudamos a pedir reseñas a tus clientes habituales por WhatsApp o QR para reconstruir tu reputación rápidamente.",
      },
    ],
    migration: [
      "Te registras en Glowapp en 5 minutos.",
      "Importamos tu catálogo, horarios y clientes (gratis).",
      "Te damos un nuevo enlace y QR con tu marca.",
      "Mantienes Booksy en paralelo durante el primer mes para no perder visibilidad.",
    ],
  },
  treatwell: {
    slug: "treatwell",
    name: "Treatwell",
    tagline: "La alternativa española a Treatwell para tu salón",
    intro:
      "Si te cansa pagar comisión por cada reserva que llega desde Treatwell, Glowapp es la alternativa pensada para salones independientes en España. Cobras el 100% de cada cita, tienes tu propia web profesional y empiezas gratis el primer mes.",
    whyChange: [
      "Sin comisión por reserva: cobras el 100% de cada cita.",
      "Tu marca, tu web, tu cliente — no compartido con otros salones.",
      "Soporte en español por WhatsApp y email, no tickets que tardan días.",
      "Reservas 24/7, agenda multi-profesional, caja y CRM en la misma app.",
      "Pensada para móvil — tu equipo lo lleva todo desde el teléfono.",
    ],
    comparison: [
      { feature: "Comisión por reserva", glow: "0% siempre", other: "Hasta 2,5€ + IVA por cita confirmada", winner: "glow" },
      { feature: "Página web propia con tu dominio", glow: "Incluida y editable", other: "Listado dentro del marketplace", winner: "glow" },
      { feature: "Primer mes", glow: "Gratis, sin permanencia", other: "Setup fee + comisiones desde el día 1", winner: "glow" },
      { feature: "Multiprofesional", glow: "Sí, sin coste extra", other: "Sí, con coste por estilista", winner: "glow" },
      { feature: "CRM y fichas de cliente", glow: "Incluido", other: "Limitado", winner: "glow" },
      { feature: "Reseñas verificadas", glow: "Sí, solo clientes reales que han reservado", other: "Sí", winner: "tie" },
      { feature: "Marketplace de descubrimiento", glow: "Sí, feed social en España", other: "Sí, marketplace internacional", winner: "tie" },
      { feature: "Soporte en español", glow: "WhatsApp humano en horario laboral", other: "Email / chat genérico", winner: "glow" },
    ],
    faq: [
      {
        question: "¿Glowapp es realmente una alternativa a Treatwell?",
        answer:
          "Sí. Glowapp combina lo mejor de Treatwell (visibilidad y reservas 24/7) con lo que un salón independiente necesita: su propia web, agenda, caja y CRM, sin pagar comisión por cada cita.",
      },
      {
        question: "¿Cuánto puedo ahorrar migrando desde Treatwell?",
        answer:
          "Si recibes 50 reservas al mes a través de Treatwell, te ahorras alrededor de 125€/mes en comisiones. Con Glowapp pagas una suscripción plana, sin sorpresas.",
      },
      {
        question: "¿Puedo importar mis clientes y servicios?",
        answer:
          "Sí. Te ayudamos con la migración guiada: importamos tu catálogo de servicios, horarios y base de clientes en menos de 24h.",
      },
      {
        question: "¿Y mis reseñas?",
        answer:
          "Las reseñas en Treatwell son propiedad de Treatwell, pero podemos ayudarte a recuperar reseñas pidiéndolas a tus clientes habituales mediante un enlace o QR.",
      },
    ],
    migration: [
      "Te registras en Glowapp en 5 minutos.",
      "Conectamos tu catálogo de servicios y horarios.",
      "Te damos un enlace y un QR para que tus clientes reserven directamente contigo.",
      "Mantienes Treatwell en paralelo el primer mes y vas trasladando la actividad.",
    ],
  },
  fresha: {
    slug: "fresha",
    name: "Fresha",
    tagline: "La alternativa a Fresha para salones que quieren ser dueños de su cliente",
    intro:
      "Fresha es gratis hasta que necesitas cobrar online, hacer marketing o aceptar pagos sin tarjeta presente. Glowapp es la alternativa transparente: precio plano en euros, sin comisiones sorpresa por cobros, y con tu propia web profesional desde el día uno.",
    whyChange: [
      "Precio plano en euros, sin comisiones por cobro ni por SMS.",
      "Tu propia página web con tu dominio, no un perfil dentro de Fresha.",
      "Sin upselling agresivo: todo el ERP (agenda, caja, CRM, productos) en el plan base.",
      "Hecho en España: soporte en español y cumplimiento RGPD nativo.",
      "Mobile-first: todo se gestiona desde el móvil, sin instalar nada.",
    ],
    comparison: [
      { feature: "Plan base", glow: "Plano en euros (primer mes gratis)", other: "Gratis con comisiones por funcionalidad", winner: "glow" },
      { feature: "Comisión por cobro online", glow: "Solo la de Stripe (no añadimos nada)", other: "Comisión adicional de Fresha", winner: "glow" },
      { feature: "Web propia con tu dominio", glow: "Incluida", other: "Perfil dentro de Fresha", winner: "glow" },
      { feature: "Marketing automático", glow: "WhatsApp + recordatorios incluidos", other: "Coste por SMS/marketing", winner: "glow" },
      { feature: "Multiprofesional", glow: "Sí, sin coste extra", other: "Sí", winner: "tie" },
      { feature: "Soporte en español", glow: "WhatsApp humano", other: "Chat en inglés mayoritariamente", winner: "glow" },
      { feature: "Cumplimiento RGPD y facturación española", glow: "Nativo", other: "Adaptado", winner: "glow" },
      { feature: "App móvil para el equipo", glow: "PWA sin instalación", other: "App nativa", winner: "tie" },
    ],
    faq: [
      {
        question: "Si Fresha es gratis, ¿por qué cambiar?",
        answer:
          "Fresha es gratis solo en su versión básica. En cuanto activas cobro online, recordatorios SMS o marketing, las comisiones suman rápido. Glowapp tiene un precio plano predecible.",
      },
      {
        question: "¿Glowapp acepta pagos online?",
        answer:
          "Sí, mediante Stripe. Solo pagas la comisión estándar de Stripe; Glowapp no añade ningún cargo adicional.",
      },
      {
        question: "¿Puedo migrar mi agenda y clientes desde Fresha?",
        answer:
          "Sí. Importamos tu catálogo, horarios y clientes en menos de 24h con nuestro servicio de migración guiada gratuito.",
      },
      {
        question: "¿Está adaptado al mercado español?",
        answer:
          "Sí. Glowapp se diseñó en España: facturación, RGPD, soporte en español por WhatsApp y horarios pensados para nuestro mercado.",
      },
    ],
    migration: [
      "Regístrate en Glowapp y completa el onboarding guiado de 5 minutos.",
      "Subimos tu catálogo, horarios y clientes de Fresha (gratis).",
      "Te damos un nuevo enlace de reservas con tu dominio.",
      "Avisas a tus clientes habituales por WhatsApp y empiezas a cobrar el 100%.",
    ],
  },
};
