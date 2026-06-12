import { useEffect, useMemo, useRef, useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SeasonalHoursManager } from "../SeasonalHoursManager";
import { InlineScheduleEditor } from "./InlineScheduleEditor";

/**
 * Ficha del profesional — una sola página scrolleable, sin pestañas.
 * Orden: lo que consultas a diario arriba (mes, horario, comisión),
 * lo que tocas una vez al final (perfil, eliminar).
 */

interface Props {
  tenantId: string;
  stylistId: string;
  onClose: () => void;
  onChanged: () => void;
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

const PRESET_COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#06B6D4", "#84CC16"];
const COMMISSION_PRESETS = [30, 40, 50, 60];
/** Lunes primero, como InlineScheduleEditor. */
const WEEK_DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const firstServiceName = (services: unknown): string | null => {
  if (!Array.isArray(services) || services.length === 0) return null;
  const s = services[0] as { name?: string } | string;
  if (typeof s === "string") return s;
  return s?.name ?? null;
};

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export function StylistDrawer({ tenantId, stylistId, onClose, onChanged }: Props) {
  const { toast } = useToast();
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
  /** true mientras se edita el horario propio inline. */
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [seasonalOpen, setSeasonalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSalonHours, setConfirmSalonHours] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

      // El nombre hace falta para filtrar bookings (guardan el nombre, no el id)
      const { data: st } = await supabase.from("tenant_stylists").select("*").eq("id", stylistId).single();
      if (cancelled || !st) {
        setLoading(false);
        return;
      }
      setStylist(st as Stylist);
      const name = (st as Stylist).name;

      const [commRes, txRes, countRes, reviewsRes, recentRes] = await Promise.all([
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
        (supabase.from("reviews") as any)
          .select("rating")
          .eq("tenant_id", tenantId)
          .eq("stylist_id", stylistId)
          .eq("approved", true),
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

      const reviews = (reviewsRes.data ?? []) as Array<{ rating: number }>;
      setReviewsCount(reviews.length);
      setRatingAvg(reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0);

      setLoading(false);
      loadSchedule();
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /** Borra el horario propio y vuelve al del salón (con confirmación previa). */
  const revertToSalonHours = async () => {
    setSaving(true);
    const { error } = await supabase.from("stylist_business_hours").delete().eq("stylist_id", stylistId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo restaurar el horario", variant: "destructive" });
      return;
    }
    toast({ title: "Horario del salón", description: `${stylist?.name} vuelve a seguir el horario del negocio.` });
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
      <div className="gp-neg-drawer-backdrop" onClick={onClose}>
        <div className="gp-neg-drawer" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 className="gp-spinner" />
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
    <div className="gp-neg-drawer-backdrop" onClick={onClose}>
      <div className="gp-neg-drawer" onClick={(e) => e.stopPropagation()}>
        {/* ── Cabecera fija ── */}
        <div className="gp-neg-drawer-h">
          <div className="gp-neg-drawer-h-left">
            <button
              className="gp-neg-avatar-edit"
              onClick={() => fileRef.current?.click()}
              type="button"
              title="Cambiar foto"
              aria-label="Cambiar foto"
            >
              <div
                className="gp-neg-stylist-avatar"
                style={{ background: stylist.color || "var(--gp-accent)", width: 48, height: 48 }}
              >
                {uploadingAvatar ? (
                  <Loader2 className="gp-spinner-sm" style={{ color: "#fff" }} />
                ) : stylist.avatar_url ? (
                  <img src={stylist.avatar_url} alt={stylist.name} />
                ) : (
                  <span>{stylist.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="gp-neg-avatar-edit-ic">
                <Camera style={{ width: 11, height: 11 }} />
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
              <strong>{stylist.name}</strong>
              <span className="gp-neg-drawer-sub">
                {stylist.is_active ? (
                  <span className="gp-badge ok">
                    <span className="pip" style={{ background: "currentColor" }} />
                    Activo
                  </span>
                ) : (
                  <span className="gp-badge neutral">Inactivo</span>
                )}
              </span>
            </div>
          </div>
          <button className="gp-icon-btn" onClick={onClose} type="button" aria-label="Cerrar">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* ── Contenido: un solo scroll ── */}
        <div className="gp-neg-drawer-body gp-team-detail">
          {/* Este mes */}
          <section>
            <div className="gp-neg-mini-kpis">
              <div className="gp-neg-mini-kpi">
                <Calendar />
                <strong>{bookingsMonth}</strong>
                <span>Citas mes</span>
              </div>
              <div className="gp-neg-mini-kpi">
                <Euro />
                <strong>{Math.round(revenueMonth).toLocaleString("es-ES")}€</strong>
                <span>Facturado</span>
              </div>
              <div className="gp-neg-mini-kpi">
                <Star />
                <strong>{ratingAvg > 0 ? ratingAvg.toFixed(1) : "—"}</strong>
                <span>{reviewsCount} reseñas</span>
              </div>
              <div className="gp-neg-mini-kpi">
                <Percent />
                <strong>{earnings}€</strong>
                <span>A pagar</span>
              </div>
            </div>
          </section>

          {/* Horario */}
          <section>
            <div className="gp-team-sec-h">
              <h4 className="gp-neg-section-h">
                <Clock /> Horario semanal
              </h4>
              {!usesSalonHours && !editingSchedule && (
                <button className="gp-btn sm" onClick={() => setEditingSchedule(true)} type="button">
                  <Pencil style={{ width: 12, height: 12 }} /> Editar
                </button>
              )}
            </div>

            {/* De dónde sale el horario: del salón o propio */}
            <div className="gp-team-seg" role="radiogroup" aria-label="Origen del horario">
              <button
                className={`gp-team-seg-opt${usesSalonHours && !editingSchedule ? " on" : ""}`}
                onClick={() => {
                  if (editingSchedule && usesSalonHours) {
                    // Estaba creando uno propio sin guardar: basta con descartar
                    setEditingSchedule(false);
                  } else if (!usesSalonHours) {
                    setConfirmSalonHours(true);
                  }
                }}
                role="radio"
                aria-checked={usesSalonHours && !editingSchedule}
                type="button"
              >
                <Store style={{ width: 13, height: 13 }} />
                Del salón
              </button>
              <button
                className={`gp-team-seg-opt${!usesSalonHours || editingSchedule ? " on" : ""}`}
                onClick={() => {
                  if (usesSalonHours && !editingSchedule) setEditingSchedule(true);
                }}
                role="radio"
                aria-checked={!usesSalonHours || editingSchedule}
                type="button"
              >
                <UserCog style={{ width: 13, height: 13 }} />
                Propio
              </button>
            </div>

            {editingSchedule ? (
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
            ) : (
              <>
                {usesSalonHours && (
                  <p className="gp-neg-help" style={{ margin: 0 }}>
                    Sigue el horario del negocio: si cambias el del salón, el suyo cambia también. Toca
                    «Propio» para personalizarlo.
                  </p>
                )}
                {schedule === null ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                    <Loader2 className="gp-spinner-sm" />
                  </div>
                ) : (
                  <div className="gp-neg-sched">
                    {orderedSchedule.map(({ value, label, row }) => {
                      const working = row?.is_working && row.start_time && row.end_time;
                      return (
                        <div key={value} className={`gp-neg-sched-row${working ? "" : " off"}`}>
                          <span className="gp-neg-sched-day">{label}</span>
                          {working ? (
                            <span className="gp-neg-sched-hours">
                              {hhmm(row!.start_time)} – {hhmm(row!.end_time)}
                            </span>
                          ) : (
                            <span className="gp-neg-sched-rest">
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

            <button
              className="gp-btn sm"
              style={{ alignSelf: "flex-start" }}
              onClick={() => setSeasonalOpen(true)}
              type="button"
            >
              <CalendarOff style={{ width: 12, height: 12 }} /> Vacaciones y festivos
            </button>
          </section>

          {/* Comisión */}
          <section>
            <div className="gp-team-sec-h">
              <h4 className="gp-neg-section-h">
                <Percent /> Comisión
              </h4>
            </div>
            <div className="gp-neg-form-row">
              <div className="gp-mkt-chip-row">
                <button
                  className={`gp-mkt-chip${commission.commission_type === "percentage" ? " on" : ""}`}
                  onClick={() => {
                    setCommission({ ...commission, commission_type: "percentage" });
                    setCommissionDirty(true);
                  }}
                  type="button"
                >
                  % de lo facturado
                </button>
                <button
                  className={`gp-mkt-chip${commission.commission_type === "fixed" ? " on" : ""}`}
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
              <div className="gp-neg-form-row">
                <div className="gp-mkt-chip-row">
                  {COMMISSION_PRESETS.map((p) => (
                    <button
                      key={p}
                      className={`gp-mkt-chip${commission.commission_percentage === p ? " on" : ""}`}
                      onClick={() => {
                        setCommission({ ...commission, commission_percentage: p });
                        setCommissionDirty(true);
                      }}
                      type="button"
                    >
                      {p}%
                    </button>
                  ))}
                  <div className="gp-neg-input-suffix sm">
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
              <div className="gp-neg-form-row">
                <div className="gp-neg-input-suffix">
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

            <div className="gp-neg-earn-preview">
              <div>
                <span>{commission.commission_type === "percentage" ? "Facturado este mes" : "Citas este mes"}</span>
                <strong>
                  {commission.commission_type === "percentage"
                    ? `${Math.round(revenueMonth).toLocaleString("es-ES")}€`
                    : bookingsMonth}
                </strong>
              </div>
              <div>
                <span>A pagar</span>
                <strong className="gp-neg-earn-big">{earnings}€</strong>
              </div>
            </div>

            {commissionDirty && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="gp-btn primary" onClick={saveCommission} disabled={saving} type="button">
                  {saving && <Loader2 className="gp-spinner-sm" />}
                  Guardar comisión
                </button>
              </div>
            )}
          </section>

          {/* Últimas citas */}
          <section>
            <div className="gp-team-sec-h">
              <h4 className="gp-neg-section-h">
                <History /> Últimas citas
              </h4>
            </div>
            {recentBookings.length === 0 ? (
              <p className="gp-neg-empty-text">Sin citas todavía.</p>
            ) : (
              <div className="gp-neg-recent">
                {recentBookings.map((b) => {
                  const svc = firstServiceName(b.services);
                  let dateLabel = "";
                  try {
                    dateLabel = format(parseISO(b.Fecha), "d MMM", { locale: es });
                  } catch {
                    dateLabel = b.Fecha;
                  }
                  return (
                    <div key={b.id} className="gp-neg-recent-row">
                      <div className="gp-neg-recent-date">
                        <strong>{dateLabel}</strong>
                        <span>{hhmm(b.Hora)}</span>
                      </div>
                      <div className="gp-neg-recent-info">
                        <strong>{b.customer_name ?? "Cliente"}</strong>
                        {svc && <span>{svc}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Perfil */}
          <section>
            <div className="gp-team-sec-h">
              <h4 className="gp-neg-section-h">
                <UserCog /> Perfil
              </h4>
            </div>
            <div className="gp-neg-form-row">
              <label>Nombre</label>
              <input
                type="text"
                value={stylist.name}
                onChange={(e) => setStylist({ ...stylist, name: e.target.value })}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== stylist.name) updateStylist({ name: v });
                }}
              />
            </div>
            <div className="gp-neg-form-row">
              <label>Color en la agenda</label>
              <div className="gp-neg-color-row">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`gp-neg-color-dot${stylist.color === c ? " on" : ""}`}
                    style={{ background: c }}
                    onClick={() => updateStylist({ color: c })}
                    type="button"
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="gp-neg-form-row gp-neg-form-toggle">
              <div>
                <label>Activo</label>
                <p className="gp-neg-help" style={{ margin: 0 }}>
                  Los inactivos no aparecen al reservar.
                </p>
              </div>
              <Switch checked={stylist.is_active} onCheckedChange={(v) => updateStylist({ is_active: v })} />
            </div>

            <div className="gp-neg-danger-zone">
              <button className="gp-btn danger" onClick={() => setConfirmDelete(true)} disabled={saving} type="button">
                <Trash2 style={{ width: 14, height: 14 }} /> Eliminar del equipo
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Vacaciones y festivos del profesional */}
      <Dialog open={seasonalOpen} onOpenChange={setSeasonalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Vacaciones y festivos</DialogTitle>
            <DialogDescription>
              Periodos en los que {stylist.name} no acepta reservas (vacaciones, bajas, festivos propios).
            </DialogDescription>
          </DialogHeader>
          <SeasonalHoursManager tenantId={tenantId} stylistId={stylistId} stylistName={stylist.name} compact />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmSalonHours} onOpenChange={setConfirmSalonHours}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Volver al horario del salón?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará el horario propio de {stylist.name} y pasará a seguir el horario general del
              negocio. Las citas ya reservadas no se tocan.
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
              Se borra del equipo y deja de aparecer al reservar. Sus citas e historial no se borran. Esta acción
              no se puede deshacer.
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
