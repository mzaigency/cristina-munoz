import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  HelpCircle,
  Calendar,
  Wallet,
  MessageCircle,
  Settings,
  ChevronRight,
  Search,
  UserCircle,
  Users,
  LayoutDashboard,
  Lightbulb,
  ArrowLeft,
  Clock,
  Scissors,
  Gift,
  Package,
  Target,
  Percent,
  Camera,
  Star,
  Bell,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  subsections: {
    name: string;
    items: string[];
  }[];
}

// Simplified help matching the new 7-tab structure
const helpSections: HelpSection[] = [
  {
    id: "dashboard",
    title: "Inicio",
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: "Centro de control principal",
    subsections: [
      {
        name: "Vista general",
        items: [
          "📊 Métricas del día: citas, ingresos",
          "⚡ Acciones rápidas: crear cita, cobrar",
          "📅 Próximas citas programadas",
          "🔔 Alertas y notificaciones",
        ],
      },
    ],
  },
  {
    id: "agenda",
    title: "Agenda",
    icon: <Calendar className="h-5 w-5" />,
    description: "Calendario + Lista de espera",
    subsections: [
      {
        name: "Calendario",
        items: [
          "📅 Vista por día o semana",
          "🎨 Citas por color de estilista",
          "✋ Arrastra para mover citas",
          "⏰ Indicador de hora actual",
        ],
      },
      {
        name: "Lista de espera",
        items: [
          "📋 Clientes sin hueco disponible",
          "🔔 Notificación si se cancela cita",
          "⬆️ Gestión de prioridades",
        ],
      },
    ],
  },
  {
    id: "clients",
    title: "Clientes",
    icon: <UserCircle className="h-5 w-5" />,
    description: "CRM completo",
    subsections: [
      {
        name: "Base de datos",
        items: [
          "👥 Lista de todos los clientes",
          "🔍 Búsqueda por nombre/teléfono",
          "📝 Notas y preferencias",
          "🏷️ Etiquetas: VIP, Frecuente",
          "📊 Historial de visitas",
          "❤️ Estilista favorito",
        ],
      },
    ],
  },
  {
    id: "content",
    title: "Contenido",
    icon: <Camera className="h-5 w-5" />,
    description: "Marketing, formación y ROI",
    subsections: [
      {
        name: "Marketing",
        items: [
          "📱 Genera tarjetas con QR",
          "🖨️ Descarga en PNG para imprimir",
          "🎨 Varias plantillas de diseño",
          "🔗 Link de reserva compartible",
        ],
      },
      {
        name: "Formación",
        items: [
          "✅ Checklist de primeros pasos",
          "📚 Guía para cada herramienta",
          "📊 Progreso guardado",
        ],
      },
      {
        name: "ROI",
        items: [
          "💰 Ingresos gestionados",
          "🛡️ No-shows evitados",
          "⏱️ Tiempo ahorrado",
        ],
      },
    ],
  },
  {
    id: "business",
    title: "Negocio",
    icon: <Wallet className="h-5 w-5" />,
    description: "Finanzas y promociones",
    subsections: [
      {
        name: "Caja",
        items: [
          "💰 Registrar cobros",
          "💳 Efectivo, tarjeta o mixto",
          "📧 Exportar a Excel",
        ],
      },
      {
        name: "Promos",
        items: [
          "🎫 Cupones de descuento",
          "⭐ Puntos de fidelidad",
          "📤 Códigos compartibles",
        ],
      },
      {
        name: "Paquetes",
        items: [
          "📦 Combos de servicios",
          "💰 Descuento automático",
        ],
      },
      {
        name: "Productos",
        items: [
          "📦 Inventario",
          "⚠️ Alertas de stock bajo",
        ],
      },
      {
        name: "Objetivos",
        items: [
          "🎯 Metas mensuales",
          "📈 Progreso y predicción",
        ],
      },
      {
        name: "Stats",
        items: [
          "📊 Análisis de ventas",
          "📈 Comparativas",
        ],
      },
    ],
  },
  {
    id: "team",
    title: "Equipo",
    icon: <Users className="h-5 w-5" />,
    description: "Estilistas y servicios",
    subsections: [
      {
        name: "Estilistas",
        items: [
          "👥 Gestión de equipo",
          "🎨 Color por estilista",
          "📷 Foto de perfil",
        ],
      },
      {
        name: "Servicios",
        items: [
          "✂️ Catálogo de servicios",
          "⏱️ Duraciones y precios",
          "📂 Categorías",
        ],
      },
      {
        name: "Comisiones",
        items: [
          "💰 % por estilista",
          "📊 Cálculo automático",
        ],
      },
      {
        name: "Horarios",
        items: [
          "🕐 Horarios de apertura",
          "☕ Pausas de comida",
        ],
      },
    ],
  },
  {
    id: "communication",
    title: "Comunicación",
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Mensajes, Stories y Reseñas",
    subsections: [
      {
        name: "Mensajes",
        items: [
          "💬 Chat con clientes",
          "🔔 Notificaciones en tiempo real",
        ],
      },
      {
        name: "Stories",
        items: [
          "📸 Publica tus trabajos",
          "⏰ Duran 24 horas",
          "📊 Estadísticas de vistas",
        ],
      },
      {
        name: "Reseñas",
        items: [
          "⭐ Moderar opiniones",
          "✅ Aprobar/rechazar",
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Ajustes",
    icon: <Settings className="h-5 w-5" />,
    description: "Configuración del salón",
    subsections: [
      {
        name: "General",
        items: [
          "🎨 Colores y tema",
          "📷 Logo del salón",
          "📍 Dirección y contacto",
        ],
      },
      {
        name: "Alertas",
        items: [
          "🔔 Notificaciones push",
          "📧 Avisos por email",
          "📊 Resumen diario",
        ],
      },
      {
        name: "Seguridad",
        items: [
          "🔒 Accesos y permisos",
          "📊 Monitor de actividad",
        ],
      },
    ],
  },
];

export const HelpTutorial = () => {
  const [open, setOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const filteredSections = helpSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.subsections.some(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const selectedSectionData = helpSections.find(s => s.id === selectedSection);

  const HelpContent = () => (
    <>
      {selectedSection && selectedSectionData ? (
        <div className="p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedSection(null)} 
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary">
              {selectedSectionData.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{selectedSectionData.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedSectionData.description}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {selectedSectionData.subsections.map((sub, idx) => (
              <div key={idx} className="bg-muted/30 rounded-xl p-3">
                <h4 className="font-medium text-sm text-primary mb-2">{sub.name}</h4>
                <ul className="space-y-1.5">
                  {sub.items.map((item, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-1">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {filteredSections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron resultados</p>
            </div>
          ) : (
            filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                  "hover:bg-muted/80 active:scale-[0.99]"
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary shrink-0">
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{section.title}</span>
                  <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Quick tip footer */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          <span>Pulsa ✨ para el tour guiado interactivo</span>
        </div>
      </div>
    </>
  );

  // Use Drawer on mobile for better UX
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            title="Centro de ayuda"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              Centro de Ayuda
            </DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="h-[60vh]">
            <HelpContent />
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 sm:h-9 sm:w-9"
          title="Centro de ayuda"
        >
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            Centro de Ayuda
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <HelpContent />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
