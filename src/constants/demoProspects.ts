/**
 * Fichas de prospectos para la fábrica de demos del SuperAdmin.
 * Fuente: GLOWAPP/Webs Demo Manresa - Fichas.md (jul 2026).
 * Precios y duraciones: estimación de mercado Manresa — en la visita se presentan
 * siempre como ajustables, nunca como los reales del negocio.
 */

export interface DemoService {
  name: string;
  price: number;
  durationMin: number;
  category: string;
}

export interface DemoProspect {
  slug: string;
  name: string;
  businessType: "peluqueria" | "barberia" | "estetica" | "spa" | "unas" | "salon_belleza" | "fisioterapia";
  typeLabel: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  heroImageUrl: string;
  team: string[];
  services: DemoService[];
  /** Gancho de entrada para la visita — solo informativo en la UI */
  hook: string;
  /** Prueba social del negocio, para priorizar */
  reviews: string;
}

export const DEMO_PROSPECTS: DemoProspect[] = [
  {
    slug: "karoma",
    name: "Karoma Estilistas",
    businessType: "peluqueria",
    typeLabel: "Peluquería",
    tagline: "Especialistes en balayage i brasileños a Manresa",
    address: "Carrer d'Amadeu Vives, 33-35",
    city: "Manresa",
    phone: "629076666",
    heroImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200",
    team: ["Karo", "Marta", "Laia"],
    services: [
      { name: "Balayage", price: 85, durationMin: 150, category: "Color" },
      { name: "Alisado brasileño", price: 150, durationMin: 180, category: "Tratamientos" },
      { name: "Mechas", price: 55, durationMin: 120, category: "Color" },
      { name: "Tall i pentinat", price: 24, durationMin: 45, category: "Corte" },
      { name: "Tractament capil·lar", price: 30, durationMin: 45, category: "Tratamientos" },
    ],
    hook: "Equipo de 3-4 y balayages de 2h30 — cada llamada corta un servicio largo. Aquí reservan solas y cada estilista tiene su agenda.",
    reviews: "277 reseñas · 4,7★",
  },
  {
    slug: "carmeballesteros",
    name: "Carme Ballesteros Estilistes",
    businessType: "peluqueria",
    typeLabel: "Peluquería",
    tagline: "Estilistes especialitzats en color i tall",
    address: "Carrer dels Cintaires, 22",
    city: "Manresa",
    phone: "626731017",
    heroImageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200",
    team: ["Carme", "Anna", "Júlia"],
    services: [
      { name: "Tall", price: 24, durationMin: 45, category: "Corte" },
      { name: "Color", price: 42, durationMin: 90, category: "Color" },
      { name: "Balayage", price: 80, durationMin: 150, category: "Color" },
      { name: "Mechas", price: 55, durationMin: 120, category: "Color" },
      { name: "Pentinat de núvia", price: 75, durationMin: 90, category: "Eventos" },
    ],
    hook: "Su Instagram está genial — esto le pone un botón de reservar debajo. La que ve una story a las 23h, reserva a las 23h.",
    reviews: "253 reseñas · 4,9★",
  },
  {
    slug: "iratxe",
    name: "Iratxe Perruquers",
    businessType: "peluqueria",
    typeLabel: "Peluquería",
    tagline: "La teva perruqueria de confiança a Manresa",
    address: "Carrasco i Formiguera, 27",
    city: "Manresa",
    phone: "938740342",
    heroImageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200",
    team: ["Iratxe", "Montse", "Clara"],
    services: [
      { name: "Tall", price: 23, durationMin: 45, category: "Corte" },
      { name: "Color", price: 40, durationMin: 90, category: "Color" },
      { name: "Mechas", price: 52, durationMin: 120, category: "Color" },
      { name: "Pentinat de núvia", price: 70, durationMin: 90, category: "Eventos" },
      { name: "Tractament capil·lar", price: 28, durationMin: 45, category: "Tratamientos" },
    ],
    hook: "Ya tienen web — pero ¿se puede reservar en ella? Esta es la suya con reservas de verdad.",
    reviews: "166 reseñas · 4,6★",
  },
  {
    slug: "josepreina",
    name: "Josep Reina Perruquers",
    businessType: "peluqueria",
    typeLabel: "Peluquería",
    tagline: "Perruqueria artesanal amb passió pel cabell",
    address: "Carrer de Sant Llorenç de Brindisi, 22",
    city: "Manresa",
    phone: "684413484",
    heroImageUrl: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=1200",
    team: ["Josep", "Mireia"],
    services: [
      { name: "Tall", price: 22, durationMin: 45, category: "Corte" },
      { name: "Color", price: 40, durationMin: 90, category: "Color" },
      { name: "Mechas", price: 50, durationMin: 120, category: "Color" },
      { name: "Pentinat", price: 35, durationMin: 45, category: "Eventos" },
      { name: "Tractament capil·lar", price: 28, durationMin: 45, category: "Tratamientos" },
    ],
    hook: "Un 5,0 con 114 reseñas y no se puede reservar online — cada cliente nuevo que busca un domingo se va al que sí puede.",
    reviews: "114 reseñas · 5,0★",
  },
  {
    slug: "xlperruquers",
    name: "XL Perruquers",
    businessType: "peluqueria",
    typeLabel: "Peluquería",
    tagline: "Perruqueria unisex al Passeig de Pere III",
    address: "Passeig de Pere III, 34",
    city: "Manresa",
    phone: "937427279",
    heroImageUrl: "https://images.unsplash.com/photo-1582095133179-bfd08e2195c6?w=1200",
    team: ["Xavi", "Lourdes", "Pau"],
    services: [
      { name: "Tall home", price: 15, durationMin: 30, category: "Corte" },
      { name: "Tall dona", price: 23, durationMin: 45, category: "Corte" },
      { name: "Color", price: 40, durationMin: 90, category: "Color" },
      { name: "Mechas", price: 52, durationMin: 120, category: "Color" },
      { name: "Pentinat d'ocasió", price: 40, durationMin: 60, category: "Eventos" },
    ],
    hook: "En pleno Passeig, la mitad de llamadas se pierden en hora punta. Esto las convierte en reservas.",
    reviews: "100 reseñas · 4,7★",
  },
  {
    slug: "quirostetic",
    name: "Quirostetic",
    businessType: "estetica",
    typeLabel: "Centro de estética",
    tagline: "Estètica i benestar a Manresa des de fa més de 20 anys",
    address: "Carrer de la Font del Gat, 25",
    city: "Manresa",
    phone: "938744632",
    heroImageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200",
    team: ["Montse", "Raquel"],
    services: [
      { name: "Depilació làser", price: 45, durationMin: 45, category: "Depilación" },
      { name: "Tractament facial", price: 40, durationMin: 60, category: "Facial" },
      { name: "Tractament corporal", price: 45, durationMin: 60, category: "Corporal" },
      { name: "Manicura", price: 20, durationMin: 45, category: "Uñas" },
      { name: "Maquillatge permanent", price: 250, durationMin: 120, category: "Maquillaje" },
    ],
    hook: "20 años de clientela fiel — esto es para que las hijas de sus clientas la encuentren y reserven desde el móvil.",
    reviews: "170 reseñas · 5,0★",
  },
  {
    slug: "anua",
    name: "anua nails & beauty studio",
    businessType: "unas",
    typeLabel: "Uñas / Belleza",
    tagline: "Nail art i bellesa amb estil propi",
    address: "Carrer del Pujolet, 29",
    city: "Manresa",
    phone: "930373209",
    heroImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200",
    team: ["Ainhoa", "Núria"],
    services: [
      { name: "Manicura semipermanent", price: 25, durationMin: 45, category: "Manicura" },
      { name: "Pedicura", price: 28, durationMin: 60, category: "Pedicura" },
      { name: "Nail art", price: 35, durationMin: 75, category: "Nail art" },
      { name: "Extensions d'ungles", price: 42, durationMin: 90, category: "Extensiones" },
      { name: "Tractament facial", price: 38, durationMin: 60, category: "Facial" },
    ],
    hook: "Su estudio ES Instagram. Esto es su Instagram con botón de reservar — sin DMs a medianoche.",
    reviews: "41 reseñas · 4,7★",
  },
  {
    slug: "esteticaactual",
    name: "Estètica Actual",
    businessType: "estetica",
    typeLabel: "Centro de estética",
    tagline: "La teva estètica de referència a Manresa",
    address: "Ctra. de Santpedor, 134",
    city: "Manresa",
    phone: "938736008",
    heroImageUrl: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=1200",
    team: ["Toñi"],
    services: [
      { name: "INDIBA facial", price: 55, durationMin: 60, category: "Facial" },
      { name: "Neteja facial profunda", price: 42, durationMin: 75, category: "Facial" },
      { name: "Massatge", price: 38, durationMin: 60, category: "Corporal" },
      { name: "Depilació", price: 12, durationMin: 30, category: "Depilación" },
      { name: "Tractament corporal", price: 45, durationMin: 60, category: "Corporal" },
    ],
    hook: "Trabaja sola — cuando está en cabina, el teléfono es su enemigo. Mismo perfil que Cristina: tu mejor cierre.",
    reviews: "32 reseñas · 4,8★",
  },
];
