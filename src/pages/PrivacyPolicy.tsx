import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO 
        title="Política de Privacidad"
        description="Conoce cómo recopilamos, usamos y protegemos tu información personal en nuestra plataforma de reservas de belleza."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto flex items-center h-16 px-4">
            <Button 
              variant="ghost" 
              asChild
              className="text-primary font-medium gap-0.5 -ml-2 hover:bg-transparent"
            >
              <Link to="/">
                <ChevronLeft className="h-6 w-6" />
                <span>Inicio</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">1. Información que Recopilamos</h2>
              <p className="text-foreground/80 leading-relaxed">
                Recopilamos información que nos proporcionas directamente cuando:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Te registras para crear una cuenta</li>
                <li>Realizas una reserva en un salón</li>
                <li>Te comunicas con nosotros o con los salones a través de la plataforma</li>
                <li>Publicas reseñas o valoraciones</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                Esta información puede incluir: nombre, dirección de correo electrónico, número de teléfono, y datos de pago.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">2. Cómo Usamos tu Información</h2>
              <p className="text-foreground/80 leading-relaxed">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Gestionar tu cuenta y procesar reservas</li>
                <li>Enviarte confirmaciones, recordatorios y actualizaciones de citas</li>
                <li>Permitir la comunicación entre usuarios y salones</li>
                <li>Mejorar nuestros servicios y experiencia de usuario</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">3. Compartición de Datos</h2>
              <p className="text-foreground/80 leading-relaxed">
                Compartimos tu información personal únicamente con:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Los salones donde realizas reservas (información necesaria para la cita)</li>
                <li>Proveedores de servicios que nos ayudan a operar la plataforma</li>
                <li>Autoridades cuando sea requerido por ley</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                Nunca vendemos tu información personal a terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">4. Seguridad de los Datos</h2>
              <p className="text-foreground/80 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye encriptación de datos sensibles y acceso restringido a la información personal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">5. Tus Derechos</h2>
              <p className="text-foreground/80 leading-relaxed">
                De acuerdo con el RGPD, tienes derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Acceder a tus datos personales</li>
                <li>Rectificar datos inexactos</li>
                <li>Solicitar la eliminación de tus datos</li>
                <li>Oponerte al tratamiento de tus datos</li>
                <li>Solicitar la portabilidad de tus datos</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-4">
                Para ejercer estos derechos, contacta con nosotros a través del correo electrónico proporcionado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">6. Cookies</h2>
              <p className="text-foreground/80 leading-relaxed">
                Utilizamos cookies esenciales para el funcionamiento de la plataforma y cookies analíticas para mejorar nuestros servicios. Puedes gestionar tus preferencias de cookies desde la configuración de tu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">7. Cambios en esta Política</h2>
              <p className="text-foreground/80 leading-relaxed">
                Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos a través de la plataforma o por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">8. Contacto</h2>
              <p className="text-foreground/80 leading-relaxed">
                Si tienes preguntas sobre esta política de privacidad o sobre cómo tratamos tus datos, puedes contactarnos en: <a href="mailto:mzaigency@gmail.com" className="text-primary hover:underline">mzaigency@gmail.com</a>
              </p>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
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
