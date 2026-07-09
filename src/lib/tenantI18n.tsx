import { createContext, useContext, type ReactNode } from "react";

/**
 * i18n ligero de la web pública del tenant (glowapp.app/{slug}).
 * Solo traduce el "chrome" de la UI — el contenido (servicios, textos del
 * salón) lo escribe cada negocio en su idioma. El idioma se elige por tenant
 * (tenants.language: 'es' | 'ca') desde Ajustes.
 */

export type TenantLang = "es" | "ca";

const es = {
  // Header / nav
  "nav.home": "Inicio",
  "nav.services": "Servicios",
  "nav.booking": "Reservar",
  "nav.shop": "Tienda",
  "nav.gallery": "Galería",
  "nav.reviews": "Reseñas",
  "nav.contact": "Contacto",
  "nav.myAccount": "Mi Cuenta",
  "nav.signIn": "Inicia sesión",
  "nav.signOut": "Cerrar sesión",
  "nav.backToGlow": "Volver a GlowApp",
  "nav.myBookings": "Mis citas",

  // Hero
  "hero.bookNow": "Reservar cita",
  "hero.bookOnline": "Reserva online",
  "hero.defaultTagline": "Tu espacio de belleza y bienestar",

  // Barra de confianza + barra de reserva
  "trust.online": "Reserva 24/7",
  "trust.noCalls": "Sin llamadas",
  "trust.openToday": "Abierto hoy",
  "trust.reviews": "reseñas",
  "bookbar.sub": "Reserva cuando quieras",
  "services.menuKicker": "La carta",
  "services.menuTitle": "Servicios y precios",
  "services.seeFullMenu": "Ver toda la carta",
  "services.seeLess": "Ver menos",
  "booking.oneMinTitlePre": "Reserva en",
  "booking.oneMinAccent": "un minuto",
  "booking.oneMinSub": "Elige servicio, día y hora. Sin llamar.",

  // Servicios
  "services.title": "Servicios",
  "services.titlePre": "La carta de",
  "services.titleAccent": "belleza",
  "services.discoverPre": "Descubre la propuesta cuidada de",
  "services.countLabel": "servicios",
  "services.otherCategory": "Otros",
  "services.subtitle": "Tratamientos pensados para realzar lo que ya eres.",
  "services.loading": "Cargando servicios...",
  "services.error": "No se pudieron cargar los servicios",
  "services.multiHint": "Puedes seleccionar varios servicios",
  "services.priceOnRequest": "Consulta disponibilidad al reservar",
  "services.minutes": "min",

  // Reserva
  "booking.title": "Reserva en 3 pasos",
  "booking.subtitle": "Elige servicio, fecha y confirma. Sin compromiso.",
  "booking.reserveTitle": "Reserva tu Cita",
  "booking.followSteps": "Sigue los pasos para reservar tu cita{place} de forma rápida y sencilla",
  "booking.in": "en",
  "booking.from": "desde",
  "booking.stepOf": "Paso {step} de 3",
  "booking.mustSignInPre": "Debes ",
  "booking.signInLink": "iniciar sesión",
  "booking.mustSignInPost": " para continuar",
  "booking.totalDurationLabel": "Duración total",
  "booking.minutes": "minutos",
  "booking.stepServices": "Selecciona tus servicios",
  "booking.stepDateTime": "Selecciona fecha y hora",
  "booking.stepConfirm": "Confirma tu reserva",
  "booking.dateTime": "Fecha y hora",
  "booking.selectDate": "Selecciona una fecha",
  "booking.selectTime": "Selecciona una hora",
  "booking.firstSelectDate": "Primero selecciona una fecha",
  "booking.loadingSchedule": "Cargando horarios...",
  "booking.anyPro": "Cualquier profesional",
  "booking.whoPrefer": "¿Con quién prefieres?",
  "booking.confirm": "Confirmar",
  "booking.continue": "Continuar",
  "booking.back": "Volver",
  "booking.finalDetails": "Últimos detalles para completar tu reserva",
  "booking.signInToContinue": "Accede para continuar con tu reserva",
  "booking.requestedServices": "Servicios solicitados:",
  "booking.total": "Total",
  "booking.confirmBooking": "Confirmar reserva",
  "booking.booking": "Reservando...",
  "booking.success": "¡Reserva confirmada!",
  "booking.noSlots": "No hay huecos disponibles este día",
  "booking.waitlistAdd": "Añadir a lista de espera",
  "booking.waitlistLoginRequired": "Debes iniciar sesión para unirte a la lista de espera",
  "booking.waitlistError": "No se pudo añadir a la lista de espera",
  "booking.waitlistSuccess": "Te avisaremos si se libera un hueco",
  "booking.morning": "Mañana",
  "booking.afternoon": "Tarde",
  "booking.breakLabel": "Descanso",
  "booking.noSlotsDay": "No hay horarios disponibles para este día. Todos los slots están reservados.",
  "booking.addMeWaitlist": "Añadirme a la lista de espera",
  "booking.estimatedDuration": "Duración estimada: {min} minutos (finaliza a las {end})",
  "booking.waitlistTitle": "Lista de espera",
  "booking.waitlistNotify": "Te notificaremos dentro de la app cuando haya disponibilidad para {date}.",
  "booking.thisDate": "esta fecha",
  "booking.addYouAs": "Te añadiremos como:",
  "booking.cancel": "Cancelar",
  "booking.adding": "Añadiendo...",
  "booking.waitlistSuccessTitle": "¡Te avisaremos! 🔔",
  "booking.waitlistSuccessDesc": "Estás en la lista de espera. Si surge un hueco, te llegará un aviso para confirmarlo con un toque.",
  "booking.loadingAvailable": "Cargando horarios disponibles...",

  // Galería
  "gallery.title": "Galería",
  "gallery.eyebrow": "el espacio",
  "gallery.titlePre": "Nuestro ",
  "gallery.titleAccent": "salón",
  "gallery.subtitle": "Una mirada al estudio.",
  "gallery.daily": "Lo que hacemos cada día en",
  "gallery.comingSoon": "Próximamente compartiremos nuestros trabajos",

  // Contacto / mensajes
  "contact.title": "Contacto",
  "contact.subtitle": "Pasa por el estudio o escríbenos por el canal que prefieras.",
  "contact.writePlaceholder": "Escribe tu mensaje aquí...",
  "contact.send": "Enviar",
  "contact.sent": "¡Mensaje enviado!",
  "contact.emptyMessage": "Mensaje vacío",
  "contact.emptyMessageDesc": "Por favor escribe un mensaje antes de enviar.",
  "contact.loginRequired": "Necesitas iniciar sesión para enviar mensajes.",
  "contact.sendError": "No se pudo enviar el mensaje. Inténtalo de nuevo.",

  // Reseñas
  "reviews.title": "Reseñas",
  "reviews.eyebrow": "lo que dicen",
  "reviews.titlePre": "",
  "reviews.titleAccent": "Reseñas",
  "reviews.fullReview": "Reseña completa",
  "reviews.noComment": "Sin comentario",
  "reviews.verified": "Cliente verificado",
  "reviews.empty": "Aún no hay reseñas",

  // Ubicación / footer
  "location.title": "dónde estamos",
  "location.titlePre": "Ubicación y ",
  "location.titleAccent": "horario",
  "location.address": "Dirección",
  "location.viewOnMaps": "Ver en Google Maps",
  "location.follow": "Síguenos",
  "location.hours": "Horario",
  "location.closed": "Cerrado",
  "location.loadingHours": "Cargando horarios...",
  "location.comingSoon": "Ubicación próximamente",
  "footer.rights": "Todos los derechos reservados",
  "footer.madeWith": "Web creada con",
  "footer.daysShort": "Lun,Mar,Mié,Jue,Vie,Sáb,Dom",
  "footer.madeWithGlow": "Creado con GlowApp",
  "footer.privacy": "Privacidad",
  "footer.terms": "Términos",
  "footer.defaultAbout": "Tu espacio de confianza{place}. Profesionales dedicados a ofrecerte la mejor experiencia.",

  // Tienda
  "shop.title": "Nuestra tienda",
  "shop.subtitle": "Productos exclusivos",
  "shop.tagline": "Llévate a casa nuestros favoritos o reserva con tu próxima cita",
  "shop.addToCart": "Añadir al carrito",
  "shop.cart": "Carrito",
} as const;

const ca: Record<keyof typeof es, string> = {
  "nav.home": "Inici",
  "nav.services": "Serveis",
  "nav.booking": "Reservar",
  "nav.shop": "Botiga",
  "nav.gallery": "Galeria",
  "nav.reviews": "Ressenyes",
  "nav.contact": "Contacte",
  "nav.myAccount": "El meu compte",
  "nav.signIn": "Inicia sessió",
  "nav.signOut": "Tanca la sessió",
  "nav.backToGlow": "Tornar a GlowApp",
  "nav.myBookings": "Les meves cites",

  "hero.bookNow": "Reserva la teva cita",
  "hero.bookOnline": "Reserva en línia",
  "hero.defaultTagline": "El teu espai de bellesa i benestar",

  "trust.online": "Reserva 24/7",
  "trust.noCalls": "Sense trucades",
  "trust.openToday": "Obert avui",
  "trust.reviews": "ressenyes",
  "bookbar.sub": "Reserva quan vulguis",
  "services.menuKicker": "La carta",
  "services.menuTitle": "Serveis i preus",
  "services.seeFullMenu": "Veure tota la carta",
  "services.seeLess": "Veure menys",
  "booking.oneMinTitlePre": "Reserva en",
  "booking.oneMinAccent": "un minut",
  "booking.oneMinSub": "Tria servei, dia i hora. Sense trucar.",

  "services.title": "Serveis",
  "services.titlePre": "La carta de",
  "services.titleAccent": "bellesa",
  "services.discoverPre": "Descobreix la proposta cuidada de",
  "services.countLabel": "serveis",
  "services.otherCategory": "Altres",
  "services.subtitle": "Tractaments pensats per realçar el que ja ets.",
  "services.loading": "Carregant serveis...",
  "services.error": "No s'han pogut carregar els serveis",
  "services.multiHint": "Pots seleccionar diversos serveis",
  "services.priceOnRequest": "Consulta la disponibilitat en reservar",
  "services.minutes": "min",

  "booking.title": "Reserva en 3 passos",
  "booking.subtitle": "Tria servei, data i confirma. Sense compromís.",
  "booking.reserveTitle": "Reserva la teva cita",
  "booking.followSteps": "Segueix els passos per reservar la teva cita{place} de manera ràpida i senzilla",
  "booking.in": "a",
  "booking.from": "des de",
  "booking.stepOf": "Pas {step} de 3",
  "booking.mustSignInPre": "Has d'",
  "booking.signInLink": "iniciar sessió",
  "booking.mustSignInPost": " per continuar",
  "booking.totalDurationLabel": "Durada total",
  "booking.minutes": "minuts",
  "booking.stepServices": "Selecciona els teus serveis",
  "booking.stepDateTime": "Selecciona data i hora",
  "booking.stepConfirm": "Confirma la teva reserva",
  "booking.dateTime": "Data i hora",
  "booking.selectDate": "Selecciona una data",
  "booking.selectTime": "Selecciona una hora",
  "booking.firstSelectDate": "Primer selecciona una data",
  "booking.loadingSchedule": "Carregant horaris...",
  "booking.anyPro": "Qualsevol professional",
  "booking.whoPrefer": "Amb qui prefereixes?",
  "booking.confirm": "Confirmar",
  "booking.continue": "Continuar",
  "booking.back": "Enrere",
  "booking.finalDetails": "Últims detalls per completar la teva reserva",
  "booking.signInToContinue": "Accedeix per continuar amb la teva reserva",
  "booking.requestedServices": "Serveis sol·licitats:",
  "booking.total": "Total",
  "booking.confirmBooking": "Confirmar la reserva",
  "booking.booking": "Reservant...",
  "booking.success": "Reserva confirmada!",
  "booking.noSlots": "No hi ha hores disponibles aquest dia",
  "booking.waitlistAdd": "Afegir a la llista d'espera",
  "booking.waitlistLoginRequired": "Has d'iniciar sessió per unir-te a la llista d'espera",
  "booking.waitlistError": "No s'ha pogut afegir a la llista d'espera",
  "booking.waitlistSuccess": "T'avisarem si s'allibera una hora",
  "booking.morning": "Matí",
  "booking.afternoon": "Tarda",
  "booking.breakLabel": "Descans",
  "booking.noSlotsDay": "No hi ha horaris disponibles per a aquest dia. Totes les hores estan reservades.",
  "booking.addMeWaitlist": "Afegeix-me a la llista d'espera",
  "booking.estimatedDuration": "Durada estimada: {min} minuts (acaba a les {end})",
  "booking.waitlistTitle": "Llista d'espera",
  "booking.waitlistNotify": "T'avisarem dins de l'app quan hi hagi disponibilitat per al {date}.",
  "booking.thisDate": "aquesta data",
  "booking.addYouAs": "T'afegirem com a:",
  "booking.cancel": "Cancel·lar",
  "booking.adding": "Afegint...",
  "booking.waitlistSuccessTitle": "T'avisarem! 🔔",
  "booking.waitlistSuccessDesc": "Ets a la llista d'espera. Si queda una hora lliure, t'arribarà un avís per confirmar-la amb un toc.",
  "booking.loadingAvailable": "Carregant horaris disponibles...",

  "gallery.title": "Galeria",
  "gallery.eyebrow": "l'espai",
  "gallery.titlePre": "El nostre ",
  "gallery.titleAccent": "saló",
  "gallery.subtitle": "Una mirada a l'estudi.",
  "gallery.daily": "El que fem cada dia a",
  "gallery.comingSoon": "Ben aviat compartirem els nostres treballs",

  "contact.title": "Contacte",
  "contact.subtitle": "Passa per l'estudi o escriu-nos pel canal que prefereixis.",
  "contact.writePlaceholder": "Escriu el teu missatge aquí...",
  "contact.send": "Enviar",
  "contact.sent": "Missatge enviat!",
  "contact.emptyMessage": "Missatge buit",
  "contact.emptyMessageDesc": "Si us plau, escriu un missatge abans d'enviar.",
  "contact.loginRequired": "Has d'iniciar sessió per enviar missatges.",
  "contact.sendError": "No s'ha pogut enviar el missatge. Torna-ho a provar.",

  "reviews.title": "Ressenyes",
  "reviews.eyebrow": "el que diuen",
  "reviews.titlePre": "",
  "reviews.titleAccent": "Ressenyes",
  "reviews.fullReview": "Ressenya completa",
  "reviews.noComment": "Sense comentari",
  "reviews.verified": "Client verificat",
  "reviews.empty": "Encara no hi ha ressenyes",

  "location.title": "on som",
  "location.titlePre": "Ubicació i ",
  "location.titleAccent": "horari",
  "location.address": "Adreça",
  "location.viewOnMaps": "Veure a Google Maps",
  "location.follow": "Segueix-nos",
  "location.hours": "Horari",
  "location.closed": "Tancat",
  "location.loadingHours": "Carregant horaris...",
  "location.comingSoon": "Ubicació ben aviat",
  "footer.rights": "Tots els drets reservats",
  "footer.madeWith": "Web creada amb",
  "footer.daysShort": "Dl,Dt,Dc,Dj,Dv,Ds,Dg",
  "footer.madeWithGlow": "Creat amb GlowApp",
  "footer.privacy": "Privacitat",
  "footer.terms": "Termes",
  "footer.defaultAbout": "El teu espai de confiança{place}. Professionals dedicats a oferir-te la millor experiència.",

  "shop.title": "La nostra botiga",
  "shop.subtitle": "Productes exclusius",
  "shop.tagline": "Emporta't a casa els nostres favorits o reserva'ls amb la teva propera cita",
  "shop.addToCart": "Afegir al cistell",
  "shop.cart": "Cistell",
};

const DICTS: Record<TenantLang, Record<keyof typeof es, string>> = { es, ca };

export type TenantI18nKey = keyof typeof es;

const TenantLocaleContext = createContext<TenantLang>("es");

export function TenantLocaleProvider({ lang, children }: { lang?: string | null; children: ReactNode }) {
  const resolved: TenantLang = lang === "ca" ? "ca" : "es";
  return <TenantLocaleContext.Provider value={resolved}>{children}</TenantLocaleContext.Provider>;
}

export function useTenantLang(): TenantLang {
  return useContext(TenantLocaleContext);
}

/** Locale BCP-47 para toLocaleDateString y similares. */
export function useTenantLocale(): string {
  return useTenantLang() === "ca" ? "ca-ES" : "es-ES";
}

export function useT() {
  const lang = useTenantLang();
  return (key: TenantI18nKey, vars?: Record<string, string | number>): string => {
    let s: string = DICTS[lang][key] ?? es[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    }
    return s;
  };
}
