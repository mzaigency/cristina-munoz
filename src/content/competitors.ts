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
      "Booksy te da visibilidad en su marketplace, pero la cuota crece 8 €/mes por cada profesional, su Boost se queda el 30% de la primera visita de cada cliente nuevo y la web de tu salón vive dentro de su plataforma. Glowapp es la alternativa española: tu propia web profesional, precio plano por plan (no por silla) y el primer mes gratis.",
    whyChange: [
      "Precio plano por plan: no pagas 8 €/mes extra por cada profesional que crece tu equipo.",
      "Captar clientes nuevos por tu web y tu QR no te cuesta comisión (Boost de Booksy: 30% de la primera visita).",
      "Tu marca, tu dominio, tu cliente — no un perfil dentro de su marketplace.",
      "Agenda multiprofesional, caja, CRM, tienda y recordatorios automáticos incluidos.",
      "Soporte humano en español por WhatsApp.",
    ],
    comparison: [
      { feature: "Coste por profesional extra", glow: "0 € — precio plano por plan", other: "8 €/mes + IVA por cada profesional", winner: "glow" },
      { feature: "Comisión por captar clientes nuevos", glow: "0%", other: "Con Boost: 30% de la primera visita", winner: "glow" },
      { feature: "Página web con tu dominio", glow: "Incluida y editable", other: "Perfil dentro de Booksy", winner: "glow" },
      { feature: "Primer mes", glow: "Gratis, sin permanencia", other: "Cuota desde el inicio (34,99 €/mes + IVA)", winner: "glow" },
      { feature: "Recordatorios automáticos", glow: "Email y push incluidos", other: "SMS incluidos", winner: "tie" },
      { feature: "Agenda multiprofesional", glow: "Sí, según plan", other: "Sí, pagando por profesional", winner: "tie" },
      { feature: "Marketplace de descubrimiento", glow: "Feed social en España", other: "Marketplace internacional", winner: "tie" },
      { feature: "Soporte en español", glow: "WhatsApp humano", other: "Chat / email", winner: "glow" },
    ],
    faq: [
      {
        question: "¿Glowapp es realmente una alternativa a Booksy?",
        answer:
          "Sí. Glowapp combina web propia con tu dominio, agenda multiprofesional, caja, CRM y capa social en un solo plan plano. Sin comisión por captar clientes nuevos y sin pagar por cada profesional extra.",
      },
      {
        question: "¿Cuánto puedo ahorrar respecto a Booksy?",
        answer:
          "Depende de tu equipo y de cómo captas. Booksy cuesta 34,99 €/mes + IVA y suma 8 €/mes por cada profesional extra; si además usas Boost, cada cliente nuevo del marketplace te cuesta el 30% de su primera visita (unos 10 €/cliente con un ticket de 35 €). Con Glowapp el precio es plano por plan y captar por tu web, tu QR o Instagram no lleva comisión. Y sobre todo: la web y los clientes son tuyos.",
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
      "Si te cansa pagar cuota anual más comisión por cada cliente nuevo que llega desde Treatwell, Glowapp es la alternativa pensada para salones independientes en España. Captas por tu propia web sin comisión, el cliente es tuyo desde el primer día y empiezas gratis el primer mes.",
    whyChange: [
      "Captar clientes nuevos por tu web, tu QR o Instagram no lleva comisión.",
      "Tu marca, tu web, tu cliente — no compartido con otros salones.",
      "Soporte en español por WhatsApp y email, no tickets que tardan días.",
      "Reservas 24/7, agenda multi-profesional, caja y CRM en la misma app.",
      "Pensada para móvil — tu equipo lo lleva todo desde el teléfono.",
    ],
    comparison: [
      { feature: "Comisión por captar clientes nuevos", glow: "0%", other: "Comisión por cada cliente nuevo del marketplace", winner: "glow" },
      { feature: "Página web propia con tu dominio", glow: "Incluida y editable", other: "Listado dentro del marketplace", winner: "glow" },
      { feature: "Primer mes", glow: "Gratis, sin permanencia", other: "Cuota anual desde el inicio", winner: "glow" },
      { feature: "Multiprofesional", glow: "Sí, según plan", other: "Sí", winner: "tie" },
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
          "Treatwell cobra cuota anual más comisión por cada cliente nuevo que llega desde su marketplace, y añade un 2% + IVA si el cliente paga online por adelantado. Con Glowapp pagas una suscripción plana y conocida, y captar por tus propios canales no lleva comisión. El ahorro exacto depende de cuántos clientes nuevos te entren cada mes — y con Glowapp esos clientes pasan a ser tuyos, no del marketplace.",
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
      "Captar un cliente nuevo por el marketplace de Fresha cuesta el 20% de su primera cita. Por tu web con Glowapp: 0%.",
      "Tu propia página web con tu dominio, no un perfil dentro de Fresha.",
      "Precio plano y conocido: sabes lo que pagas cada mes, sin comisiones variables.",
      "Hecho en España: soporte en español y cumplimiento RGPD nativo.",
      "Mobile-first: todo se gestiona desde el móvil, sin instalar nada.",
    ],
    comparison: [
      { feature: "Comisión por clientes nuevos del marketplace", glow: "0% — captas por tu propia web", other: "20% de la primera cita", winner: "glow" },
      { feature: "Modelo de precio", glow: "Plano en euros (primer mes gratis)", other: "Gratis + comisiones variables", winner: "glow" },
      { feature: "Comisión por cobro online", glow: "Solo la de Stripe (no añadimos nada)", other: "2,19% + 0,20 € por transacción", winner: "glow" },
      { feature: "Web propia con tu dominio", glow: "Incluida", other: "Perfil dentro de Fresha", winner: "glow" },
      { feature: "Recordatorios automáticos", glow: "Email y push incluidos + Kit WhatsApp", other: "Incluidos, con extras de pago", winner: "tie" },
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
