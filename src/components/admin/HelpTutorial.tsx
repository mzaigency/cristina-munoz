import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
  ChevronRight,
  Search,
  UserCircle,
  Gift,
  Target,
  Percent,
  UserPlus,
  BellRing,
  LayoutDashboard,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  content: string[];
  shortcuts?: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "dashboard",
    title: "Panel de Inicio",
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: "Tu centro de control principal",
    content: [
      "📊 Vista rápida de métricas del día: citas, ingresos, clientes",
      "⚡ Acciones rápidas: crear cita, registrar cobro, bloquear hueco",
      "📅 Resumen de las próximas citas programadas",
      "💰 Estadísticas de facturación reciente",
      "🔔 Notificaciones importantes y alertas pendientes",
    ],
    shortcuts: ["Ctrl+N: Nueva cita", "Ctrl+P: Nuevo cobro"],
  },
  {
    id: "calendar",
    title: "Agenda",
    icon: <Calendar className="h-5 w-5" />,
    description: "Gestión de citas y reservas",
    content: [
      "📅 Vista por día, semana o mes completo",
      "👆 Haz clic en un hueco vacío para crear una nueva cita",
      "✏️ Arrastra las citas para cambiar la hora o día",
      "🎨 Cada estilista tiene un color asignado para identificar sus citas",
      "🔄 Las citas se actualizan en tiempo real",
      "🔍 Filtra por estilista para ver solo sus citas",
      "⏰ Indicador de hora actual en la vista diaria",
    ],
    shortcuts: ["Doble clic: Nueva cita", "Arrastrar: Mover cita"],
  },
  {
    id: "clients",
    title: "CRM de Clientes",
    icon: <UserCircle className="h-5 w-5" />,
    description: "Base de datos completa de clientes",
    content: [
      "👥 Lista completa de todos tus clientes",
      "🔍 Búsqueda rápida por nombre, teléfono o email",
      "📝 Notas privadas y preferencias por cliente",
      "🏷️ Etiquetas: VIP, Frecuente, Nuevo, etc.",
      "📊 Historial completo de visitas y servicios",
      "💰 Total gastado y número de visitas",
      "❤️ Estilista y servicios favoritos",
    ],
  },
  {
    id: "cash",
    title: "Caja Registradora",
    icon: <Wallet className="h-5 w-5" />,
    description: "Cobros y gestión financiera",
    content: [
      "💰 Registra cobros de servicios y productos",
      "📊 Consulta el historial de transacciones del día",
      "💳 Acepta pagos en efectivo, tarjeta o mixto",
      "📧 Exporta datos a Excel para contabilidad",
      "🎁 Aplica descuentos, propinas y promociones",
      "📈 Gráficos de ventas y comparativas",
      "📄 Genera tickets e informes PDF",
    ],
  },
  {
    id: "promotions",
    title: "Promociones",
    icon: <Gift className="h-5 w-5" />,
    description: "Cupones y programas de fidelidad",
    content: [
      "🎫 Crea cupones de descuento (% o cantidad fija)",
      "📅 Promociones por fecha (Black Friday, etc.)",
      "⭐ Sistema de puntos de fidelidad",
      "📤 Códigos promocionales compartibles",
      "📊 Estadísticas de uso de promociones",
      "⏰ Validez temporal configurable",
    ],
  },
  {
    id: "waitlist",
    title: "Lista de Espera",
    icon: <UserPlus className="h-5 w-5" />,
    description: "Gestión de clientes en espera",
    content: [
      "📋 Añade clientes cuando no hay disponibilidad",
      "🔔 Notificación automática si se cancela una cita",
      "⬆️ Gestión de prioridades",
      "📅 Preferencias de fecha y hora",
      "👤 Estilista preferido",
      "📱 Contacto rápido vía WhatsApp",
    ],
  },
  {
    id: "messages",
    title: "Mensajes",
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Comunicación con clientes",
    content: [
      "💬 Chatea directamente con tus clientes",
      "🔔 Recibe notificaciones de mensajes nuevos",
      "📱 Responde consultas y confirma citas",
      "📷 Envía y recibe imágenes",
      "✅ Indicador de mensajes leídos/no leídos",
    ],
  },
  {
    id: "stories",
    title: "Stories",
    icon: <ImageIcon className="h-5 w-5" />,
    description: "Contenido visual temporal",
    content: [
      "📸 Publica fotos de tus trabajos",
      "⏰ Los stories duran 24 horas",
      "👁️ Consulta estadísticas de visualizaciones",
      "🎨 Añade stickers, texto y efectos",
      "📊 Encuestas y preguntas interactivas",
      "❤️ Ver quién ha visto tus stories",
    ],
  },
  {
    id: "goals",
    title: "Objetivos",
    icon: <Target className="h-5 w-5" />,
    description: "Metas mensuales de negocio",
    content: [
      "🎯 Define objetivos de facturación mensual",
      "📊 Metas de número de citas",
      "👥 Objetivos de nuevos clientes",
      "📈 Barra de progreso visual",
      "🔮 Predicción basada en ritmo actual",
      "⚠️ Alertas si vas por debajo del objetivo",
    ],
  },
  {
    id: "stats",
    title: "Estadísticas",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Análisis de rendimiento",
    content: [
      "📊 Analiza el rendimiento de tu negocio",
      "💵 Consulta ingresos por periodo",
      "📈 Compara datos entre meses",
      "👥 Identifica tus mejores clientes",
      "✂️ Top servicios más vendidos",
      "📅 Días y horas más ocupados",
    ],
  },
  {
    id: "services",
    title: "Servicios",
    icon: <Scissors className="h-5 w-5" />,
    description: "Catálogo de servicios",
    content: [
      "✂️ Configura los servicios que ofreces",
      "⏱️ Establece duración de cada servicio",
      "💲 Define precios",
      "📂 Organiza por categorías",
      "🔄 Servicios compuestos (parte 1 + exposición + parte 2)",
      "📊 Ordena servicios por preferencia",
    ],
  },
  {
    id: "packages",
    title: "Paquetes",
    icon: <Package className="h-5 w-5" />,
    description: "Combos de servicios",
    content: [
      "📦 Crea paquetes de servicios con descuento",
      "👰 Pack novia, familiar, etc.",
      "💰 Descuento automático al reservar combo",
      "📝 Descripción personalizada",
      "📅 Validez temporal opcional",
    ],
  },
  {
    id: "products",
    title: "Productos",
    icon: <Package className="h-5 w-5" />,
    description: "Inventario y ventas",
    content: [
      "📦 Gestiona tu inventario de productos",
      "⚠️ Recibe alertas cuando el stock sea bajo",
      "💰 Establece precios de venta y coste",
      "📊 Controla márgenes de beneficio",
      "📷 Código de barras para búsqueda rápida",
    ],
  },
  {
    id: "team",
    title: "Equipo",
    icon: <Users className="h-5 w-5" />,
    description: "Gestión de estilistas",
    content: [
      "👥 Añade estilistas a tu equipo",
      "🎨 Asigna colores para la agenda",
      "📷 Foto de perfil de cada miembro",
      "📅 Gestiona calendarios individuales",
      "✅ Activa/desactiva miembros del equipo",
    ],
  },
  {
    id: "commissions",
    title: "Comisiones",
    icon: <Percent className="h-5 w-5" />,
    description: "Gestión de comisiones",
    content: [
      "💰 Define % de comisión por estilista",
      "📊 Cálculo automático basado en servicios",
      "📄 Informe de comisiones por período",
      "🔀 Tipos: fijo, porcentaje o mixto",
      "📈 Historial de ganancias",
    ],
  },
  {
    id: "hours",
    title: "Horarios",
    icon: <Clock className="h-5 w-5" />,
    description: "Horarios de apertura",
    content: [
      "🕐 Configura los horarios de apertura",
      "📅 Establece horarios por día de la semana",
      "☕ Define pausas (hora de comida)",
      "🚫 Marca días de cierre",
      "👤 Horarios individuales por estilista",
    ],
  },
  {
    id: "notifications",
    title: "Alertas",
    icon: <BellRing className="h-5 w-5" />,
    description: "Configuración de notificaciones",
    content: [
      "🔔 Configura qué notificaciones recibir",
      "📅 Recordatorios de citas (1h, 24h antes)",
      "📩 Alertas de nuevas reservas",
      "❌ Avisos de cancelaciones",
      "💬 Notificaciones de mensajes",
      "📊 Resumen diario matutino",
    ],
  },
  {
    id: "settings",
    title: "Ajustes",
    icon: <Settings className="h-5 w-5" />,
    description: "Personalización del salón",
    content: [
      "🎨 Personaliza colores y tema",
      "📷 Sube tu logo",
      "📝 Edita información del negocio",
      "📍 Configura dirección y contacto",
      "🌐 Gestiona tu landing page",
      "📱 Redes sociales",
    ],
  },
];

export const HelpTutorial = () => {
  const [open, setOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = helpSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedSectionData = helpSections.find(s => s.id === selectedSection);

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
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            Centro de Ayuda
          </DialogTitle>
          
          {/* Search */}
          {!selectedSection && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en la ayuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
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
              
              <ul className="space-y-2.5">
                {selectedSectionData.content.map((item, i) => (
                  <li 
                    key={i} 
                    className="flex items-start gap-2 text-sm text-foreground bg-muted/30 rounded-lg p-2.5"
                  >
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {selectedSectionData.shortcuts && selectedSectionData.shortcuts.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                    <Lightbulb className="h-4 w-4" />
                    Atajos de teclado
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSectionData.shortcuts.map((shortcut, i) => (
                      <span 
                        key={i} 
                        className="text-xs bg-muted px-2 py-1 rounded-md font-mono"
                      >
                        {shortcut}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-1">
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
        </ScrollArea>

        {/* Quick tip footer */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            <span>Pulsa el icono ✨ para hacer el tour guiado interactivo</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
