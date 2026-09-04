import { useEffect, useMemo, useRef, useState } from "react";
import { CHART_COLORS } from "@/lib/chartColors";
import { supabase } from "@/integrations/supabase/client";
import {
  X,
  Clock,
  Percent,
  Calendar,
  Euro,
  Star,
  Loader2,
  Trash2,
  Camera,
  Pencil,
  Moon,
  History,
  UserCog,
  Store,
  CalendarOff,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InlineScheduleEditor } from "./InlineScheduleEditor";
import { StylistAbsences } from "./StylistAbsences";

export interface StylistDrawerProps {
  tenantId: string;
  stylistId: string;
  onClose: () => void;
  onChanged: () => void;
  initialTab?: "schedule" | "performance" | "profile";
  autoOpenAddAbsence?: boolean;
}

interface Stylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  avatar_url: string | null;
  is_active: boolean;
  user_id: string | null;
}

interface Commission {
  id: string | null;
  commission_type: string;
  commission_percentage: number;
  commission_fixed: number;
}

interface BookingRow {
  id: string;
  Fecha: string;
  Hora: string;
  customer_name: string | null;
  services: unknown;
}

interface DaySchedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

const PRESET_COLORS = CHART_COLORS;
const COMMISSION_PRESETS = [30, 40, 50, 60];

const WEEK_DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const firstServiceName = (services: unknown): string | null => {
  if (!Array.isArray(services) || services.length === 0) return null;
  const s = services[0] as { name?: string } | string;
  if (typeof s === "string") return s;
  return s?.name ?? null;
};

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

type DrawerTab = "schedule" | "performance" | "profile";

export function StylistDrawer({
  tenantId,
  stylistId,
  onClose,
  onChanged,
  initialTab = "schedule",
  autoOpenAddAbsence = false,
}: StylistDrawerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [commission, setCommission] = useState<Commission>({
    id: null,
    commission_type: "percentage",
    commission_percentage: 50,
    commission_fixed: 0,
  });
  const [commissionDirty, setCommissionDirty] = useState(false);
  const [revenueMonth, setRevenueMonth] = useState(0);
  const [bookingsMonth, setBookingsMonth] = useState(0);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<BookingRow[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);
  const [usesSalonHours, setUsesSalonHours] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSalonHours, setConfirmSalonHours] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoOpenAddAbsence) {
      setActiveTab("schedule");
      const timer = setTimeout(() => {
        const el = document.getElementById("stylist-absences-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [autoOpenAddAbsence]);

  const loadSchedule = async () => {
    const { data: own } = await supabase
      .from("stylist_business_hours")
      .select("day_of_week, is_working, start_time, end_time")
      .eq("stylist_id", stylistId);

    if (own && own.length > 0) {
      setUsesSalonHours(false);
      setSchedule(own as DaySchedule[]);
      return;
    }

    const { data: salon } = await supabase
      .from("tenant_business_hours")
      .select("day_of_week, is_open, open_time, close_time")
      .eq("tenant_id", tenantId);
    setUsesSalonHours(true);
    setSchedule(
      ((salon ?? []) as Array<{ day_of_week: number; is_open: boolean; open_time: string | null; close_time: string | null }>).map(
        (d) => ({
          day_of_week: d.day_of_week,
          is_working: d.is_open,
          start_time: d.open_time,
          end_time: d.close_time,
        }),
      ),
    );
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: st } = await supabase
        .from("tenant_stylists")
        .select("*")
        .eq("id", stylistId)
        .single();

      if (cancelled || !st) {
        setLoading(false);
        return;
      }
      setStylist(st as Stylist);
      const name = (st as Stylist).name;

      const [commRes, txRes, countRes, recentRes] = await Promise.all([
        supabase.from("stylist_commissions").select("*").eq("stylist_id", stylistId).maybeSingle(),
        supabase
          .from("transactions")
          .select("total")
          .eq("tenant_id", tenantId)
          .eq("stylist_id", stylistId)
          .eq("voided", false)
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("stylist", name)
          .gte("Fecha", format(monthStart, "yyyy-MM-dd"))
          .lte("Fecha", format(monthEnd, "yyyy-MM-dd")),
        supabase
          .from("bookings")
          .select("id, Fecha, Hora, customer_name, services")
          .eq("tenant_id", tenantId)
          .eq("stylist", name)
          .order("Fecha", { ascending: false })
          .order("Hora", { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;

      const comm = commRes.data as Commission | null;
      if (comm) {
        setCommission({
          id: comm.id,
          commission_type: comm.commission_type ?? "percentage",
          commission_percentage: comm.commission_percentage ?? 50,
          commission_fixed: comm.commission_fixed ?? 0,
        });
      }

      const txs = (txRes.data ?? []) as Array<{ total: number }>;
      setRevenueMonth(txs.reduce((acc, t) => acc + Number(t.total ?? 0), 0));
      setBookingsMonth(countRes.count ?? 0);
      setRecentBookings((recentRes.data ?? []) as BookingRow[]);

      setLoading(false);
      loadSchedule();
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, stylistId]);

  const earnings = useMemo(() => {
    if (commission.commission_type === "percentage") {
      return Math.round((revenueMonth * commission.commission_percentage) / 100);
    }
    return commission.commission_fixed * bookingsMonth;
  }, [commission, revenueMonth, bookingsMonth]);

  const updateStylist = async (patch: Partial<Stylist>) => {
    if (!stylist) return;
    setSaving(true);
    const { error } = await supabase.from("tenant_stylists").update(patch).eq("id", stylist.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setStylist({ ...stylist, ...patch });
    onChanged();
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file || !stylist) return;
    setUploadingAvatar(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${tenantId}/stylists/${stylist.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("tenant-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setUploadingAvatar(false);
      toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("tenant-assets").getPublicUrl(fileName);
    setUploadingAvatar(false);
    await updateStylist({ avatar_url: publicUrl });
    toast({ title: "Foto actualizada" });
  };

  const saveCommission = async () => {
    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      stylist_id: stylistId,
      commission_type: commission.commission_type,
      commission_percentage:
        commission.commission_type === "percentage" ? commission.commission_percentage : null,
      commission_fixed: commission.commission_type === "fixed" ? commission.commission_fixed : null,
      effective_from: format(new Date(), "yyyy-MM-dd"),
    };
    if (commission.id) {
      const { error } = await supabase.from("stylist_commissions").update(payload).eq("id", commission.id);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase.from("stylist_commissions").insert(payload).select("id").single();
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setCommission((c) => ({ ...c, id: (data as { id: string } | null)?.id ?? null }));
    }
    setCommissionDirty(false);
    toast({ title: "Comisión guardada" });
    onChanged();
  };

  const revertToSalonHours = async () => {
    setSaving(true);
    const { error } = await supabase.from("stylist_business_hours").delete().eq("stylist_id", stylistId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo restaurar el horario", variant: "destructive" });
      return;
    }
    toast({ title: "Horario del salón", description: `${stylist?.name} vuelve a seguir el horario general.` });
    setSchedule(null);
    loadSchedule();
    onChanged();
  };

  const handleDelete = async () => {
    if (!stylist) return;
    setSaving(true);
    const { error } = await supabase.from("tenant_stylists").delete().eq("id", stylist.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${stylist.name} eliminado del equipo` });
    onChanged();
    onClose();
  };

  if (loading || !stylist) {
    return (
      <div className="glow-neg-drawer-backdrop" onClick={onClose}>
        <div className="glow-neg-drawer" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 className="glow-spinner" />
          </div>
        </div>
      </div>
    );
  }

  const orderedSchedule = WEEK_DAYS.map((d) => ({
    ...d,
    row: schedule?.find((s) => s.day_of_week === d.value) ?? null,
  }));

  return (
    <div className="glow-neg-drawer-backdrop" onClick={onClose}>
      <div
        className="glow-neg-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* Cabecera Fija */}
        <div
          className="glow-neg-drawer-h"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--glow-line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="glow-neg-avatar-edit"
              onClick={() => fileRef.current?.click()}
              type="button"
              title="Cambiar foto"
              aria-label="Cambiar foto"
              style={{ position: "relative" }}
            >
              <div
                className="glow-neg-stylist-avatar"
                style={{
                  background: stylist.color || "var(--glow-brand)",
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                }}
              >
                {uploadingAvatar ? (
                  <Loader2 className="glow-spinner-sm" style={{ color: "#fff" }} />
                ) : stylist.avatar_url ? (
                  <img src={stylist.avatar_url} alt={stylist.name} />
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{stylist.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="glow-neg-avatar-edit-ic">
                <Camera style={{ width: 10, height: 10 }} />
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleAvatarFile(e.target.files?.[0])}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 16, fontWeight: 700, color: "var(--glow-ink)" }}>
                  {stylist.name}
                </strong>
                {stylist.is_active ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--glow-ok-ink)",
                      background: "rgba(34, 197, 94, 0.1)",
                      padding: "2px 7px",
                      borderRadius: 999,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "currentColor",
                      }}
                    />
                    Activo
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--glow-ink-3)",
                      background: "var(--glow-sunk)",
                      padding: "2px 7px",
                      borderRadius: 999,
                    }}
                  >
                    Inactivo
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: "var(--glow-ink-3)" }}>
                Ficha de gestión del profesional
              </span>
            </div>
          </div>

          <button className="glow-icon-btn" onClick={onClose} type="button" aria-label="Cerrar">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Barra de Pestañas Fijas Superiores */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 2,
            padding: "8px 16px",
            background: "var(--glow-sunk)",
            borderBottom: "1px solid var(--glow-line)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "schedule" ? "var(--glow-surface)" : "transparent",
              color: activeTab === "schedule" ? "var(--glow-ink)" : "var(--glow-ink-3)",
              fontWeight: activeTab === "schedule" ? 700 : 500,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === "schedule" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Clock style={{ width: 14, height: 14 }} />
            <span>Horario y Ausencias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("performance")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "performance" ? "var(--glow-surface)" : "transparent",
              color: activeTab === "performance" ? "var(--glow-ink)" : "var(--glow-ink-3)",
              fontWeight: activeTab === "performance" ? 700 : 500,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === "performance" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <TrendingUp style={{ width: 14, height: 14 }} />
            <span>Rendimiento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "profile" ? "var(--glow-surface)" : "transparent",
              color: activeTab === "profile" ? "var(--glow-ink)" : "var(--glow-ink-3)",
              fontWeight: activeTab === "profile" ? 700 : 500,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === "profile" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <UserCog style={{ width: 14, height: 14 }} />
            <span>Perfil</span>
          </button>
        </div>

        {/* Cuerpo del Drawer (Scrollable por pestaña) */}
        <div
          className="glow-neg-drawer-body"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* ═════════ TAB 1: HORARIOS Y AUSENCIAS ═════════ */}
          {activeTab === "schedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Sección Horario Semanal */}
              <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "rgba(34, 64, 139, 0.08)",
                        color: "var(--glow-brand)",
                      }}
                    >
                      <Clock style={{ width: 15, height: 15 }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--glow-ink)" }}>
                        Jornada Semanal
                      </h4>
                      <span style={{ fontSize: 12, color: "var(--glow-ink-3)" }}>
                        Horas en las que {stylist.name} recibe reservas
                      </span>
                    </div>
                  </div>

                  {!usesSalonHours && !editingSchedule && (
                    <button
                      className="glow-btn glow-btn--sm"
                      onClick={() => setEditingSchedule(true)}
                      type="button"
                      style={{ gap: 5, fontSize: 12 }}
                    >
                      <Pencil style={{ width: 12, height: 12 }} /> Editar turnos
                    </button>
                  )}
                </div>

                {/* Selector de origen del horario: Salón vs Propio */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 4,
                    background: "var(--glow-sunk)",
                    padding: 4,
                    borderRadius: 10,
                    border: "1px solid var(--glow-line)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSchedule && usesSalonHours) {
                        setEditingSchedule(false);
                      } else if (!usesSalonHours) {
                        setConfirmSalonHours(true);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: usesSalonHours && !editingSchedule ? "var(--glow-surface)" : "transparent",
                      color: usesSalonHours && !editingSchedule ? "var(--glow-ink)" : "var(--glow-ink-3)",
                      fontWeight: usesSalonHours && !editingSchedule ? 700 : 500,
                      fontSize: 12.5,
                      cursor: "pointer",
                      boxShadow: usesSalonHours && !editingSchedule ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <Store style={{ width: 13, height: 13 }} />
                    <span>Sigue horario del salón</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (usesSalonHours && !editingSchedule) setEditingSchedule(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: !usesSalonHours || editingSchedule ? "var(--glow-surface)" : "transparent",
                      color: !usesSalonHours || editingSchedule ? "var(--glow-ink)" : "var(--glow-ink-3)",
                      fontWeight: !usesSalonHours || editingSchedule ? 700 : 500,
                      fontSize: 12.5,
                      cursor: "pointer",
                      boxShadow: !usesSalonHours || editingSchedule ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <UserCog style={{ width: 13, height: 13 }} />
                    <span>Horario personalizado</span>
                  </button>
                </div>

                {editingSchedule ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      border: "1px solid var(--glow-line)",
                      background: "var(--glow-surface)",
                    }}
                  >
                    <InlineScheduleEditor
                      tenantId={tenantId}
                      stylistId={stylistId}
                      onSaved={() => {
                        setEditingSchedule(false);
                        setSchedule(null);
                        loadSchedule();
                        onChanged();
                      }}
                      onDiscard={() => setEditingSchedule(false)}
                    />
                  </div>
                ) : (
                  <>
                    {usesSalonHours && (
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: "rgba(34, 64, 139, 0.04)",
                          border: "1px solid rgba(34, 64, 139, 0.1)",
                          fontSize: 12.5,
                          color: "var(--glow-brand)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <span>Este profesional hereda el horario general del local.</span>
                        <button
                          type="button"
                          onClick={() => setEditingSchedule(true)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--glow-brand)",
                            fontWeight: 700,
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Personalizar turnos →
                        </button>
                      </div>
                    )}

                    {schedule === null ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                        <Loader2 className="glow-spinner-sm" />
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          border: "1px solid var(--glow-line)",
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        {orderedSchedule.map(({ value, label, row }) => {
                          const working = row?.is_working && row.start_time && row.end_time;
                          return (
                            <div
                              key={value}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "9px 14px",
                                borderTop: value !== 1 ? "1px solid var(--glow-line)" : "none",
                                background: working ? "var(--glow-surface)" : "var(--glow-sunk)",
                                fontSize: 13,
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "var(--glow-ink)" }}>
                                {label}
                              </span>
                              {working ? (
                                <span
                                  style={{
                                    fontVariantNumeric: "tabular-nums",
                                    color: "var(--glow-ink)",
                                    fontWeight: 600,
                                  }}
                                >
                                  {hhmm(row!.start_time)} – {hhmm(row!.end_time)}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 12,
                                    color: "var(--glow-ink-3)",
                                  }}
                                >
                                  <Moon style={{ width: 11, height: 11 }} /> Descansa
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Separador sutil */}
              <div style={{ height: 1, background: "var(--glow-line)" }} />

              {/* Sección Ausencias y Vacaciones */}
              <section id="stylist-absences-section">
                <StylistAbsences
                  tenantId={tenantId}
                  stylistId={stylistId}
                  initialAdding={autoOpenAddAbsence}
                  onChanged={onChanged}
                />
              </section>
            </div>
          )}

          {/* ═════════ TAB 2: RENDIMIENTO Y COMISIONES ═════════ */}
          {activeTab === "performance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* KPIs del mes */}
              <section>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--glow-ink)", marginBottom: 10 }}>
                  Actividad este mes
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--glow-line)",
                      background: "var(--glow-surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: "var(--glow-ink-3)" }}>Citas atendidas</span>
                    <strong style={{ fontSize: 20, fontWeight: 700, color: "var(--glow-ink)" }}>
                      {bookingsMonth}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--glow-line)",
                      background: "var(--glow-surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: "var(--glow-ink-3)" }}>Facturación generada</span>
                    <strong style={{ fontSize: 20, fontWeight: 700, color: "var(--glow-ink)" }}>
                      {Math.round(revenueMonth).toLocaleString("es-ES")}€
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--glow-line)",
                      background: "var(--glow-surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      gridColumn: "1 / -1",
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: "var(--glow-ink-3)" }}>Comisión a pagar este mes</span>
                    <strong
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "var(--glow-ok-ink)",
                      }}
                    >
                      {earnings}€
                    </strong>
                  </div>
                </div>
              </section>

              {/* Configuración de Comisión */}
              <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "rgba(34, 64, 139, 0.08)",
                      color: "var(--glow-brand)",
                    }}
                  >
                    <Percent style={{ width: 14, height: 14 }} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--glow-ink)" }}>
                    Regla de Comisión
                  </h4>
                </div>

                <div className="glow-neg-form-row">
                  <div className="glow-mkt-chip-row">
                    <button
                      className={`glow-mkt-chip${commission.commission_type === "percentage" ? " on" : ""}`}
                      onClick={() => {
                        setCommission({ ...commission, commission_type: "percentage" });
                        setCommissionDirty(true);
                      }}
                      type="button"
                    >
                      % de lo facturado
                    </button>
                    <button
                      className={`glow-mkt-chip${commission.commission_type === "fixed" ? " on" : ""}`}
                      onClick={() => {
                        setCommission({ ...commission, commission_type: "fixed" });
                        setCommissionDirty(true);
                      }}
                      type="button"
                    >
                      € fijo por cita
                    </button>
                  </div>
                </div>

                {commission.commission_type === "percentage" ? (
                  <div className="glow-neg-form-row">
                    <div className="glow-mkt-chip-row">
                      {COMMISSION_PRESETS.map((p) => (
                        <button
                          key={p}
                          className={`glow-mkt-chip${commission.commission_percentage === p ? " on" : ""}`}
                          onClick={() => {
                            setCommission({ ...commission, commission_percentage: p });
                            setCommissionDirty(true);
                          }}
                          type="button"
                        >
                          {p}%
                        </button>
                      ))}
                      <div className="glow-neg-input-suffix sm">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={commission.commission_percentage}
                          onChange={(e) => {
                            setCommission({
                              ...commission,
                              commission_percentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                            });
                            setCommissionDirty(true);
                          }}
                        />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glow-neg-form-row">
                    <div className="glow-neg-input-suffix">
                      <input
                        type="number"
                        min="0"
                        value={commission.commission_fixed}
                        onChange={(e) => {
                          setCommission({
                            ...commission,
                            commission_fixed: Math.max(0, parseFloat(e.target.value) || 0),
                          });
                          setCommissionDirty(true);
                        }}
                      />
                      <span>€</span>
                    </div>
                  </div>
                )}

                {commissionDirty && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="glow-btn glow-btn--primary"
                      onClick={saveCommission}
                      disabled={saving}
                      type="button"
                    >
                      {saving && <Loader2 className="glow-spinner-sm" />}
                      Guardar comisión
                    </button>
                  </div>
                )}
              </section>

              {/* Últimas Citas */}
              <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <History style={{ width: 15, height: 15, color: "var(--glow-ink-3)" }} />
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--glow-ink)" }}>
                    Últimas citas registradas
                  </h4>
                </div>

                {recentBookings.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: "var(--glow-ink-3)", margin: 0 }}>
                    Sin citas recientes para este profesional.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid var(--glow-line)",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    {recentBookings.map((b) => {
                      const svc = firstServiceName(b.services);
                      let dateLabel = b.Fecha;
                      try {
                        dateLabel = format(parseISO(b.Fecha), "d MMM", { locale: es });
                      } catch {
                        // ignore
                      }
                      return (
                        <div
                          key={b.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--glow-line)",
                            background: "var(--glow-surface)",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 13, color: "var(--glow-ink)", display: "block" }}>
                              {b.customer_name ?? "Cliente"}
                            </strong>
                            {svc && <span style={{ fontSize: 12, color: "var(--glow-ink-3)" }}>{svc}</span>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--glow-ink)" }}>
                              {dateLabel}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--glow-ink-3)", display: "block" }}>
                              {hhmm(b.Hora)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ═════════ TAB 3: PERFIL Y AJUSTES ═════════ */}
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glow-neg-form-row">
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--glow-ink)" }}>Nombre</label>
                <input
                  type="text"
                  value={stylist.name}
                  onChange={(e) => setStylist({ ...stylist, name: e.target.value })}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== stylist.name) updateStylist({ name: v });
                  }}
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid var(--glow-line)",
                    fontSize: 13,
                  }}
                />
              </div>

              <div className="glow-neg-form-row">
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--glow-ink)" }}>
                  Color identificativo en la agenda
                </label>
                <div className="glow-neg-color-row">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`glow-neg-color-dot${stylist.color === c ? " on" : ""}`}
                      style={{ background: c }}
                      onClick={() => updateStylist({ color: c })}
                      type="button"
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div className="glow-neg-form-row glow-neg-form-toggle">
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--glow-ink)" }}>
                    Profesional activo
                  </label>
                  <p className="glow-neg-help" style={{ margin: 0, fontSize: 12 }}>
                    Si lo desactivas, deja de estar disponible para citas online.
                  </p>
                </div>
                <Switch checked={stylist.is_active} onCheckedChange={(v) => updateStylist({ is_active: v })} />
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--glow-line)" }}>
                <button
                  className="glow-btn glow-btn--danger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  type="button"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} /> Eliminar profesional del equipo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmSalonHours} onOpenChange={setConfirmSalonHours}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Volver al horario general del salón?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará el horario propio de {stylist.name} y pasará a seguir los mismos días y horas
              que el negocio. Las citas ya reservadas no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={revertToSalonHours}>Usar horario del salón</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {stylist.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará del equipo y dejará de aparecer en la agenda y reservas online. Su historial de
              citas y cobros pasados se conservará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default StylistDrawer;
