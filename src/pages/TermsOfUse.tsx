import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

export default function TermsOfUse() {
  return (
    <>
      <SEO 
        title="Términos y Condiciones de Uso"
        description="Términos y condiciones de uso de GlowApp, la plataforma de reservas de belleza."
      />
      
      <div className="min-h-screen bg-background">
        <header 
          className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="container mx-auto flex items-center h-16 px-4">
            <Button variant="ghost" asChild className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent">
              <Link to="/">
                <ChevronLeft className="h-6 w-6" />
                <span>Inicio</span>
              </Link>
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Términos y Condiciones de Uso</h1>
          <p className="text-muted-foreground mb-8">
            Última actualización: 16 de febrero de 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground/80 leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">1. Aceptación de los Términos</h2>
              <p>Al acceder, registrarte o utilizar GlowApp (en adelante, «la Plataforma»), aceptas quedar vinculado por estos Términos y Condiciones de Uso. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.</p>
              <p className="mt-2">El uso continuado de la Plataforma tras la publicación de modificaciones constituye la aceptación de los términos actualizados.</p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">2. Descripción del Servicio</h2>
              <p>GlowApp es una plataforma digital que conecta a clientes con profesionales de la belleza y el bienestar. La Plataforma ofrece dos perfiles de uso:</p>
              <ul className="list-disc pl-6 space-y-1 mt-4">
                <li><strong>Perfil Cliente:</strong> permite buscar y descubrir salones, reservar citas, comunicarse con salones, dejar reseñas y valoraciones, seguir a sus salones favoritos y gestionar sus reservas.</li>
                <li><strong>Perfil Profesional:</strong> permite gestionar un salón de belleza de forma integral, incluyendo agenda de citas, equipo de estilistas, servicios, caja registradora, promociones, publicaciones, stories, mensajería con clientes, estadísticas de rendimiento y presencia online mediante una página de aterrizaje personalizada.</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">3. Registro y Tipos de Cuenta</h2>
              <p>Para utilizar las funcionalidades de la Plataforma, debes crear una cuenta proporcionando información veraz y actualizada. Existen dos tipos de cuenta:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Cuenta de Cliente:</strong> gratuita, permite acceder a las funcionalidades de búsqueda, reservas, reseñas, seguimiento de salones y mensajería.</li>
                <li><strong>Cuenta Profesional:</strong> requiere un proceso de registro de negocio (onboarding) y, dependiendo del plan elegido, puede implicar el pago de una suscripción mensual o anual.</li>
              </ul>
              <p className="mt-4">Eres responsable de:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Mantener la confidencialidad de tus credenciales de acceso</li>
                <li>Todas las actividades que se realicen bajo tu cuenta</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
                <li>Mantener tu información de perfil actualizada</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">4. Uso de la Plataforma como Cliente</h2>
              <p>Como cliente, puedes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Buscar salones por ubicación, categoría o nombre</li>
                <li>Consultar servicios, precios y disponibilidad en tiempo real</li>
                <li>Reservar citas seleccionando servicios, estilista, fecha y hora</li>
                <li>Cancelar o reagendar reservas según la política del salón</li>
                <li>Publicar reseñas y valoraciones tras una visita</li>
                <li>Seguir salones y guardarlos como favoritos</li>
                <li>Enviar y recibir mensajes directos con salones</li>
                <li>Ver stories y responder a contenido interactivo publicado por los salones</li>
                <li>Recibir notificaciones de recordatorios de citas y mensajes</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">5. Uso como Profesional</h2>
              <p>Los profesionales acceden a herramientas avanzadas de gestión de negocio según el plan de suscripción contratado. Las funcionalidades incluyen, entre otras:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gestión de agenda y calendario de citas</li>
                <li>Administración de equipo de estilistas con horarios individualizados</li>
                <li>Catálogo de servicios con precios y duraciones</li>
                <li>Caja registradora con seguimiento de transacciones</li>
                <li>Gestión de clientes (CRM) con historial de visitas</li>
                <li>Publicación de contenido: posts, stories con widgets interactivos</li>
                <li>Promociones y códigos de descuento</li>
                <li>Generación de contenido asistido por inteligencia artificial</li>
                <li>Estadísticas y objetivos mensuales de rendimiento</li>
                <li>Página de aterrizaje personalizable para el salón</li>
                <li>Sistema de comisiones para estilistas</li>
              </ul>
              <p className="mt-4">El alcance de las funcionalidades disponibles dependerá del plan de suscripción contratado (Starter, Professional, Premium o equivalentes).</p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">6. Reservas y Cancelaciones</h2>
              <p>Al realizar una reserva a través de la Plataforma:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Te comprometes a asistir a la cita en la fecha y hora acordada</li>
                <li>Deberás cancelar con la mayor antelación posible, idealmente con al menos 24 horas de antelación</li>
                <li>Los salones podrán establecer y aplicar sus propias políticas de cancelación</li>
                <li>Las cancelaciones reiteradas sin previo aviso podrán resultar en restricciones temporales de cuenta</li>
                <li>Los salones podrán cancelar o reagendar citas notificando al cliente a través de la Plataforma</li>
              </ul>
              <p className="mt-4">GlowApp actúa como intermediario tecnológico y no es responsable de la calidad, puntualidad o resultado de los servicios prestados por los salones.</p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">7. Sistema de Reseñas y Valoraciones</h2>
              <p>Los clientes pueden publicar reseñas y valoraciones sobre los salones visitados. Al hacerlo:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Garantizas que tu opinión es honesta y se basa en una experiencia real</li>
                <li>Tu nombre y foto de perfil serán visibles públicamente junto a la reseña</li>
                <li>Las reseñas podrán ser moderadas por los administradores del salón o por GlowApp</li>
                <li>Nos reservamos el derecho de eliminar reseñas que contengan contenido ofensivo, falso, difamatorio o que viole estos términos</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">8. Contenido Generado por el Usuario</h2>
              <p>Los usuarios (tanto clientes como profesionales) pueden generar y publicar contenido en la Plataforma, incluyendo fotografías, publicaciones, stories, comentarios y reseñas. Al publicar contenido:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Garantizas que tienes los derechos necesarios sobre dicho contenido</li>
                <li>Otorgas a GlowApp una licencia no exclusiva, mundial y gratuita para usar, mostrar y distribuir el contenido dentro de la Plataforma</li>
                <li>Eres el único responsable del contenido que publicas</li>
                <li>GlowApp puede moderar, ocultar o eliminar contenido que viole estos términos o la legislación aplicable</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">9. Mensajería Directa</h2>
              <p>La Plataforma ofrece un sistema de mensajería directa entre clientes y salones. Al utilizar esta funcionalidad:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Te comprometes a utilizar la mensajería con fines legítimos relacionados con los servicios del salón</li>
                <li>No debes enviar contenido spam, publicitario no solicitado, ofensivo o ilegal</li>
                <li>Los salones pueden recibir notificaciones de nuevos mensajes según sus preferencias configuradas</li>
                <li>GlowApp no monitoriza activamente el contenido de los mensajes, pero se reserva el derecho de actuar ante denuncias de uso indebido</li>
              </ul>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">10. Notificaciones y Comunicaciones</h2>
              <p>GlowApp puede enviarte comunicaciones a través de:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Notificaciones push:</strong> recordatorios de citas, nuevos mensajes, actualizaciones de reservas y novedades relevantes</li>
                <li><strong>Correo electrónico:</strong> confirmaciones de reserva, verificación de cuenta, solicitudes de reseñas y comunicaciones de servicio</li>
                <li><strong>Notificaciones in-app:</strong> alertas dentro de la propia aplicación</li>
              </ul>
              <p className="mt-4">Puedes gestionar tus preferencias de notificaciones desde la configuración de tu cuenta. Las comunicaciones esenciales de servicio (como confirmaciones de reserva) no pueden desactivarse mientras mantengas tu cuenta activa.</p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">11. Pagos y Suscripciones</h2>
              <p>Las suscripciones para cuentas profesionales se gestionan a través de Stripe, nuestro procesador de pagos certificado PCI-DSS:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Los planes pueden ser mensuales o anuales</li>
                <li>Los precios se muestran con impuestos incluidos cuando corresponda</li>
                <li>Las suscripciones se renuevan automáticamente salvo cancelación previa</li>
                <li>Puedes cancelar tu suscripción en cualquier momento; seguirás disfrutando del servicio hasta el final del período facturado</li>
                <li>Los reembolsos se gestionarán caso por caso contactando a nuestro equipo de soporte</li>
                <li>GlowApp se reserva el derecho de modificar los precios de los planes con un preaviso mínimo de 30 días</li>
              </ul>
              <p className="mt-4">GlowApp no almacena datos de tarjetas de crédito. Toda la información de pago es gestionada directamente por Stripe.</p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">12. Propiedad Intelectual</h2>
              <p>Todo el contenido de la Plataforma (diseño, logotipos, textos, código fuente, funcionalidades, marcas comerciales) es propiedad de GlowApp o de sus licenciantes y está protegido por las leyes de propiedad intelectual e industrial aplicables.</p>
              <p className="mt-2">Queda prohibida la reproducción, distribución, modificación o uso comercial del contenido de la Plataforma sin autorización previa y por escrito de GlowApp.</p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">13. Conducta Prohibida</h2>
              <p>Queda expresamente prohibido:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Publicar contenido falso, difamatorio, discriminatorio, violento o ilegal</li>
                <li>Acosar, amenazar o intimidar a otros usuarios o salones</li>
                <li>Suplantar la identidad de otra persona o entidad</li>
                <li>Crear cuentas falsas o múltiples cuentas con fines fraudulentos</li>
                <li>Utilizar la Plataforma para actividades ilegales o no autorizadas</li>
                <li>Intentar acceder sin autorización a cuentas, datos o sistemas de otros usuarios</li>
                <li>Realizar scraping, ingeniería inversa o cualquier uso automatizado no autorizado</li>
                <li>Interferir con el funcionamiento normal de la Plataforma</li>
                <li>Eludir las medidas de seguridad implementadas</li>
              </ul>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">14. Limitación de Responsabilidad</h2>
              <p>GlowApp actúa como intermediario tecnológico entre clientes y salones de belleza. En consecuencia:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>No somos responsables de la calidad, seguridad o resultado de los servicios prestados por los salones</li>
                <li>No garantizamos la disponibilidad ininterrumpida de la Plataforma</li>
                <li>No somos parte en las disputas entre clientes y salones</li>
                <li>No nos responsabilizamos de pérdidas económicas derivadas del uso de la Plataforma, más allá de lo establecido por la legislación aplicable</li>
                <li>No garantizamos la exactitud del contenido generado por inteligencia artificial</li>
              </ul>
              <p className="mt-4">En la máxima medida permitida por la ley, la responsabilidad total de GlowApp estará limitada al importe pagado por el usuario en los últimos 12 meses.</p>
            </section>

            {/* 15 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">15. Terminación de Cuenta</h2>
              <p>GlowApp se reserva el derecho de suspender o cancelar tu cuenta si:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violas estos Términos y Condiciones</li>
                <li>Realizas actividades fraudulentas o ilegales</li>
                <li>Tu conducta perjudica a otros usuarios, salones o a la Plataforma</li>
                <li>No abonas las cuotas de suscripción (para cuentas profesionales)</li>
              </ul>
              <p className="mt-4">Puedes eliminar tu cuenta voluntariamente en cualquier momento desde la configuración de tu perfil. Consulta nuestra <Link to="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link> para más información sobre la eliminación de datos.</p>
            </section>

            {/* 16 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">16. Ley Aplicable, Jurisdicción y Contacto</h2>
              <p>Estos Términos y Condiciones se rigen por la legislación española. Para cualquier controversia derivada del uso de la Plataforma, ambas partes se someten a la jurisdicción de los tribunales competentes de España.</p>
              <p className="mt-4">Si alguna cláusula de estos términos fuera declarada nula o inaplicable, las restantes cláusulas mantendrán su plena vigencia y efecto.</p>
              <p className="mt-4">Para cualquier consulta sobre estos términos, puedes contactarnos en: <a href="mailto:contacto@glowapp.app" className="text-primary hover:underline">contacto@glowapp.app</a></p>
            </section>

          </div>
        </main>

        <footer 
          className="border-t border-border/50 py-6 mt-12"
          style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} GlowApp. Todos los derechos reservados.</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link to="/privacidad" className="hover:text-primary">Política de Privacidad</Link>
              <Link to="/terminos" className="hover:text-primary">Términos de Uso</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
