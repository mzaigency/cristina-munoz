import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Clock,
  Phone,
  Calendar as CalendarIcon,
  Trash2,
  Bell,
  CheckCircle,
  Loader2,
  Smartphone,
  MessageCircle,
  User,
  MoreVertical,
  Sparkles,
  CalendarPlus,
  Hourglass,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProposeSlotDialog } from "./ProposeSlotDialog";

interface WaitlistEntry {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  user_id: string | null;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  preferred_stylist_id: string | null;
  services: any[];
  priority: number;
  status: string;
  notified_at: string | null;
  notes: string | null;
  created_at: string;
  proposed_date?: string | null;
  proposed_time?: string | null;
  proposed_stylist_id?: string | null;
  proposed_at?: string | null;
  proposed_expires_at?: string | null;
  proposal_token?: string | null;
}

interface Stylist {
  id: string;
  name: string;
  slug: string;
}

interface WaitlistManagerProps {
  tenantId: string;
}

type TabValue = "active" | "proposed" | "history";

export function WaitlistManager({ tenantId }: WaitlistManagerProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [proposeEntry, setProposeEntry] = useState<WaitlistEntry | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<{ Fecha: string; Hora: string; total_duration: number | null; stylist: string }[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);


  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    preferred_date: "",
    preferred_time_start: "",
    preferred_time_end: "",
    preferred_stylist_id: "",
    priority: 0,
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const [waitlistRes, stylistsRes, tenantRes] = await Promise.all([
        supabase
          .from("waitlist" as any)
          .select("*")
          .eq("tenant_id", tenantId)
          .in("status", ["waiting", "notified", "proposed", "booked", "expired", "cancelled"])
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("tenant_stylists")
          .select("id, name, slug")
          .eq("tenant_id", tenantId)
          .eq("is_active", true),
        supabase.from("tenants").select("slug").eq("id", tenantId).single(),
      ]);

      if (waitlistRes.error) throw waitlistRes.error;
      const list = (waitlistRes.data || []) as unknown as WaitlistEntry[];
      setEntries(list);
      setStylists(stylistsRes.data || []);
      setTenantSlug(tenantRes.data?.slug || "");

      // Citas confirmadas de los días propuestos → para detectar conflictos
      const dates = Array.from(
        new Set(list.filter((e) => e.status === "proposed" && e.proposed_date).map((e) => e.proposed_date as string)),
      );
      if (dates.length > 0) {
        const { data: bk } = await supabase
          .from("bookings")
          .select("Fecha, Hora, total_duration, stylist")
          .eq("tenant_id", tenantId)
          .eq("status", "confirmed")
          .in("Fecha", dates);
        setBookings((bk || []) as any);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const getDuration = (services: any[]) =>
    Array.isArray(services) && services.length > 0
      ? services.reduce((sum: number, s: any) => sum + (s.duration || s.total_duration || s.duration_part1_active || 30), 0)
      : 60;

  /** Devuelve true si el hueco propuesto choca con una cita confirmada */
  const hasConflict = (entry: WaitlistEntry) => {
    if (entry.status !== "proposed" || !entry.proposed_date || !entry.proposed_time) return false;
    const slug = entry.proposed_stylist_id
      ? stylists.find((s) => s.id === entry.proposed_stylist_id)?.slug
      : null;
    const start = toMin(String(entry.proposed_time).slice(0, 5));
    const end = start + getDuration(entry.services);
    return bookings.some((b) => {
      if (b.Fecha !== entry.proposed_date) return false;
      if (slug && b.stylist !== slug) return false;
      const bStart = toMin(String(b.Hora).slice(0, 5));
      const bEnd = bStart + (b.total_duration || 60);
      return start < bEnd && end > bStart;
    });
  };

  /** Texto de cuenta atrás de la propuesta */
  const getExpiry = (entry: WaitlistEntry) => {
    if (!entry.proposed_expires_at) return null;
    const diff = new Date(entry.proposed_expires_at).getTime() - now;
    if (diff <= 0) return { text: "Caducada", urgent: true, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return {
      text: h > 0 ? `Caduca en ${h}h ${m}m` : `Caduca en ${m} min`,
      urgent: diff < 2 * 3600000,
      expired: false,
    };
  };

  const getProposalLink = (entry: WaitlistEntry) =>
    entry.proposal_token ? `${window.location.origin}/lista-espera/${entry.proposal_token}` : null;

  const handleCopyLink = async (entry: WaitlistEntry) => {
    const link = getProposalLink(entry);
    if (!link) {
      toast({ title: "Esta propuesta no tiene enlace", variant: "destructive" });
      return;
    }
    await navigator.clipboard.writeText(link);
    toast({ title: "Enlace copiado" });
  };

  const handleRemindWhatsApp = (entry: WaitlistEntry) => {
    if (!entry.client_phone) return;
    const link = getProposalLink(entry);
    const phone = entry.client_phone.replace(/\D/g, "");
    const when =
      entry.proposed_date && entry.proposed_time
        ? `${format(new Date(entry.proposed_date), "EEEE d 'de' MMMM", { locale: es })} a las ${String(entry.proposed_time).slice(0, 5)}`
        : "el hueco que te propusimos";
    const msg = encodeURIComponent(
      `¡Hola ${entry.client_name}! Te hemos guardado un hueco para ${when}. Confírmalo aquí 👉 ${link ?? ""}`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  /** Libera el hueco propuesto y devuelve a la clienta a la cola */
  const handleReleaseSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .update({
          status: "waiting",
          proposed_date: null,
          proposed_time: null,
          proposed_stylist_id: null,
          proposed_at: null,
          proposed_expires_at: null,
          proposal_token: null,
        })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Hueco liberado", description: "La clienta vuelve a la cola de espera" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const handleSave = async () => {
    if (!formData.client_name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("waitlist" as any).insert({
        tenant_id: tenantId,
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone.trim() || null,
        client_email: formData.client_email.trim() || null,
        preferred_date: formData.preferred_date || null,
        preferred_time_start: formData.preferred_time_start || null,
        preferred_time_end: formData.preferred_time_end || null,
        preferred_stylist_id: formData.preferred_stylist_id || null,
        priority: formData.priority,
        notes: formData.notes.trim() || null,
      });

      if (error) throw error;

      toast({ title: "Añadido a lista de espera" });
      setIsAddOpen(false);
      setFormData({
        client_name: "",
        client_phone: "",
        client_email: "",
        preferred_date: "",
        preferred_time_start: "",
        preferred_time_end: "",
        preferred_stylist_id: "",
        priority: 0,
        notes: "",
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkBooked = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .update({ status: "booked" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Marcado como reservado" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Entrada cancelada" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar definitivamente?")) return;

    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Eliminado" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSendWhatsApp = (entry: WaitlistEntry) => {
    if (!entry.client_phone) return;
    const phone = entry.client_phone.replace(/\D/g, "");
    const dateText = entry.preferred_date
      ? format(new Date(entry.preferred_date), "d 'de' MMMM", { locale: es })
      : "tu fecha preferida";
    const msg = encodeURIComponent(
      `¡Hola ${entry.client_name}! Te escribo desde el salón. Estás en nuestra lista de espera para ${dateText}. ¿Sigues interesad@? 💜`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  // Filter by tab
  const activeEntries = entries.filter((e) =>
    ["waiting", "notified"].includes(e.status)
  );
  const proposedEntries = entries.filter((e) => e.status === "proposed");
  const historyEntries = entries.filter((e) =>
    ["booked", "cancelled", "expired"].includes(e.status)
  );

  const tabEntries =
    activeTab === "active"
      ? activeEntries
      : activeTab === "proposed"
        ? proposedEntries
        : historyEntries;

  const getStylistName = (id?: string | null) => {
    if (!id) return null;
    return stylists.find((s) => s.id === id)?.name;
  };

  const getServicesText = (services: any[]) => {
    if (!Array.isArray(services) || services.length === 0) return null;
    return services.map((s: any) => s.name).filter(Boolean).join(", ");
  };

  const getStatusBadge = (entry: WaitlistEntry) => {
    if (entry.status === "proposed") return <span className="gp-badge info"><span className="pip" style={{ background: "currentColor" }} />Hueco propuesto</span>;
    if (entry.status === "notified") return <span className="gp-badge warn"><Bell style={{ width: 10, height: 10 }} />Avisada</span>;
    if (entry.status === "booked") return <span className="gp-badge ok"><span className="pip" style={{ background: "currentColor" }} />Reservada</span>;
    if (entry.status === "cancelled") return <span className="gp-badge neutral"><XCircle style={{ width: 10, height: 10 }} />Cancelada</span>;
    if (entry.status === "expired") return <span className="gp-badge neutral"><Hourglass style={{ width: 10, height: 10 }} />Caducada</span>;
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  return (
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="gp-page-h">
        <div>
          <h2>Lista de espera</h2>
          <p>{activeEntries.length} esperando · {proposedEntries.length} propuestas</p>
        </div>
        <div className="gp-page-actions">
          <button className="gp-btn primary" onClick={() => setIsAddOpen(true)}>
            <Plus style={{ width: 14, height: 14 }} />
            Añadir
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="gp-subtabs">
        <button className={`gp-subtab${activeTab === "active" ? " on" : ""}`} onClick={() => setActiveTab("active")}>
          Esperando {activeEntries.length > 0 && <span className="gp-subtab-count">{activeEntries.length}</span>}
        </button>
        <button className={`gp-subtab${activeTab === "proposed" ? " on" : ""}`} onClick={() => setActiveTab("proposed")}>
          Propuestas {proposedEntries.length > 0 && <span className="gp-subtab-count">{proposedEntries.length}</span>}
        </button>
        <button className={`gp-subtab${activeTab === "history" ? " on" : ""}`} onClick={() => setActiveTab("history")}>
          Historial
        </button>
      </div>

      {/* Empty state */}
      {tabEntries.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><Clock style={{ width: 24, height: 24 }} /></div>
            <h4>
              {activeTab === "active" && "Sin clientes en espera"}
              {activeTab === "proposed" && "Sin propuestas activas"}
              {activeTab === "history" && "Sin historial todavía"}
            </h4>
            <p>
              {activeTab === "active" && "Los clientes pueden unirse cuando no haya huecos"}
              {activeTab === "proposed" && "Propón un hueco a alguien de la lista"}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tabEntries.map((entry, index) => {
            const isExpanded = expandedId === entry.id;
            const servicesText = getServicesText(entry.services);
            const stylistName = getStylistName(entry.preferred_stylist_id);
            const proposedStylistName = getStylistName(entry.proposed_stylist_id);

            return (
              <div
                key={entry.id}
                className="gp-card pad"
                style={{
                  ...(entry.status === "proposed" ? { borderColor: "color-mix(in oklab, var(--gp-info), white 55%)", background: "var(--gp-info-soft)" } : {}),
                  ...(entry.priority >= 2 ? { borderLeft: "3px solid var(--gp-danger)" } : {}),
                  ...(entry.priority === 1 ? { borderLeft: "3px solid var(--gp-warn)" } : {}),
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {activeTab === "active" && (
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gp-accent-soft)", color: "var(--gp-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flex: "none" }}>
                      {index + 1}
                    </span>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "var(--gp-ink)" }}>{entry.client_name}</span>
                      {getStatusBadge(entry)}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", fontSize: 12.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>
                      {entry.user_id ? (
                        <span style={{ color: "var(--gp-ok)", display: "flex", alignItems: "center", gap: 4 }}><Smartphone style={{ width: 13, height: 13 }} />App</span>
                      ) : entry.client_phone ? (
                        <a href={`tel:${entry.client_phone}`} style={{ color: "var(--gp-muted-c)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone style={{ width: 13, height: 13 }} />{entry.client_phone}
                        </a>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User style={{ width: 13, height: 13 }} />Sin contacto</span>
                      )}
                      {entry.preferred_date && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CalendarIcon style={{ width: 13, height: 13 }} />
                          {format(new Date(entry.preferred_date), "d MMM", { locale: es })}
                          {entry.preferred_time_start && ` · ${entry.preferred_time_start.slice(0, 5)}`}
                          {entry.preferred_time_end && `–${entry.preferred_time_end.slice(0, 5)}`}
                        </span>
                      )}
                    </div>

                    {entry.status === "proposed" && entry.proposed_date && (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "color-mix(in oklab, var(--gp-info), white 82%)", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "var(--gp-info-soft)" }}>
                        🎯 Propuesto: {format(new Date(entry.proposed_date), "d MMM", { locale: es })} · {String(entry.proposed_time).slice(0, 5)}
                        {proposedStylistName && ` · ${proposedStylistName}`}
                      </div>
                    )}

                    {isExpanded && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: "var(--gp-muted-c)" }}>
                        {servicesText && <p style={{ margin: 0 }}><span style={{ fontWeight: 700, color: "var(--gp-ink2)" }}>Servicios:</span> {servicesText}</p>}
                        {stylistName && <p style={{ margin: 0 }}><span style={{ fontWeight: 700, color: "var(--gp-ink2)" }}>Profesional:</span> {stylistName}</p>}
                        {entry.notes && <p style={{ margin: 0, fontStyle: "italic" }}>"{entry.notes}"</p>}
                        <p style={{ margin: 0, fontSize: 11 }}>Apuntada {format(new Date(entry.created_at), "d MMM HH:mm", { locale: es })}</p>
                      </div>
                    )}

                    {(servicesText || entry.notes || stylistName) && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        style={{ marginTop: 6, fontSize: 11.5, color: "var(--gp-accent)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: 0, fontFamily: "inherit" }}
                      >
                        {isExpanded ? <><ChevronUp style={{ width: 12, height: 12 }} />Menos detalles</> : <><ChevronDown style={{ width: 12, height: 12 }} />Ver detalles</>}
                      </button>
                    )}
                  </div>

                  {/* More menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="gp-icon-btn" style={{ width: 34, height: 34, flex: "none" }}>
                        <MoreVertical style={{ width: 16, height: 16 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {entry.client_phone && (
                        <DropdownMenuItem asChild>
                          <a href={`tel:${entry.client_phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Llamar
                          </a>
                        </DropdownMenuItem>
                      )}
                      {entry.client_phone && (
                        <DropdownMenuItem onClick={() => handleSendWhatsApp(entry)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Mensaje WhatsApp
                        </DropdownMenuItem>
                      )}
                      {["waiting", "notified", "proposed"].includes(entry.status) && (
                        <DropdownMenuItem onClick={() => handleMarkBooked(entry.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como reservada
                        </DropdownMenuItem>
                      )}
                      {["waiting", "notified", "proposed"].includes(entry.status) && (
                        <DropdownMenuItem onClick={() => handleCancel(entry.id)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancelar entrada
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(entry.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Action buttons */}
                {["waiting", "notified"].includes(entry.status) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--gp-line2)" }}>
                    <button className="gp-btn primary sm" style={{ flex: 1 }} onClick={() => setProposeEntry(entry)}>
                      <Sparkles style={{ width: 13, height: 13 }} />
                      Proponer hueco
                    </button>
                    <button className="gp-btn sm" style={{ flex: 1 }} onClick={() => handleMarkBooked(entry.id)}>
                      <CalendarPlus style={{ width: 13, height: 13 }} />
                      Ya reservada
                    </button>
                  </div>
                )}

                {entry.status === "proposed" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--gp-line2)", flexWrap: "wrap" }}>
                    {entry.client_phone && (
                      <button className="gp-btn primary sm" style={{ flex: 1, minWidth: 130 }} onClick={() => handleRemindWhatsApp(entry)}>
                        <MessageCircle style={{ width: 13, height: 13 }} />
                        Recordar
                      </button>
                    )}
                    <button className="gp-btn sm" style={{ flex: 1, minWidth: 110 }} onClick={() => handleCopyLink(entry)}>
                      <LinkIcon style={{ width: 13, height: 13 }} />
                      Copiar enlace
                    </button>
                    <button className="gp-btn sm" style={{ flex: 1, minWidth: 110 }} onClick={() => handleReleaseSlot(entry.id)}>
                      <RotateCcw style={{ width: 13, height: 13 }} />
                      Liberar hueco
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Info card */}
      {activeTab === "active" && activeEntries.length > 0 && (
        <div className="gp-card pad" style={{ background: "var(--gp-chip)", border: "1px dashed var(--gp-line)" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 9, background: "var(--gp-accent-soft)", color: "var(--gp-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Sparkles style={{ width: 14, height: 14 }} />
            </span>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--gp-ink)" }}>Cómo funciona</p>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--gp-muted-c)", lineHeight: 1.5 }}>
                Pulsa <b>Proponer hueco</b> para ofrecer una fecha a la clienta. Si tiene la app, le llega un aviso y puede confirmar con un toque. Si no, se abre WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom),1rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Añadir a Lista de Espera
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Nombre del cliente *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
                placeholder="Nombre completo"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={formData.client_phone}
                onChange={(e) =>
                  setFormData({ ...formData, client_phone: e.target.value })
                }
                placeholder="612 345 678 (opcional)"
                type="tel"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Fecha preferida</Label>
              <Input
                type="date"
                value={formData.preferred_date}
                onChange={(e) =>
                  setFormData({ ...formData, preferred_date: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Desde</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_time_start: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_time_end: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Profesional preferido</Label>
              <Select
                value={formData.preferred_stylist_id || "none"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    preferred_stylist_id: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sin preferencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin preferencia</SelectItem>
                  {stylists.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Prioridad</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(v) =>
                  setFormData({ ...formData, priority: parseInt(v) })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Normal
                    </span>
                  </SelectItem>
                  <SelectItem value="1">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Media
                    </span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Alta
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observaciones adicionales..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Propose Slot Dialog */}
      {proposeEntry && (
        <ProposeSlotDialog
          open={!!proposeEntry}
          onOpenChange={(open) => !open && setProposeEntry(null)}
          waitlistEntry={proposeEntry}
          stylists={stylists}
          tenantSlug={tenantSlug}
          onProposed={() => {
            fetchData();
            setActiveTab("proposed");
          }}
        />
      )}
    </div>
  );
}
