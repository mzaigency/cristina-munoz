import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  HelpCircle, 
  Calendar, 
  Wallet, 
  Star, 
  MessageCircle, 
  ImageIcon, 
  BarChart3, 
  Package, 
  Scissors, 
  Users, 
  Clock, 
  Settings,
  ChevronRight
} from "lucide-react";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "calendar",
    title: "Agenda",
    icon: <Calendar className="h-5 w-5" />,
    content: [
      "📅 Visualiza todas las citas del día, semana o mes",
      "👆 Haz clic en un hueco vacío para crear una nueva cita",
      "✏️ Arrastra las citas para cambiar la hora",
      "🎨 Cada estilista tiene un color asignado para identificar sus citas",
      "🔄 Las citas se actualizan en tiempo real"
    ]
  },
  {
    id: "cash",
    title: "Caja",
    icon: <Wallet className="h-5 w-5" />,
    content: [
      "💰 Registra cobros de servicios y productos",
      "🧾 Genera facturas con datos fiscales del cliente",
      "📊 Consulta el historial de transacciones del día",
      "💳 Acepta pagos en efectivo, tarjeta o mixto",
      "📧 Envía tickets por email a los clientes",
      "🎁 Aplica descuentos y propinas"
    ]
  },
  {
    id: "reviews",
    title: "Reseñas",
    icon: <Star className="h-5 w-5" />,
    content: [
      "⭐ Visualiza todas las reseñas de tus clientes",
      "🗑️ Elimina reseñas inapropiadas",
      "📅 Filtra por mes o por número de estrellas",
      "📈 Monitoriza la satisfacción de tus clientes"
    ]
  },
  {
    id: "messages",
    title: "Mensajes",
    icon: <MessageCircle className="h-5 w-5" />,
    content: [
      "💬 Chatea directamente con tus clientes",
      "🔔 Recibe notificaciones de mensajes nuevos",
      "📱 Responde consultas y confirma citas"
    ]
  },
  {
    id: "stories",
    title: "Stories",
    icon: <ImageIcon className="h-5 w-5" />,
    content: [
      "📸 Publica fotos de tus trabajos",
      "⏰ Los stories duran 24 horas",
      "👁️ Consulta las estadísticas de visualizaciones",
      "🎨 Muestra tu portfolio a potenciales clientes"
    ]
  },
  {
    id: "stats",
    title: "Estadísticas",
    icon: <BarChart3 className="h-5 w-5" />,
    content: [
      "📊 Analiza el rendimiento de tu negocio",
      "💵 Consulta ingresos por periodo",
      "📈 Compara datos entre meses",
      "👥 Identifica tus mejores clientes"
    ]
  },
  {
    id: "products",
    title: "Productos",
    icon: <Package className="h-5 w-5" />,
    content: [
      "📦 Gestiona tu inventario de productos",
      "⚠️ Recibe alertas cuando el stock sea bajo",
      "💰 Establece precios de venta y coste",
      "📊 Controla márgenes de beneficio"
    ]
  },
  {
    id: "services",
    title: "Servicios",
    icon: <Scissors className="h-5 w-5" />,
    content: [
      "✂️ Configura los servicios que ofreces",
      "⏱️ Establece duración de cada servicio",
      "💲 Define precios",
      "📂 Organiza por categorías"
    ]
  },
  {
    id: "team",
    title: "Equipo",
    icon: <Users className="h-5 w-5" />,
    content: [
      "👥 Añade estilistas a tu equipo",
      "🎨 Asigna colores para la agenda",
      "📅 Gestiona calendarios individuales",
      "✅ Activa/desactiva miembros del equipo"
    ]
  },
  {
    id: "hours",
    title: "Horarios",
    icon: <Clock className="h-5 w-5" />,
    content: [
      "🕐 Configura los horarios de apertura",
      "📅 Establece horarios por día de la semana",
      "☕ Define pausas (hora de comida)",
      "🚫 Marca días de cierre"
    ]
  },
  {
    id: "settings",
    title: "Ajustes",
    icon: <Settings className="h-5 w-5" />,
    content: [
      "🎨 Personaliza colores y logo",
      "📝 Edita información del negocio",
      "📍 Configura dirección y contacto",
      "🌐 Gestiona tu landing page"
    ]
  }
];

export const HelpTutorial = () => {
  const [open, setOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Ayuda">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Centro de ayuda
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {selectedSection ? (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedSection(null)}
                className="mb-2"
              >
                ← Volver
              </Button>
              {helpSections.filter(s => s.id === selectedSection).map(section => (
                <div key={section.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona una sección para ver la ayuda detallada:
              </p>
              {helpSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {section.icon}
                  </div>
                  <span className="flex-1 font-medium">{section.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
