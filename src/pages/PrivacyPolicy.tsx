import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => {}} activeSection="" />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Política de Privacidad</h1>
          
          <p className="text-muted-foreground mb-6">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Responsable del Tratamiento</h2>
            <p className="text-muted-foreground">
              <strong>Cristina Muñoz Peluquería</strong><br />
              Carrer Pompeu Fabra, 20, Bajos<br />
              08251 Santpedor, Barcelona<br />
              Teléfono: +34 938 321 054<br />
              WhatsApp: +34 674 034 526
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Datos que Recopilamos</h2>
            <p className="text-muted-foreground mb-4">
              En Cristina Muñoz Peluquería recopilamos los siguientes datos personales cuando utiliza nuestros servicios:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Nombre completo</li>
              <li>Número de teléfono</li>
              <li>Dirección de correo electrónico</li>
              <li>Información sobre las citas reservadas (fecha, hora, servicio)</li>
              <li>Historial de servicios solicitados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Finalidad del Tratamiento</h2>
            <p className="text-muted-foreground mb-4">
              Utilizamos sus datos personales para las siguientes finalidades:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Gestionar y confirmar sus reservas de citas</li>
              <li>Comunicarnos con usted sobre sus citas</li>
              <li>Enviar recordatorios de citas próximas</li>
              <li>Mejorar nuestros servicios y la experiencia del cliente</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Base Legal del Tratamiento</h2>
            <p className="text-muted-foreground">
              El tratamiento de sus datos personales se basa en:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Ejecución de un contrato:</strong> Para gestionar las citas y prestar los servicios solicitados</li>
              <li><strong>Consentimiento:</strong> Para enviar comunicaciones comerciales (si ha dado su consentimiento)</li>
              <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Conservación de los Datos</h2>
            <p className="text-muted-foreground">
              Conservaremos sus datos personales mientras mantenga su relación con nosotros y durante el tiempo necesario 
              para cumplir con las obligaciones legales. Una vez finalizada la relación, conservaremos sus datos bloqueados 
              durante los plazos legalmente establecidos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Destinatarios de los Datos</h2>
            <p className="text-muted-foreground">
              No compartimos sus datos personales con terceros, excepto cuando sea necesario para la prestación de nuestros 
              servicios o cuando estemos obligados por ley. En caso de utilizar proveedores de servicios, estos actuarán como 
              encargados de tratamiento bajo nuestras instrucciones.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Sus Derechos</h2>
            <p className="text-muted-foreground mb-4">
              De acuerdo con el RGPD, usted tiene derecho a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Acceso:</strong> Conocer qué datos personales tratamos sobre usted</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
              <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
              <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Para ejercer estos derechos, puede contactarnos en el teléfono +34 938 321 054 o por WhatsApp al +34 674 034 526.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Medidas de Seguridad</h2>
            <p className="text-muted-foreground">
              Hemos implementado medidas técnicas y organizativas apropiadas para proteger sus datos personales contra el 
              acceso no autorizado, la pérdida, destrucción o alteración. Utilizamos conexiones seguras y sistemas de 
              encriptación para proteger la información.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Cookies</h2>
            <p className="text-muted-foreground">
              Nuestro sitio web utiliza cookies técnicas necesarias para el funcionamiento de la plataforma de reservas. 
              No utilizamos cookies de seguimiento o publicidad sin su consentimiento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Modificaciones</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho a modificar esta Política de Privacidad en cualquier momento. Cualquier cambio 
              será publicado en esta página con la fecha de actualización correspondiente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contacto</h2>
            <p className="text-muted-foreground">
              Si tiene alguna pregunta sobre esta Política de Privacidad o sobre el tratamiento de sus datos personales, 
              puede contactarnos en:
            </p>
            <p className="text-muted-foreground mt-2">
              Teléfono: +34 938 321 054<br />
              WhatsApp: +34 674 034 526<br />
              Dirección: Carrer Pompeu Fabra, 20, Bajos, 08251 Santpedor, Barcelona
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
