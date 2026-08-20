import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowModal } from "./layout/GlowModal";
import { useGlowConfirm } from "./layout/GlowConfirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Link as LinkIcon,
  RotateCcw,
  AlertTriangle,
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
  const { confirm, confirmDialog } = useGlowConfirm();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  // Tiempo real: refresca cuando otra persona propone, confirma o libera un hueco
  useEffect(() => {
    if (!tenantId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetchData(), 400);
    };
    const channel = supabase
      .channel(`waitlist-admin-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist", filter: `tenant_id=eq.${tenantId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `tenant_id=eq.${tenantId}` },
        refresh,
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
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
          .order("created_at", { ascending: true }),
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
    const ok = await confirm({
      title: "¿Quitar de la lista de espera?",
      description: "La persona dejará de estar en espera. No se puede deshacer.",
      confirmLabel: "Quitar",
    });
    if (!ok) return;

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
  const conflictCount = proposedEntries.filter((e) => hasConflict(e)).length;
  const urgentCount = proposedEntries.filter((e) => getExpiry(e)?.urgent).length;
  const historyEntries = entries
    .filter((e) => ["booked", "cancelled", "expired"].includes(e.status))
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    if (entry.status === "proposed") return <span className="glow-badge glow-badge--brand"><span className="pip" style={{ background: "currentColor" }} />Hueco propuesto</span>;
    if (entry.status === "notified") return <span className="glow-badge glow-badge--warn"><Bell style={{ width: 10, height: 10 }} />Avisada</span>;
    if (entry.status === "booked") return <span className="glow-badge glow-badge--ok"><span className="pip" style={{ background: "currentColor" }} />Reservada</span>;
    if (entry.status === "cancelled") return <span className="glow-badge"><XCircle style={{ width: 10, height: 10 }} />Cancelada</span>;
    if (entry.status === "expired") return <span className="glow-badge"><Hourglass style={{ width: 10, height: 10 }} />Caducada</span>;
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  return (
    <div className="glow-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="glow-page-h">
        <div>
          <h2>Lista de espera</h2>
          <p>{activeEntries.length} esperando · {proposedEntries.length} propuestas</p>
        </div>
        <div className="glow-page-actions">
          <button className="glow-btn glow-btn--primary" onClick={() => setIsAddOpen(true)}>
            <Plus style={{ width: 14, height: 14 }} />
            Añadir
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="glow-filter-row">
        <button className={`glow-subtab${activeTab === "active" ? " glow-subtab--on" : ""}`} onClick={() => setActiveTab("active")}>
          Esperando {activeEntries.length > 0 && <span className="glow-subtab-count">{activeEntries.length}</span>}
        </button>
        <button className={`glow-subtab${activeTab === "proposed" ? " glow-subtab--on" : ""}`} onClick={() => setActiveTab("proposed")}>
          Propuestas {proposedEntries.length > 0 && <span className="glow-subtab-count">{proposedEntries.length}</span>}
        </button>
        <button className={`glow-subtab${activeTab === "history" ? " glow-subtab--on" : ""}`} onClick={() => setActiveTab("history")}>
          Historial
        </button>
      </div>

      {/* Resumen rápido de propuestas: conflictos y caducidades */}
      {activeTab === "proposed" && (conflictCount > 0 || urgentCount > 0) && (
        <div
          className="glow-card glow-card--pad"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: conflictCount > 0 ? "color-mix(in oklab, var(--glow-danger-ink), white 92%)" : "var(--glow-sunk)",
            borderColor: conflictCount > 0 ? "color-mix(in oklab, var(--glow-danger-ink), white 70%)" : "var(--glow-line)",
          }}
        >
          <span style={{ width: 28, height: 28, borderRadius: 9, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in oklab, var(--glow-danger-ink), white 82%)", color: "var(--glow-danger-ink)" }}>
            <AlertTriangle style={{ width: 14, height: 14 }} />
          </span>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "var(--glow-ink)" }}>Requieren tu atención</p>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--glow-ink-3)", fontWeight: 600 }}>
              {conflictCount > 0 && <>{conflictCount} con el hueco ya ocupado. </>}
              {urgentCount > 0 && <>{urgentCount} caducan en menos de 2h.</>}
            </p>
          </div>
        </div>
      )}



      {/* Empty state */}
      {tabEntries.length === 0 ? (
        <div className="glow-card">
          <div className="glow-empty">
            <div className="glow-empty-ic"><Clock style={{ width: 24, height: 24 }} /></div>
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
            const expiry = entry.status === "proposed" ? getExpiry(entry) : null;
            const conflict = hasConflict(entry);

            return (
              <div
                key={entry.id}
                className="glow-card glow-card--pad"
                style={{
                  ...(entry.status === "proposed" ? { borderColor: "color-mix(in oklab, var(--glow-brand-ink), white 55%)", background: "var(--glow-brand-soft)" } : {}),
                  ...(entry.priority >= 2 ? { borderLeft: "3px solid var(--glow-danger-ink)" } : {}),
                  ...(entry.priority === 1 ? { borderLeft: "3px solid var(--glow-warn-ink)" } : {}),
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {activeTab === "active" && (
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--glow-brand-soft)", color: "var(--glow-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flex: "none" }}>
                      {index + 1}
                    </span>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "var(--glow-ink)" }}>{entry.client_name}</span>
                      {getStatusBadge(entry)}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", fontSize: 12.5, color: "var(--glow-ink-3)", fontWeight: 600 }}>
                      {entry.user_id ? (
                        <span style={{ color: "var(--glow-ok-ink)", display: "flex", alignItems: "center", gap: 4 }}><Smartphone style={{ width: 13, height: 13 }} />App</span>
                      ) : entry.client_phone ? (
                        <a href={`tel:${entry.client_phone}`} style={{ color: "var(--glow-ink-3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
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

                    {activeTab === "active" && (() => {
                      const days = Math.max(0, Math.floor((Date.now() - new Date(entry.created_at).getTime()) / 86400000));
                      const left = entry.preferred_date ? null : Math.max(0, 60 - days);
                      return (
                        <p style={{ margin: "6px 0 0", fontSize: 11.5, fontWeight: 600, color: "var(--glow-ink-3)" }}>
                          {days === 0 ? "Apuntada hoy" : `Esperando ${days} ${days === 1 ? "día" : "días"}`}
                          {left !== null && ` · caduca en ${left} ${left === 1 ? "día" : "días"}`}
                        </p>
                      );
                    })()}



                    {entry.status === "proposed" && entry.proposed_date && (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--glow-brand-soft)", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "var(--glow-brand-ink)" }}>
                        🎯 Propuesto: {format(new Date(entry.proposed_date), "d MMM", { locale: es })} · {String(entry.proposed_time).slice(0, 5)}
                        {proposedStylistName && ` · ${proposedStylistName}`}
                        {expiry && (
                          <span style={{ display: "block", marginTop: 4, fontSize: 11.5, fontWeight: 700, color: expiry.urgent ? "var(--glow-danger-ink)" : "var(--glow-ink-3)" }}>
                            <Clock style={{ width: 11, height: 11, display: "inline", marginRight: 4, verticalAlign: -1 }} />
                            {expiry.text}
                          </span>
                        )}
                      </div>
                    )}

                    {conflict && (
                      <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "var(--glow-danger-ink)", background: "color-mix(in oklab, var(--glow-danger-ink), white 88%)", display: "flex", alignItems: "center", gap: 6 }}>
                        <AlertTriangle style={{ width: 13, height: 13, flex: "none" }} />
                        Conflicto: ese hueco ya tiene una cita confirmada
                      </div>
                    )}


                    {isExpanded && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: "var(--glow-ink-3)" }}>
                        {servicesText && <p style={{ margin: 0 }}><span style={{ fontWeight: 700, color: "var(--glow-ink-2)" }}>Servicios:</span> {servicesText}</p>}
                        {stylistName && <p style={{ margin: 0 }}><span style={{ fontWeight: 700, color: "var(--glow-ink-2)" }}>Profesional:</span> {stylistName}</p>}
                        {entry.notes && <p style={{ margin: 0, fontStyle: "italic" }}>"{entry.notes}"</p>}
                        <p style={{ margin: 0, fontSize: 11 }}>Apuntada {format(new Date(entry.created_at), "d MMM HH:mm", { locale: es })}</p>
                      </div>
                    )}

                    {(servicesText || entry.notes || stylistName) && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        style={{ marginTop: 6, fontSize: 11.5, color: "var(--glow-brand)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: 0, fontFamily: "inherit" }}
                      >
                        {isExpanded ? <><ChevronUp style={{ width: 12, height: 12 }} />Menos detalles</> : <><ChevronDown style={{ width: 12, height: 12 }} />Ver detalles</>}
                      </button>
                    )}
                  </div>

                  {/* More menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="glow-icon-btn" style={{ width: 34, height: 34, flex: "none" }}>
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
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--glow-line-soft)" }}>
                    <button className="glow-btn glow-btn--primary glow-btn--sm" style={{ flex: 1 }} onClick={() => setProposeEntry(entry)}>
                      <Sparkles style={{ width: 13, height: 13 }} />
                      Proponer hueco
                    </button>
                    <button className="glow-btn glow-btn--sm" style={{ flex: 1 }} onClick={() => handleMarkBooked(entry.id)}>
                      <CalendarPlus style={{ width: 13, height: 13 }} />
                      Ya reservada
                    </button>
                  </div>
                )}

                {entry.status === "proposed" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--glow-line-soft)", flexWrap: "wrap" }}>
                    {entry.client_phone && (
                      <button className="glow-btn glow-btn--primary glow-btn--sm" style={{ flex: 1, minWidth: 130 }} onClick={() => handleRemindWhatsApp(entry)}>
                        <MessageCircle style={{ width: 13, height: 13 }} />
                        Recordar
                      </button>
                    )}
                    <button className="glow-btn glow-btn--sm" style={{ flex: 1, minWidth: 110 }} onClick={() => handleCopyLink(entry)}>
                      <LinkIcon style={{ width: 13, height: 13 }} />
                      Copiar enlace
                    </button>
                    <button className="glow-btn glow-btn--sm" style={{ flex: 1, minWidth: 110 }} onClick={() => handleReleaseSlot(entry.id)}>
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
        <div className="glow-card glow-card--pad" style={{ background: "var(--glow-sunk)", border: "1px dashed var(--glow-line)" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 9, background: "var(--glow-brand-soft)", color: "var(--glow-brand)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Sparkles style={{ width: 14, height: 14 }} />
            </span>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--glow-ink)" }}>Cómo funciona</p>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--glow-ink-3)", lineHeight: 1.5 }}>
                Pulsa <b>Proponer hueco</b> para ofrecer una fecha a la clienta. Si tiene la app, le llega un aviso y puede confirmar con un toque. Si no, se abre WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <GlowModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Añadir a lista de espera"
        description="Te avisamos cuando se libere un hueco que le encaje."
        icon={<Plus />}
        footer={
          <>
            <button className="glow-btn" onClick={() => setIsAddOpen(false)}>Cancelar</button>
            <button className="glow-btn glow-btn--primary" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="glow-spinner-sm" />}
              Añadir
            </button>
          </>
        }
      >
        <div className="glow-form">
            <div className="glow-field">
              <label>Nombre del cliente *</label>
              <input className="glow-input"
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
                placeholder="Nombre completo"
              />
            </div>

            <div className="glow-field">
              <label>Teléfono</label>
              <input className="glow-input"
                value={formData.client_phone}
                onChange={(e) =>
                  setFormData({ ...formData, client_phone: e.target.value })
                }
                placeholder="612 345 678 (opcional)"
                type="tel"
              />
            </div>

            <div className="glow-field">
              <label>Fecha preferida</label>
              <input className="glow-input"
                type="date"
                value={formData.preferred_date}
                onChange={(e) =>
                  setFormData({ ...formData, preferred_date: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glow-field">
                <label>Desde</label>
                <input className="glow-input"
                  type="time"
                  value={formData.preferred_time_start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_time_start: e.target.value,
                    })
                  }
                />
              </div>
              <div className="glow-field">
                <label>Hasta</label>
                <input className="glow-input"
                  type="time"
                  value={formData.preferred_time_end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_time_end: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="glow-field">
              <label>Profesional preferido</label>
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

            <div className="glow-field">
              <label>Prioridad</label>
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
                      <span className="w-2 h-2 rounded-full bg-glow-warn" />
                      Media
                    </span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-glow-danger" />
                      Alta
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="glow-field">
              <label>Notas</label>
              <textarea className="glow-input"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>
          </div>

      </GlowModal>

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
      {confirmDialog}
    </div>
  );
}
