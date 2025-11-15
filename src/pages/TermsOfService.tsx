import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => {}} activeSection="" />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Términos de Uso</h1>
          
          <p className="text-muted-foreground mb-6">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground">
              Al acceder y utilizar el sitio web y los servicios de {import.meta.env.VITE_BUSINESS_FULL_NAME}, usted acepta estar sujeto 
              a estos Términos de Uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros 
              servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Descripción de los Servicios</h2>
            <p className="text-muted-foreground">
              {import.meta.env.VITE_BUSINESS_FULL_NAME} ofrece servicios profesionales de peluquería y estética capilar, que incluyen:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Corte de cabello</li>
              <li>Coloración y mechas</li>
              <li>Peinados y recogidos</li>
              <li>Tratamientos capilares</li>
              <li>Otros servicios de belleza capilar</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Nuestro sistema de reservas online permite a los clientes agendar citas de manera conveniente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Sistema de Reservas</h2>
            <h3 className="text-xl font-semibold text-foreground mb-2">3.1 Proceso de Reserva</h3>
            <p className="text-muted-foreground mb-4">
              Para realizar una reserva, debe:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Seleccionar el servicio deseado</li>
              <li>Elegir fecha y hora disponible</li>
              <li>Proporcionar información de contacto válida</li>
              <li>Confirmar la reserva</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-6">3.2 Confirmación</h3>
            <p className="text-muted-foreground">
              Recibirá una confirmación de su cita por correo electrónico o mensaje de texto. Es su responsabilidad 
              verificar la información de la reserva.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-2 mt-6">3.3 Modificación de Citas</h3>
            <p className="text-muted-foreground">
              Puede modificar su cita contactándonos directamente por teléfono (+34 938 321 054) o WhatsApp (+34 674 034 526) 
              con al menos 24 horas de antelación.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Política de Cancelación</h2>
            <p className="text-muted-foreground mb-4">
              <strong>Cancelaciones por parte del cliente:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Se pueden cancelar citas con al menos 24 horas de antelación sin cargo</li>
              <li>Cancelaciones con menos de 24 horas de antelación pueden estar sujetas a un cargo</li>
              <li>Las inasistencias sin aviso previo pueden resultar en restricciones para futuras reservas</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>Cancelaciones por parte del salón:</strong> Nos reservamos el derecho a cancelar o reprogramar citas 
              por causas de fuerza mayor o emergencias. En estos casos, le notificaremos lo antes posible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Precios y Pagos</h2>
            <p className="text-muted-foreground mb-4">
              Los precios de nuestros servicios están disponibles en el sitio web y pueden variar según:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Tipo de servicio solicitado</li>
              <li>Duración estimada del servicio</li>
              <li>Productos utilizados</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              El pago de los servicios se realiza en el salón después de completar el servicio. Aceptamos efectivo y tarjetas 
              de crédito/débito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Conducta del Cliente</h2>
            <p className="text-muted-foreground mb-4">
              Los clientes se comprometen a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Llegar puntualmente a las citas programadas</li>
              <li>Proporcionar información precisa sobre alergias o sensibilidades a productos</li>
              <li>Tratar al personal con respeto y cortesía</li>
              <li>Seguir las recomendaciones profesionales del estilista</li>
              <li>Informar sobre cualquier problema o preocupación de manera oportuna</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Nos reservamos el derecho a rechazar el servicio a clientes que muestren conducta inapropiada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Garantía de Satisfacción</h2>
            <p className="text-muted-foreground">
              Estamos comprometidos con su satisfacción. Si no está completamente satisfecho con el resultado de su servicio, 
              le rogamos que nos lo comunique en un plazo de 7 días. Evaluaremos cada caso individualmente y haremos todo lo 
              posible por resolver cualquier problema.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground mb-4">
              {import.meta.env.VITE_BUSINESS_FULL_NAME} no será responsable de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Reacciones alérgicas no comunicadas previamente por el cliente</li>
              <li>Resultados insatisfactorios debido a información inexacta proporcionada por el cliente</li>
              <li>Daños causados por no seguir las recomendaciones de cuidado post-tratamiento</li>
              <li>Problemas técnicos con el sistema de reservas que estén fuera de nuestro control</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Propiedad Intelectual</h2>
            <p className="text-muted-foreground">
              Todo el contenido del sitio web, incluyendo texto, gráficos, logotipos, imágenes y software, es propiedad de 
              {import.meta.env.VITE_BUSINESS_FULL_NAME} y está protegido por las leyes de propiedad intelectual españolas e internacionales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Fotografías y Publicidad</h2>
            <p className="text-muted-foreground">
              Ocasionalmente podemos solicitar permiso para tomar fotografías de los resultados de nuestros servicios con 
              fines de marketing y redes sociales. Siempre solicitaremos su consentimiento explícito antes de tomar o 
              publicar cualquier fotografía.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Modificaciones de los Términos</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho a modificar estos Términos de Uso en cualquier momento. Las modificaciones entrarán 
              en vigor una vez publicadas en el sitio web. Es responsabilidad del usuario revisar periódicamente estos términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Ley Aplicable y Jurisdicción</h2>
            <p className="text-muted-foreground">
              Estos Términos de Uso se rigen por la legislación española. Para cualquier controversia que pudiera derivarse, 
              las partes se someten a los juzgados y tribunales de Barcelona, renunciando expresamente a cualquier otro fuero 
              que pudiera corresponderles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contacto</h2>
            <p className="text-muted-foreground">
              Para cualquier pregunta sobre estos Términos de Uso, puede contactarnos en:
            </p>
            <p className="text-muted-foreground mt-2">
              {import.meta.env.VITE_BUSINESS_FULL_NAME}<br />
              {import.meta.env.VITE_LOCATION_ADDRESS}<br />
              {import.meta.env.VITE_LOCATION_POSTAL_CODE} {import.meta.env.VITE_LOCATION_CITY}, {import.meta.env.VITE_LOCATION_PROVINCE}<br />
              Teléfono: {import.meta.env.VITE_CONTACT_PHONE_DISPLAY}<br />
              WhatsApp: {import.meta.env.VITE_CONTACT_WHATSAPP_DISPLAY}
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
