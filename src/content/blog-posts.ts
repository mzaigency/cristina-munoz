export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  author: string;
  readingMinutes: number;
  tags: string[];
  // HTML body. Keep semantic: h2, h3, p, ul, ol, blockquote.
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-digitalizar-tu-peluqueria-en-2026",
    title: "Cómo digitalizar tu peluquería en 2026 (guía práctica paso a paso)",
    description:
      "Guía completa para digitalizar una peluquería en España: reservas online, agenda, caja, fichas de cliente y marketing en WhatsApp. Sin tecnicismos.",
    date: "2026-06-10",
    author: "Equipo Glowapp",
    readingMinutes: 8,
    tags: ["peluquería", "digitalización", "guía"],
    body: `
<p>Digitalizar tu peluquería en 2026 ya no significa contratar un informático ni gastarte miles de euros en una página web. Hoy puedes tener reservas online, agenda, caja y CRM funcionando en una tarde, desde el móvil, sin saber de tecnología.</p>
<h2>Por qué digitalizar tu peluquería</h2>
<ul>
  <li><strong>El 67% de las reservas se hacen fuera del horario comercial</strong>, según datos internos de Glowapp en salones españoles.</li>
  <li>Reducir un 80% las llamadas para coger cita libera al equipo para trabajar.</li>
  <li>Las fichas digitales evitan errores con coloración o alergias.</li>
  <li>Los recordatorios automáticos por WhatsApp reducen las ausencias hasta un 60%.</li>
</ul>
<h2>Paso 1: elige una plataforma todo-en-uno</h2>
<p>Evita coleccionar herramientas. Busca una solución que cubra al menos: web pública con tu marca, reservas 24/7, agenda multiprofesional, caja registradora, fichas de cliente y recordatorios automáticos. Si pagas por funcionalidades sueltas (SMS aparte, cobros aparte, marketing aparte), el coste real se multiplica.</p>
<h2>Paso 2: monta tu agenda y catálogo de servicios</h2>
<p>Define con claridad cuánto dura cada servicio (incluyendo limpieza entre clientes), qué profesional puede hacerlo y su precio. Una buena duración por servicio es la base para que la agenda no se desborde.</p>
<h2>Paso 3: abre reservas online</h2>
<p>Publica tu enlace de reservas en Google Business, Instagram, WhatsApp Business y el escaparate del salón con un QR. La primera semana avisa a tu base de clientes habituales por WhatsApp.</p>
<h2>Paso 4: activa los recordatorios automáticos</h2>
<p>Configura recordatorios a 24h y 2h antes de cada cita. Es la mejora más rentable que puedes hacer: menos huecos vacíos, más facturación.</p>
<h2>Paso 5: registra cobros y fichas en cada visita</h2>
<p>Cada cliente debe tener su ficha con historial, fotos antes/después si procede, fórmula de color, preferencias y notas. Esto convierte tu salón en un activo: si entra una persona nueva al equipo, sabe exactamente qué hacer.</p>
<h2>Paso 6: pide reseñas verificadas</h2>
<p>Después de cada cita pide una reseña con un solo clic. Las reseñas verificadas (solo de clientes que realmente han pasado por el salón) son las que mejor convierten a nuevos visitantes.</p>
<h2>Cuánto cuesta digitalizar una peluquería</h2>
<p>Con Glowapp el primer mes es gratis y a partir de ahí el plan parte de un precio plano en euros. Comparado con la suma de página web (≈30€/mes), software de reservas (≈40€/mes), CRM (≈25€/mes) y SMS de recordatorio, el ahorro es claro.</p>
<h2>Errores comunes a evitar</h2>
<ol>
  <li>Tener varias herramientas que no hablan entre sí.</li>
  <li>No pedir reseñas tras cada cita.</li>
  <li>Configurar duraciones de servicio demasiado optimistas.</li>
  <li>Olvidar avisar a tus clientes históricos del nuevo canal de reservas.</li>
</ol>
<p>Si quieres acompañamiento, en Glowapp ofrecemos servicio "Guante Blanco" gratuito el primer mes: te montamos servicios, horarios y catálogo por ti.</p>
`,
  },
  {
    slug: "mejor-software-reservas-salon-belleza-espana",
    title: "Mejor software de reservas para salones de belleza en España (2026)",
    description:
      "Comparativa honesta de las plataformas de reservas para salones en España: Booksy, Treatwell, Fresha y Glowapp. Precios reales, comisiones y casos de uso.",
    date: "2026-06-08",
    author: "Equipo Glowapp",
    readingMinutes: 7,
    tags: ["comparativa", "software", "reservas"],
    body: `
<p>Elegir software para tu salón en España no es trivial: los precios cambian, hay comisiones ocultas y casi ninguna plataforma cubre todo lo que necesitas (web pública + agenda + caja + CRM + recordatorios). Aquí va una comparativa honesta y actualizada.</p>
<h2>Qué debe cubrir un buen software para salón</h2>
<ul>
  <li>Página web profesional con tu marca y dominio.</li>
  <li>Reservas online 24/7 sin descargas para el cliente.</li>
  <li>Agenda multiprofesional con bloqueos y solapamientos inteligentes.</li>
  <li>Caja registradora con TPV y arqueo diario.</li>
  <li>Fichas de cliente con historial, notas y fotos.</li>
  <li>Recordatorios automáticos por WhatsApp o SMS.</li>
  <li>Soporte en español accesible.</li>
</ul>
<h2>Booksy</h2>
<p>Plataforma popular sobre todo en barberías. Buen marketplace, pero cobra por cita nueva conseguida a través de su marketplace y la web propia del salón vive dentro de Booksy. La app está orientada al cliente final.</p>
<h2>Treatwell</h2>
<p>Marketplace fuerte en grandes ciudades. Comisiones por reserva confirmada y necesidad de mantener disponibilidad en sus calendarios. Pensado para salones que aceptan vivir dentro del marketplace.</p>
<h2>Fresha</h2>
<p>Modelo "gratis" en la versión básica, con comisiones cuando activas cobros online, marketing o recordatorios. Calidad de producto alta, pero el precio real es difícil de predecir y el soporte en español es limitado.</p>
<h2>Glowapp</h2>
<p>Hecha en España, mobile-first. Plan plano en euros con el primer mes gratis. Incluye web pública con tu dominio, agenda multiprofesional, caja, CRM, recordatorios por WhatsApp y un feed social donde tus clientes descubren tu salón. Sin comisión por cita.</p>
<h2>Resumen</h2>
<ul>
  <li><strong>Si vives del marketplace y aceptas comisión por cita →</strong> Booksy o Treatwell.</li>
  <li><strong>Si quieres "gratis" y no te importa pagar por funcionalidad →</strong> Fresha.</li>
  <li><strong>Si quieres dueño absoluto de tu cliente, soporte en español y precio plano →</strong> Glowapp.</li>
</ul>
<p>Si dudas, lo más honesto es probar Glowapp el primer mes gratis y mantener tu plataforma actual en paralelo. Te darás cuenta de la diferencia en una semana.</p>
`,
  },
  {
    slug: "como-reducir-ausencias-citas-salon",
    title: "Cómo reducir las ausencias (no-shows) en tu salón de belleza",
    description:
      "5 tácticas probadas para reducir las ausencias y citas perdidas en tu salón: recordatorios por WhatsApp, depósitos, lista de espera y políticas claras.",
    date: "2026-06-05",
    author: "Equipo Glowapp",
    readingMinutes: 5,
    tags: ["operaciones", "ausencias", "consejos"],
    body: `
<p>Cada cita perdida son entre 25 y 80€ que no recuperas. Si tu tasa de ausencias supera el 8%, vale la pena atacarla. Estas son las 5 tácticas que mejor funcionan en salones españoles.</p>
<h2>1. Recordatorios automáticos por WhatsApp</h2>
<p>Mucho más efectivos que el SMS o el email. Configura uno a 24h (para que el cliente confirme) y otro a 2h (para evitar olvidos). Pide confirmación con un clic.</p>
<h2>2. Reserva con depósito en clientes nuevos</h2>
<p>Para servicios largos (color, mechas, tratamientos), pide un depósito reembolsable del 20%. Filtra automáticamente a quien no pensaba ir.</p>
<h2>3. Lista de espera activa</h2>
<p>Cuando alguien cancela, una lista de espera automática avisa al primer cliente disponible. En Glowapp esto pasa solo: el hueco se cubre antes de que se enfríe.</p>
<h2>4. Política de cancelación clara</h2>
<p>Comunica desde la reserva que cancelar con menos de 24h supone perder el depósito o quedar penalizado para futuras reservas. La transparencia funciona mejor que la sanción agresiva.</p>
<h2>5. Mide y actúa sobre los reincidentes</h2>
<p>Marca con una etiqueta a clientes con 2+ ausencias en 6 meses. Con Glowapp puedes pedirles depósito automáticamente en su próxima reserva.</p>
<h2>Bonus: cómo recuperar al cliente que no vino</h2>
<p>No le mandes una bronca por WhatsApp. Mándale un mensaje preguntando si está todo bien y ofreciendo reprogramar. La mitad volverá.</p>
<p>Con estas cinco palancas, un salón medio reduce las ausencias del 12% al 3-4% en menos de dos meses.</p>
`,
  },
];

export const getPostBySlug = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);
