/**
 * Business Information Configuration
 *
 * This file contains all the business-related constants and information.
 * Update these values to customize the website for a different salon/business.
 */

export const BUSINESS_INFO = {
  // Basic Information
  name: "Cristina Muñoz",
  fullName: "Cristina Muñoz Peluquería",
  tagline: "Peluquería profesional en Santpedor",

  // Contact Information
  contact: {
    phone: "+34 938 321 054",
    phoneDisplay: "+34 938 321 054",
    whatsapp: "+34 674 034 526",
    whatsappDisplay: "+34 674 034 526",
    whatsappLink: "https://wa.me/34674034526",
  },

  // Location
  location: {
    address: "Carrer Pompeu Fabra, 20, Bajos",
    city: "Santpedor",
    postalCode: "08251",
    province: "Barcelona",
    country: "España",
    // Full address for display
    fullAddress: "Carrer Pompeu Fabra, 20, Bajos\n08251 Santpedor, Barcelona",
    // Google Maps embed URL
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2990.2!2d1.8234!3d41.8045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4f8f8f8f8f8f8%3A0x0!2sCarrer%20Pompeu%20Fabra%2C%2020%2C%2008251%20Santpedor%2C%20Barcelona!5e0!3m2!1ses!2ses!4v1234567890",
  },

  // Business Hours
  schedule: {
    tuesday: { label: "Mar - Vie", hours: "9:00 - 12:30 / 15:00 - 19:00" },
    saturday: { label: "Sábado", hours: "8:00 - 13:00" },
    closed: { label: "Lun y Dom", hours: "Cerrado" },
  },

  // Social Media
  social: {
    instagram: {
      url: "https://www.instagram.com/cristinamunoz_hairstylist/",
      handle: "@cristinamunoz_hairstylist",
    },
    facebook: null, // Set to null if not used
    tiktok: null, // Set to null if not used
  },

  // Instagram Gallery Posts
  instagramPosts: [
    "https://www.instagram.com/p/DOOJlP2jCFc/",
    "https://www.instagram.com/p/DA1mNTQIQii/",
    "https://www.instagram.com/p/C53dETjoweW/",
    "https://www.instagram.com/p/C4k3-6OIa-K/",
    "https://www.instagram.com/p/C3um5Rao4XF/",
    "https://www.instagram.com/p/C-NFDz_I7bE/",
  ],

  // WhatsApp AI Agent
  whatsappAgent: {
    enabled: true,
    defaultMessage: "Hola, me gustaría hablar con el agente de IA de la peluquería.",
  },

  // Legal
  legal: {
    copyrightYear: 2025,
    companyName: "Cristina Muñoz",
  },

  // About Section (for About page)
  about: {
    ownerName: "Cristina Muñoz",
    story: {
      intro:
        "Siempre he tenido un gran espíritu de superación, y desde pequeña me atrajo el mundo de la belleza. Comencé mi carrera a los 15 años, trabajando en diferentes salones, y después de mucho esfuerzo, logré cumplir mi sueño de abrir mi propio salón hace 14 años.",
      specialty:
        "A lo largo de este tiempo, he explorado diferentes áreas, pero ahora he decidido dedicarme de lleno a lo que realmente me apasiona: el maquillaje y los recogidos. Tras una formación intensa y muchos años de experiencia, finalmente puedo ofrecer todo mi conocimiento y dedicación para hacer que cada novia se sienta única en su día más especial.",
      team: "En mi salón, no solo cuento con mi pasión y dedicación, sino también con un equipo profesional que comparte el mismo compromiso por la excelencia. Cada miembro aporta su experiencia única, trabajando juntos para asegurar que cada cliente reciba un servicio personalizado y de la más alta calidad. Juntos, creamos experiencias memorables que realzan la belleza natural de cada persona.",
    },
    quote:
      "El maquillaje y el peinado perfectos no solo realzan la belleza de una novia, sino que cuentan su historia en el día más importante de su vida.",
  },
} as const;

// Helper function to get WhatsApp link with custom message
export const getWhatsAppLink = (customMessage?: string): string => {
  const message = customMessage || BUSINESS_INFO.whatsappAgent.defaultMessage;
  return `${BUSINESS_INFO.contact.whatsappLink}?text=${encodeURIComponent(message)}`;
};

// Helper function to format address for display
export const getFullAddress = (): string => {
  return `${BUSINESS_INFO.location.address}, ${BUSINESS_INFO.location.postalCode} ${BUSINESS_INFO.location.city}, ${BUSINESS_INFO.location.province}`;
};
