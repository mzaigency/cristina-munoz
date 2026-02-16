import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO 
        title="Política de Privacidad"
        description="Conoce cómo GlowApp recopila, usa y protege tu información personal. Cumplimiento RGPD completo."
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
          <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
          <p className="text-muted-foreground mb-8">
            Última actualización: 16 de febrero de 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground/80 leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">1. Responsable del Tratamiento</h2>
              <p>El responsable del tratamiento de tus datos personales es <strong>GlowApp</strong>, con domicilio en España. Puedes contactarnos en cualquier momento a través del correo electrónico <a href="mailto:contacto@glowapp.app" className="text-primary hover:underline">contacto@glowapp.app</a>.</p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">2. Datos que Recopilamos</h2>
              <p>Recopilamos distintas categorías de datos en función del uso que hagas de la plataforma:</p>

              <h3 className="text-lg font-medium mt-6 mb-2 text-foreground">2.1. Datos de registro y perfil</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre completo y nombre de usuario</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Fotografía de perfil (avatar)</li>
                <li>Ubicación: país, provincia y ciudad</li>
              </ul>

              <h3 className="text-lg font-medium mt-6 mb-2 text-foreground">2.2. Datos de reservas</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Fecha, hora y servicios seleccionados</li>
                <li>Estilista asignado/a</li>
                <li>Notas adicionales proporcionadas por el cliente</li>
                <li>Nombre del cliente y teléfono (almacenados de forma encriptada)</li>
                <li>Estado y canal de la reserva</li>
              </ul>

              <h3 className="text-lg font-medium mt-6 mb-2 text-foreground">2.3. Datos de actividad social</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Reseñas, valoraciones y comentarios en publicaciones</li>
                <li>«Me gusta», salones seguidos y favoritos</li>
                <li>Mensajes directos entre usuarios y salones</li>
                <li>Respuestas a encuestas y widgets interactivos en stories</li>
                <li>Visualizaciones de stories</li>
              </ul>

              <h3 className="text-lg font-medium mt-6 mb-2 text-foreground">2.4. Datos de negocio (para profesionales)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Información del salón: nombre, dirección, horarios, servicios, precios y promociones</li>
                <li>Transacciones y registros de caja (con datos sensibles encriptados)</li>
                <li>Datos de estilistas y equipo: nombre, foto, horario y comisiones</li>
                <li>Objetivos mensuales y estadísticas de rendimiento</li>
                <li>Contenido generado mediante inteligencia artificial</li>
                <li>Imágenes de galería, publicaciones y stories</li>
              </ul>

              <h3 className="text-lg font-medium mt-6 mb-2 text-foreground">2.5. Datos técnicos</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Tokens de notificaciones push y plataforma del dispositivo</li>
                <li>Registros de errores para mejorar la estabilidad</li>
                <li>Preferencias de notificación configuradas por el usuario</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">3. Permisos del Dispositivo</h2>
              <p>La aplicación puede solicitar los siguientes permisos en tu dispositivo. Todos son opcionales y puedes revocarlos en cualquier momento desde la configuración de tu dispositivo:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Cámara:</strong> para capturar y subir fotos de perfil, imágenes de galería, publicaciones y stories.</li>
                <li><strong>Geolocalización:</strong> para mostrar salones cercanos a tu ubicación y calcular distancias. Solo se utiliza cuando la app está en uso y con tu consentimiento explícito.</li>
                <li><strong>Notificaciones push:</strong> para enviarte recordatorios de citas, avisos de nuevos mensajes, actualizaciones de reservas y comunicaciones relevantes.</li>
                <li><strong>Vibración háptica (haptics):</strong> para proporcionar retroalimentación táctil en interacciones como «me gusta», confirmaciones de reserva y acciones dentro de la app.</li>
                <li><strong>Almacenamiento/galería:</strong> para acceder a imágenes de tu dispositivo al subir fotos.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">4. Finalidad del Tratamiento</h2>
              <p>Utilizamos tus datos personales para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Crear y gestionar tu cuenta de usuario</li>
                <li>Procesar y gestionar reservas de citas</li>
                <li>Facilitar la comunicación entre clientes y salones</li>
                <li>Enviar recordatorios, confirmaciones y notificaciones relevantes</li>
                <li>Mostrar salones cercanos basados en tu ubicación</li>
                <li>Permitir la publicación de reseñas, valoraciones y contenido social</li>
                <li>Gestionar suscripciones y procesar pagos para profesionales</li>
                <li>Generar contenido asistido por inteligencia artificial para salones</li>
                <li>Proporcionar estadísticas y análisis de rendimiento a profesionales</li>
                <li>Mejorar la experiencia de usuario y la estabilidad de la plataforma</li>
                <li>Cumplir con obligaciones legales aplicables</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">5. Base Legal del Tratamiento (RGPD)</h2>
              <p>El tratamiento de tus datos se fundamenta en las siguientes bases legales:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Consentimiento (Art. 6.1.a):</strong> para el envío de notificaciones push, el uso de la cámara y la geolocalización, y la publicación de contenido social.</li>
                <li><strong>Ejecución contractual (Art. 6.1.b):</strong> para la gestión de tu cuenta, el procesamiento de reservas y la prestación del servicio contratado.</li>
                <li><strong>Interés legítimo (Art. 6.1.f):</strong> para la mejora de nuestros servicios, la prevención del fraude y el análisis de uso de la plataforma.</li>
                <li><strong>Obligación legal (Art. 6.1.c):</strong> para el cumplimiento de obligaciones fiscales y legales aplicables.</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">6. Compartición de Datos con Terceros</h2>
              <p>Compartimos tus datos únicamente con los siguientes destinatarios y para las finalidades indicadas:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Salones de belleza:</strong> los datos necesarios para gestionar tu cita (nombre, teléfono, servicios solicitados).</li>
                <li><strong>Stripe:</strong> procesador de pagos para las suscripciones de cuentas profesionales. Stripe opera bajo sus propias políticas de privacidad y cumple con PCI-DSS.</li>
                <li><strong>Proveedores de inteligencia artificial:</strong> Google (Gemini) y OpenAI para la generación de contenido asistido. Los datos enviados se limitan a prompts de texto sin información personal identificable.</li>
                <li><strong>Proveedores de infraestructura cloud:</strong> para el almacenamiento de imágenes, archivos y datos de la plataforma.</li>
                <li><strong>Autoridades competentes:</strong> cuando sea requerido por ley o resolución judicial.</li>
              </ul>
              <p className="mt-4"><strong>Nunca vendemos tus datos personales a terceros.</strong></p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">7. Transferencias Internacionales de Datos</h2>
              <p>Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio Económico Europeo (EEE). En estos casos, nos aseguramos de que existan garantías adecuadas conforme al RGPD, como cláusulas contractuales tipo aprobadas por la Comisión Europea o decisiones de adecuación.</p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">8. Seguridad y Encriptación de Datos</h2>
              <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:</p>
              <ul className="list-disc pl-6 space-y-1 mt-4">
                <li>Los datos sensibles de reservas (nombre del cliente y teléfono) se almacenan <strong>encriptados</strong> en la base de datos.</li>
                <li>Los datos de la caja registradora se protegen mediante encriptación específica por cada negocio.</li>
                <li>Cada salón dispone de claves de encriptación propias e independientes.</li>
                <li>Todas las comunicaciones se realizan a través de conexiones seguras (HTTPS/TLS).</li>
                <li>El acceso a los datos está restringido mediante políticas de seguridad a nivel de fila (Row Level Security).</li>
                <li>Las contraseñas se almacenan con hashing seguro y nunca en texto plano.</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">9. Conservación de Datos</h2>
              <p>Conservamos tus datos personales durante el tiempo necesario para cumplir con las finalidades descritas en esta política:</p>
              <ul className="list-disc pl-6 space-y-1 mt-4">
                <li><strong>Datos de cuenta:</strong> mientras tu cuenta permanezca activa.</li>
                <li><strong>Datos de reservas:</strong> durante la vigencia de la relación con el salón y el período legalmente exigido.</li>
                <li><strong>Datos fiscales y de facturación:</strong> conforme a la legislación fiscal aplicable (mínimo 4 años).</li>
                <li><strong>Contenido social:</strong> mientras el usuario no solicite su eliminación.</li>
              </ul>
              <p className="mt-4">Tras la eliminación de tu cuenta, procederemos a eliminar o anonimizar tus datos personales en un plazo máximo de 30 días, salvo obligación legal de conservación.</p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">10. Tus Derechos (RGPD)</h2>
              <p>De acuerdo con el Reglamento General de Protección de Datos, tienes los siguientes derechos:</p>
              <ul className="list-disc pl-6 space-y-1 mt-4">
                <li><strong>Acceso:</strong> solicitar una copia de tus datos personales.</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de tus datos («derecho al olvido»).</li>
                <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y legible por máquina.</li>
                <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
                <li><strong>Limitación:</strong> solicitar la restricción del tratamiento de tus datos.</li>
                <li><strong>Retirada del consentimiento:</strong> retirar tu consentimiento en cualquier momento sin que afecte a la licitud del tratamiento previo.</li>
              </ul>
              <p className="mt-4">Para ejercer estos derechos, contacta con nosotros en <a href="mailto:contacto@glowapp.app" className="text-primary hover:underline">contacto@glowapp.app</a>. Responderemos en un plazo máximo de 30 días.</p>
              <p className="mt-2">También tienes derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> si consideras que tus derechos no han sido debidamente atendidos.</p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">11. Eliminación de Cuenta</h2>
              <p>Puedes eliminar tu cuenta en cualquier momento desde la sección de ajustes de tu perfil en la aplicación. Al eliminar tu cuenta:</p>
              <ul className="list-disc pl-6 space-y-1 mt-4">
                <li>Se eliminarán tus datos personales de perfil.</li>
                <li>Tus reseñas y contenido publicado serán anonimizados.</li>
                <li>Las reservas futuras serán canceladas.</li>
                <li>Los datos que debamos conservar por obligación legal se mantendrán durante el período legalmente establecido.</li>
              </ul>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">12. Cookies y Almacenamiento Local</h2>
              <p>GlowApp utiliza:</p>
              <ul className="list-disc pl-6 space-y-1 mt-4">
                <li><strong>Cookies esenciales:</strong> necesarias para el funcionamiento de la autenticación y la sesión del usuario.</li>
                <li><strong>Almacenamiento local del navegador:</strong> para guardar preferencias de usuario, tokens de sesión y datos de caché que mejoran el rendimiento.</li>
              </ul>
              <p className="mt-4">No utilizamos cookies de seguimiento publicitario ni de terceros con fines de marketing.</p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">13. Menores de Edad</h2>
              <p>GlowApp no está dirigida a menores de 16 años. No recopilamos conscientemente datos de menores de dicha edad. Si descubrimos que hemos recopilado datos de un menor sin el consentimiento parental adecuado, procederemos a eliminarlos de inmediato.</p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">14. Contacto y Modificaciones</h2>
              <p>Podemos actualizar esta política de privacidad periódicamente para reflejar cambios en nuestras prácticas o en la legislación aplicable. Te notificaremos sobre cambios significativos a través de la aplicación o por correo electrónico.</p>
              <p className="mt-4">Para cualquier consulta sobre esta política o sobre el tratamiento de tus datos, contacta con nosotros en: <a href="mailto:contacto@glowapp.app" className="text-primary hover:underline">contacto@glowapp.app</a></p>
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
