import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

export default function TermsOfUse() {
  return (
    <>
      <SEO 
        title="Términos de Uso"
        description="Lee nuestros términos y condiciones de uso para la plataforma de reservas de belleza."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header 
          className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
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
          <h1 className="text-3xl font-bold mb-8">Términos de Uso</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-foreground/80 leading-relaxed">
                Al acceder y utilizar esta plataforma, aceptas estar sujeto a estos términos de uso. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">2. Descripción del Servicio</h2>
              <p className="text-foreground/80 leading-relaxed">
                Nuestra plataforma permite a los usuarios:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Buscar y descubrir salones de belleza</li>
                <li>Reservar citas en línea</li>
                <li>Comunicarse directamente con los salones</li>
                <li>Dejar valoraciones y reseñas</li>
                <li>Gestionar sus reservas y perfil</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">3. Registro de Cuenta</h2>
              <p className="text-foreground/80 leading-relaxed">
                Para utilizar ciertas funcionalidades debes crear una cuenta. Eres responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Proporcionar información veraz y actualizada</li>
                <li>Mantener la confidencialidad de tu contraseña</li>
                <li>Todas las actividades que ocurran bajo tu cuenta</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">4. Reservas y Cancelaciones</h2>
              <p className="text-foreground/80 leading-relaxed">
                Al realizar una reserva:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Te comprometes a asistir a la cita en el horario acordado</li>
                <li>Debes cancelar con al menos 24 horas de antelación cuando sea posible</li>
                <li>Las cancelaciones repetidas sin previo aviso pueden resultar en restricciones de cuenta</li>
                <li>Los salones se reservan el derecho de aplicar políticas de cancelación propias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">5. Conducta del Usuario</h2>
              <p className="text-foreground/80 leading-relaxed">
                Te comprometes a no:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Publicar contenido falso, difamatorio o inapropiado</li>
                <li>Acosar o amenazar a otros usuarios o salones</li>
                <li>Usar la plataforma para fines ilegales</li>
                <li>Intentar acceder a cuentas o datos de otros usuarios</li>
                <li>Interferir con el funcionamiento normal de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">6. Contenido del Usuario</h2>
              <p className="text-foreground/80 leading-relaxed">
                Al publicar reseñas, valoraciones o cualquier otro contenido:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Garantizas que tienes derecho a publicar dicho contenido</li>
                <li>Nos otorgas licencia para usar, mostrar y distribuir ese contenido</li>
                <li>Aceptas que podemos moderar o eliminar contenido que viole estos términos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">7. Limitación de Responsabilidad</h2>
              <p className="text-foreground/80 leading-relaxed">
                Actuamos como intermediarios entre usuarios y salones. No somos responsables de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>La calidad de los servicios prestados por los salones</li>
                <li>Disputas entre usuarios y salones</li>
                <li>Daños derivados del uso de los servicios de los salones</li>
                <li>Interrupciones temporales del servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">8. Propiedad Intelectual</h2>
              <p className="text-foreground/80 leading-relaxed">
                Todo el contenido de la plataforma (diseño, logos, textos, código) es propiedad nuestra o de nuestros licenciantes y está protegido por las leyes de propiedad intelectual. No está permitida su reproducción sin autorización expresa.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">9. Modificaciones</h2>
              <p className="text-foreground/80 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente tras su publicación. El uso continuado de la plataforma constituye la aceptación de los términos modificados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">10. Terminación</h2>
              <p className="text-foreground/80 leading-relaxed">
                Podemos suspender o cancelar tu cuenta si:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>Violas estos términos de uso</li>
                <li>Realizas actividades fraudulentas</li>
                <li>Tu conducta perjudica a otros usuarios o salones</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">11. Ley Aplicable</h2>
              <p className="text-foreground/80 leading-relaxed">
                Estos términos se rigen por las leyes de España. Cualquier disputa será sometida a los tribunales competentes de España.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">12. Contacto</h2>
              <p className="text-foreground/80 leading-relaxed">
                Para cualquier consulta sobre estos términos, puedes contactarnos en: <a href="mailto:contacto@glowapp.app" className="text-primary hover:underline">contacto@glowapp.app</a>
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
