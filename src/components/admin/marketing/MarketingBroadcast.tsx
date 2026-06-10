import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Users,
  Crown,
  Cake,
  Clock,
  Sparkles,
  Search,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketingBroadcastProps {
  tenantId: string;
  tenantSlug: string;
  tenantName?: string;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
  birthday: string | null;
  last_visit_at: string | null;
  total_visits: number | null;
  total_spent: number | null;
  loyalty_points: number | null;
}

type SegmentId = "all" | "vip" | "lapsed" | "birthday" | "new" | "frequent";

interface SegmentDef {
  id: SegmentId;
  label: string;
  description: string;
  icon: React.ElementType;
  tone: string;
  filter: (c: Client, now: Date) => boolean;
}

const SEGMENTS: SegmentDef[] = [
  {
    id: "all",
    label: "Todas",
    description: "Todos los clientes con teléfono",
    icon: Users,
    tone: "brand",
    filter: () => true,
  },
  {
    id: "vip",
    label: "VIPs",
    description: "Más de 250€ gastados",
    icon: Crown,
    tone: "warn",
    filter: (c) => (c.total_spent ?? 0) >= 250,
  },
  {
    id: "frequent",
    label: "Frecuentes",
    description: "5+ visitas",
    icon: Sparkles,
    tone: "accent",
    filter: (c) => (c.total_visits ?? 0) >= 5,
  },
  {
    id: "lapsed",
    label: "Inactivas 60d+",
    description: "Sin visita hace más de 60 días",
    icon: Clock,
    tone: "danger",
    filter: (c, now) => {
      if (!c.last_visit_at) return false;
      const diff = (now.getTime() - new Date(c.last_visit_at).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 60;
    },
  },
  {
    id: "birthday",
    label: "Cumple este mes",
    description: "Cumpleañeras del mes actual",
    icon: Cake,
    tone: "rose",
    filter: (c, now) => {
      if (!c.birthday) return false;
      return new Date(c.birthday).getMonth() === now.getMonth();
    },
  },
  {
    id: "new",
    label: "Nuevas",
    description: "1-2 visitas en su histórico",
    icon: Sparkles,
    tone: "ok",
    filter: (c) => (c.total_visits ?? 0) > 0 && (c.total_visits ?? 0) <= 2,
  },
];

const PRESETS = [
  {
    id: "promo",
    label: "Promo del mes",
    body: "¡Hola {nombre}! 💇‍♀️ Tenemos una promo especial en {salon} este mes. Reserva tu cita aquí 👉 {enlace}",
  },
  {
    id: "reactivar",
    label: "Te echamos de menos",
    body: "Hola {nombre}, hace tiempo que no te vemos por {salon}. Te guardamos un hueco esta semana 💖 {enlace}",
  },
  {
    id: "cumple",
    label: "Felicitación cumple",
    body: "¡Feliz cumpleaños {nombre}! 🎉 Para celebrarlo, tienes un detalle especial en {salon}. Reserva: {enlace}",
  },
  {
    id: "novedad",
    label: "Novedad servicio",
    body: "Hola {nombre} ✨ ¡Nuevo servicio en {salon}! Te lo enseñamos: {enlace}",
  },
  {
    id: "recordatorio",
    label: "Recordatorio reseña",
    body: "Hola {nombre}, ¿qué tal tu visita a {salon}? Nos encantaría que dejaras una reseña 🌟 {enlace}",
  },
];

function buildLink(slug: string): string {
  return `https://glowapp.app/${slug || "tu-salon"}`;
}

function fillTemplate(text: string, salon: string, link: string, nombre: string): string {
  return text
    .split("{salon}").join(salon)
    .split("{enlace}").join(link)
    .split("{nombre}").join(nombre || "amor");
}

function waLink(phone: string, msg: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${clean.replace(/^\+/, "")}?text=${encodeURIComponent(msg)}`;
}

export function MarketingBroadcast({ tenantId, tenantSlug, tenantName }: MarketingBroadcastProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [segment, setSegment] = useState<SegmentId>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(PRESETS[0].body);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const link = buildLink(tenantSlug);
  const salon = tenantName || "nuestro salón";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, birthday, last_visit_at, total_visits, total_spent, loyalty_points")
        .eq("tenant_id", tenantId)
        .not("phone", "is", null)
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      setClients((data ?? []) as Client[]);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, toast]);

  const now = new Date();

  const segmentCounts = useMemo(() => {
    const map: Partial<Record<SegmentId, number>> = {};
    SEGMENTS.forEach((s) => {
      map[s.id] = clients.filter((c) => s.filter(c, now)).length;
    });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    const segDef = SEGMENTS.find((s) => s.id === segment)!;
    const term = search.trim().toLowerCase();
    return clients
      .filter((c) => segDef.filter(c, now))
      .filter((c) => !term || c.name.toLowerCase().includes(term) || (c.phone ?? "").includes(term));
  }, [clients, segment, search]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach((c) => next.delete(c.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((c) => next.add(c.id));
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const usePreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) setMessage(preset.body);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado" });
  };

  const openChats = () => {
    const selectedClients = clients.filter((c) => selected.has(c.id) && c.phone);
    if (selectedClients.length === 0) {
      toast({ title: "Selecciona al menos un contacto", variant: "destructive" });
      return;
    }
    selectedClients.forEach((c, idx) => {
      const firstName = c.name.split(" ")[0] || "";
      const filled = fillTemplate(message, salon, link, firstName);
      const url = waLink(c.phone!, filled);
      setTimeout(() => window.open(url, "_blank"), idx * 250);
    });
    setSentIds((prev) => {
      const next = new Set(prev);
      selectedClients.forEach((c) => next.add(c.id));
      return next;
    });
    toast({
      title: "Abriendo WhatsApp",
      description: `${selectedClients.length} chat${selectedClients.length === 1 ? "" : "s"}`,
    });
  };

  const preview = fillTemplate(message, salon, link, "María");

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  return (
    <div className="gp-fade gp-mkt-broadcast">
      <div className="gp-page-h">
        <div>
          <h2>Difusión</h2>
          <p>Manda mensajes personalizados a tus clientes por WhatsApp</p>
        </div>
      </div>

      {/* Segments */}
      <div className="gp-mkt-segments">
        {SEGMENTS.map((s) => {
          const count = segmentCounts[s.id] ?? 0;
          const active = segment === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              className={`gp-mkt-segment tone-${s.tone}${active ? " on" : ""}`}
              onClick={() => setSegment(s.id)}
              type="button"
            >
              <span className="gp-mkt-segment-ic">
                <Icon />
              </span>
              <span className="gp-mkt-segment-label">{s.label}</span>
              <span className="gp-mkt-segment-count">{count}</span>
              <span className="gp-mkt-segment-desc">{s.description}</span>
            </button>
          );
        })}
      </div>

      <div className="gp-mkt-broadcast-grid">
        {/* Recipients */}
        <section className="gp-card pad gp-mkt-card">
          <div className="gp-mkt-card-h">
            <div>
              <h3>Destinatarios</h3>
              <p>{filtered.length} en este segmento · {selected.size} seleccionados</p>
            </div>
            <button className="gp-btn sm" onClick={toggleAll} type="button">
              {allSelected ? "Quitar todos" : "Seleccionar todos"}
            </button>
          </div>

          <div className="gp-mkt-search">
            <Search style={{ width: 14, height: 14, color: "var(--gp-muted-c)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="gp-mkt-empty">
              <Users />
              <p>No hay clientes en este segmento</p>
            </div>
          ) : (
            <div className="gp-mkt-recipients">
              {filtered.map((c) => {
                const isSel = selected.has(c.id);
                const wasSent = sentIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    className={`gp-mkt-recipient${isSel ? " on" : ""}`}
                    onClick={() => toggleOne(c.id)}
                    type="button"
                  >
                    <span className="gp-mkt-recipient-check">
                      {isSel && <Check style={{ width: 12, height: 12 }} />}
                    </span>
                    <span className="gp-mkt-recipient-info">
                      <strong>{c.name}</strong>
                      <span>{c.phone}</span>
                    </span>
                    {wasSent && (
                      <span className="gp-badge ok" style={{ fontSize: 10 }}>
                        Enviado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Composer */}
        <section className="gp-card pad gp-mkt-card">
          <div className="gp-mkt-card-h">
            <div>
              <h3>Mensaje</h3>
              <p>Usa <code>{"{nombre}"}</code> <code>{"{salon}"}</code> <code>{"{enlace}"}</code></p>
            </div>
          </div>

          <div className="gp-mkt-presets">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className="gp-mkt-preset"
                onClick={() => usePreset(p.id)}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            className="gp-mkt-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Escribe tu mensaje..."
          />

          <div className="gp-mkt-preview">
            <div className="gp-mkt-preview-h">
              <MessageCircle style={{ width: 13, height: 13 }} />
              Vista previa
            </div>
            <p>{preview}</p>
          </div>

          <div className="gp-mkt-broadcast-actions">
            <button
              className="gp-btn sm"
              type="button"
              onClick={() => copyToClipboard(preview)}
            >
              <Copy style={{ width: 13, height: 13 }} /> Copiar
            </button>
            <button
              className="gp-btn sm primary"
              type="button"
              onClick={openChats}
              disabled={selected.size === 0}
            >
              <Send style={{ width: 13, height: 13 }} />
              Enviar a {selected.size || 0}
              <ExternalLink style={{ width: 11, height: 11, opacity: 0.7 }} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MarketingBroadcast;
