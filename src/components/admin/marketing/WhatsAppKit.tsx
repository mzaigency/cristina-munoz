import { useMemo, useState } from "react";
import {
  MessageCircle,
  Copy,
  Share2,
  Sparkles,
  AtSign,
  Megaphone,
  MessagesSquare,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface WhatsAppKitProps {
  tenantSlug: string;
  tenantName?: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  text: string;
  /** Si la plantilla espera el placeholder {nombre}. */
  perClient?: boolean;
}

type Category = {
  id: string;
  label: string;
  icon: typeof MessageCircle;
  description: string;
  templates: Template[];
};

function buildLink(slug: string): string {
  return `https://glowapp.app/${slug || "tu-salon"}`;
}

function fillTemplate(
  text: string,
  vars: { salon: string; link: string; nombre?: string }
): string {
  return text
    .split("{salon}").join(vars.salon)
    .split("{enlace}").join(vars.link)
    .split("{nombre}").join(vars.nombre ?? "{nombre}");
}

const buildCategories = (): Category[] => [
  {
    id: "estado",
    label: "Estado WhatsApp",
    icon: MessageCircle,
    description: "Textos cortos para tu estado (máx. 139 caracteres).",
    templates: [
      {
        id: "estado-1",
        title: "Reserva 24/7",
        description: "Directo y claro.",
        text: "Reserva tu cita 24/7 en mi nueva app 💇‍♀️ {enlace}",
      },
      {
        id: "estado-2",
        title: "Sin llamadas",
        description: "Resalta la comodidad.",
        text: "Ya no hace falta llamar — reserva online en segundos: {enlace}",
      },
      {
        id: "estado-3",
        title: "Modo pro",
        description: "Tono profesional.",
        text: "Ahora puedes reservar conmigo desde el móvil 📲 {enlace}",
      },
      {
        id: "estado-4",
        title: "Con urgencia suave",
        description: "Para empujar pruebas iniciales.",
        text: "Pruébalo esta semana: reserva online sin esperas → {enlace}",
      },
    ],
  },
  {
    id: "masivo",
    label: "Mensaje a clientas",
    icon: MessagesSquare,
    description:
      "Plantillas largas para enviar por WhatsApp. Usa {nombre} y se sustituye al copiar individualmente.",
    templates: [
      {
        id: "masivo-1",
        title: "Anuncio cercano",
        description: "Tono amigable, ideal para clientas habituales.",
        perClient: true,
        text:
          "Hola {nombre}! 💕 Te escribo desde {salon}. A partir de ahora puedes reservar tu cita directamente desde el móvil, sin llamadas ni esperas: {enlace}\n\nPruébalo y dime qué te parece 🙌",
      },
      {
        id: "masivo-2",
        title: "Anuncio breve",
        description: "Si quieres ir directa al grano.",
        perClient: true,
        text:
          "Hola {nombre}, soy {salon}. Ya tenemos reservas online aquí 👉 {enlace}. ¡Reserva la próxima sin llamar!",
      },
      {
        id: "masivo-3",
        title: "Reactivación",
        description: "Para clientas que llevan tiempo sin venir.",
        perClient: true,
        text:
          "Hola {nombre}! Hace tiempo que no te veo por {salon} 💛 Te dejo enlace para que reserves cuando te vaya bien: {enlace}. ¡Te esperamos!",
      },
    ],
  },
  {
    id: "bio",
    label: "Bio Instagram / TikTok",
    icon: AtSign,
    description: "Pega esto en la bio para que tus seguidores reserven al toque.",
    templates: [
      {
        id: "bio-1",
        title: "Bio compacta",
        description: "Una línea, directa al enlace.",
        text: "📅 Reserva online 24/7 → {enlace}",
      },
      {
        id: "bio-2",
        title: "Bio con beneficios",
        description: "Resalta dos ventajas.",
        text: "✂️ Reserva online · Sin llamadas · 24h\n👉 {enlace}",
      },
    ],
  },
  {
    id: "anuncio",
    label: "Story / Post",
    icon: Megaphone,
    description: "Texto para acompañar una imagen anunciando el cambio.",
    templates: [
      {
        id: "anuncio-1",
        title: "Story de lanzamiento",
        description: "Anuncio del nuevo sistema.",
        text:
          "¡Novedad en {salon}! 🎉\nAhora puedes reservar tu cita online en segundos, sin llamadas. Mira la disponibilidad y elige tu hora favorita 💁‍♀️\n👉 {enlace}",
      },
      {
        id: "anuncio-2",
        title: "Post Instagram",
        description: "Pie de foto con CTA.",
        text:
          "📲 RESERVA ONLINE EN {salon}\n\nElige servicio, profesional y hora desde tu móvil. Reservas confirmadas al instante. Sin llamadas, sin esperas.\n\nReserva aquí 👉 {enlace}\n\n#reservaonline #salon #belleza",
      },
    ],
  },
  {
    id: "auto",
    label: "Respuesta automática",
    icon: Sparkles,
    description:
      "Configura este texto como mensaje de bienvenida en WhatsApp Business.",
    templates: [
      {
        id: "auto-1",
        title: "Bienvenida",
        description: "Respuesta inmediata cuando alguien escribe.",
        text:
          "¡Hola! Gracias por escribir a {salon} 💛\nPara reservar, lo más rápido es desde nuestra app:\n👉 {enlace}\n\nTe responderemos en cuanto podamos.",
      },
      {
        id: "auto-2",
        title: "Fuera de horario",
        description: "Para cuando el salón está cerrado.",
        text:
          "¡Hola! Ahora mismo estamos fuera de horario. Puedes reservar tu cita online 24/7 aquí: {enlace}\n\nMañana te leemos 😊",
      },
    ],
  },
];

export function WhatsAppKit({ tenantSlug, tenantName }: WhatsAppKitProps) {
  const [salonName, setSalonName] = useState(tenantName || "mi salón");
  const [clientName, setClientName] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("estado");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const link = buildLink(tenantSlug);
  const categories = useMemo(buildCategories, []);
  const current = categories.find((c) => c.id === activeCategory) ?? categories[0];

  const renderText = (tpl: Template) =>
    fillTemplate(tpl.text, {
      salon: salonName.trim() || "mi salón",
      link,
      nombre: tpl.perClient ? clientName.trim() || "{nombre}" : undefined,
    });

  const handleCopy = async (tpl: Template) => {
    try {
      await navigator.clipboard.writeText(renderText(tpl));
      setCopiedId(tpl.id);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopiedId((id) => (id === tpl.id ? null : id)), 1800);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleShare = (tpl: Template) => {
    const text = renderText(tpl);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Kit de Transición a WhatsApp
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Plantillas listas para anunciar a tus clientas que ahora reservan online. Personaliza, copia y pega.
            </p>
          </div>
        </div>
      </div>

      {/* Variables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="salon-name" className="text-xs text-muted-foreground">
            Nombre de tu salón
          </Label>
          <Input
            id="salon-name"
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            placeholder="Mi Salón"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client-name" className="text-xs text-muted-foreground">
            Nombre de la clienta (opcional)
          </Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Para mensajes personalizados"
            className="h-10 rounded-xl"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Tu enlace: <span className="font-mono text-foreground">{link}</span>
      </div>

      {/* Categorías */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">{current.description}</p>

      {/* Plantillas */}
      <div className="space-y-3">
        {current.templates.map((tpl) => {
          const text = renderText(tpl);
          const copied = copiedId === tpl.id;
          return (
            <div
              key={tpl.id}
              className="rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-xl"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tpl.title}</p>
                  <p className="text-[11px] text-muted-foreground">{tpl.description}</p>
                </div>
              </div>
              <Textarea
                value={text}
                readOnly
                className="min-h-[88px] resize-none rounded-xl border-border/60 bg-background/60 text-sm leading-relaxed"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={copied ? "secondary" : "default"}
                  onClick={() => handleCopy(tpl)}
                  className="h-9 gap-1.5 rounded-lg"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare(tpl)}
                  className="h-9 gap-1.5 rounded-lg"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartir por WhatsApp
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WhatsAppKit;
