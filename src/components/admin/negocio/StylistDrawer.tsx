import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  X,
  Users,
  Clock,
  Percent,
  Settings,
  Calendar,
  Euro,
  Star,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { StylistScheduleEditor } from "../StylistScheduleEditor";

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
  Cliente: string | null;
  services: unknown;
}

type Tab = "resumen" | "horario" | "comision" | "ajustes";

const PRESET_COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#06B6D4", "#84CC16"];

const firstServiceName = (services: unknown): string | null => {
  if (!Array.isArray(services) || services.length === 0) return null;
  const s = services[0] as { name?: string } | string;
  if (typeof s === "string") return s;
  return s?.name ?? null;
};

export function StylistDrawer({ tenantId, stylistId, onClose, onChanged }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("resumen");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [commission, setCommission] = useState<Commission>({
    id: null,
    commission_type: "percentage",
    commission_percentage: 50,
    commission_fixed: 0,
  });
  const [revenueMonth, setRevenueMonth] = useState(0);
  const [bookingsMonth, setBookingsMonth] = useState(0);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<BookingRow[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const [stylRes, commRes, txRes, bookingsRes, reviewsRes, recentRes] = await Promise.all([
        supabase.from("tenant_stylists").select("*").eq("id", stylistId).single(),
        supabase
          .from("stylist_commissions")
          .select("*")
          .eq("stylist_id", stylistId)
          .maybeSingle(),
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
          .gte("Fecha", format(monthStart, "yyyy-MM-dd"))
          .lte("Fecha", format(monthEnd, "yyyy-MM-dd")),
        (supabase
          .from("reviews") as any)
          .select("rating")
          .eq("tenant_id", tenantId)
          .eq("stylist_id", stylistId)
          .eq("approved", true),
        supabase
          .from("bookings")
          .select("id, Fecha, Hora, Cliente, services")
          .eq("tenant_id", tenantId)
          .order("Fecha", { ascending: false })
          .order("Hora", { ascending: false })
          .limit(20),
      ]);

      if (cancelled) return;

      const st = stylRes.data as Stylist | null;
      if (st) setStylist(st);

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

      // Filter bookings for this stylist by name match (legacy bookings store stylist name)
      const allRecent = (recentRes.data ?? []) as BookingRow[];
      const stylName = st?.name;
      const recentForStylist = allRecent.filter(
        (b) =>
          (b as unknown as { stylist: string | null }).stylist === stylName
      );
      setRecentBookings(recentForStylist.slice(0, 6));

      // bookings count
      const stylName2 = st?.name;
      if (stylName2) {
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("stylist", stylName2)
          .gte("Fecha", format(monthStart, "yyyy-MM-dd"))
          .lte("Fecha", format(monthEnd, "yyyy-MM-dd"));
        if (!cancelled) setBookingsMonth(count ?? 0);
      }

      const reviews = (reviewsRes.data ?? []) as Array<{ rating: number }>;
      setReviewsCount(reviews.length);
      setRatingAvg(reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0);

      setLoading(false);
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
      const { error } = await supabase
        .from("stylist_commissions")
        .update(payload)
        .eq("id", commission.id);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("stylist_commissions")
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setCommission((c) => ({ ...c, id: (data as { id: string } | null)?.id ?? null }));
    }
    toast({ title: "Comisión guardada" });
    onChanged();
  };

  const handleDelete = async () => {
    if (!stylist) return;
    if (!confirm(`¿Eliminar a ${stylist.name}? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    const { error } = await supabase.from("tenant_stylists").delete().eq("id", stylist.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estilista eliminado" });
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

  return (
    <div className="gp-neg-drawer-backdrop" onClick={onClose}>
      <div className="gp-neg-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gp-neg-drawer-h">
          <div className="gp-neg-drawer-h-left">
            <div
              className="gp-neg-stylist-avatar"
              style={{ background: stylist.color || "var(--gp-accent)", width: 44, height: 44 }}
            >
              {stylist.avatar_url ? (
                <img src={stylist.avatar_url} alt={stylist.name} />
              ) : (
                <span>{stylist.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <strong>{stylist.name}</strong>
              <span className="gp-neg-drawer-sub">
                {stylist.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <button className="gp-icon-btn" onClick={onClose} type="button">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="gp-neg-drawer-tabs">
          {(
            [
              { id: "resumen" as Tab, label: "Resumen", icon: Users },
              { id: "horario" as Tab, label: "Horario", icon: Clock },
              { id: "comision" as Tab, label: "Comisión", icon: Percent },
              { id: "ajustes" as Tab, label: "Ajustes", icon: Settings },
            ]
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`gp-neg-drawer-tab${tab === t.id ? " on" : ""}`}
                onClick={() => setTab(t.id)}
                type="button"
              >
                <Icon style={{ width: 13, height: 13 }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="gp-neg-drawer-body">
          {tab === "resumen" && (
            <div className="gp-neg-drawer-section">
              <div className="gp-neg-mini-kpis">
                <div className="gp-neg-mini-kpi">
                  <Calendar />
                  <strong>{bookingsMonth}</strong>
                  <span>Citas mes</span>
                </div>
                <div className="gp-neg-mini-kpi">
                  <Euro />
                  <strong>{Math.round(revenueMonth).toLocaleString("es-ES")}€</strong>
                  <span>Ingresos</span>
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

              <h4 className="gp-neg-section-h">Últimas citas</h4>
              {recentBookings.length === 0 ? (
                <p className="gp-neg-empty-text">Sin citas recientes.</p>
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
                          <span>{b.Hora?.slice(0, 5)}</span>
                        </div>
                        <div className="gp-neg-recent-info">
                          <strong>{b.Cliente ?? "Cliente"}</strong>
                          {svc && <span>{svc}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "horario" && (
            <div className="gp-neg-drawer-section">
              <p className="gp-neg-help">
                Define horario propio o usa el del salón. Edita en panel completo.
              </p>
              <button
                className="gp-btn primary"
                onClick={() => setScheduleOpen(true)}
                type="button"
              >
                <Clock style={{ width: 14, height: 14 }} /> Editar horario
              </button>
            </div>
          )}

          {tab === "comision" && (
            <div className="gp-neg-drawer-section">
              <p className="gp-neg-help">
                Define cuánto cobra {stylist.name} por sus servicios.
              </p>
              <div className="gp-neg-form-row">
                <label>Tipo</label>
                <div className="gp-mkt-chip-row">
                  <button
                    className={`gp-mkt-chip${commission.commission_type === "percentage" ? " on" : ""}`}
                    onClick={() => setCommission({ ...commission, commission_type: "percentage" })}
                    type="button"
                  >
                    % Porcentaje
                  </button>
                  <button
                    className={`gp-mkt-chip${commission.commission_type === "fixed" ? " on" : ""}`}
                    onClick={() => setCommission({ ...commission, commission_type: "fixed" })}
                    type="button"
                  >
                    € Fijo por cita
                  </button>
                </div>
              </div>
              {commission.commission_type === "percentage" ? (
                <div className="gp-neg-form-row">
                  <label>Porcentaje</label>
                  <div className="gp-neg-input-suffix">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={commission.commission_percentage}
                      onChange={(e) =>
                        setCommission({
                          ...commission,
                          commission_percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <span>%</span>
                  </div>
                </div>
              ) : (
                <div className="gp-neg-form-row">
                  <label>Fijo por cita</label>
                  <div className="gp-neg-input-suffix">
                    <input
                      type="number"
                      min="0"
                      value={commission.commission_fixed}
                      onChange={(e) =>
                        setCommission({
                          ...commission,
                          commission_fixed: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <span>€</span>
                  </div>
                </div>
              )}

              <div className="gp-neg-earn-preview">
                <div>
                  <span>Ingresos este mes</span>
                  <strong>{Math.round(revenueMonth).toLocaleString("es-ES")}€</strong>
                </div>
                <div>
                  <span>A pagar</span>
                  <strong className="gp-neg-earn-big">{earnings}€</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="gp-btn primary"
                  onClick={saveCommission}
                  disabled={saving}
                  type="button"
                >
                  {saving && <Loader2 className="gp-spinner-sm" />}
                  Guardar
                </button>
              </div>
            </div>
          )}

          {tab === "ajustes" && (
            <div className="gp-neg-drawer-section">
              <div className="gp-neg-form-row">
                <label>Nombre</label>
                <input
                  type="text"
                  value={stylist.name}
                  onChange={(e) => setStylist({ ...stylist, name: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== stylist.name) {
                      updateStylist({ name: e.target.value.trim() });
                    }
                  }}
                />
              </div>
              <div className="gp-neg-form-row">
                <label>Color</label>
                <div className="gp-neg-color-row">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`gp-neg-color-dot${stylist.color === c ? " on" : ""}`}
                      style={{ background: c }}
                      onClick={() => updateStylist({ color: c })}
                      type="button"
                    />
                  ))}
                </div>
              </div>
              <div className="gp-neg-form-row gp-neg-form-toggle">
                <label>Estilista activo</label>
                <input
                  type="checkbox"
                  checked={stylist.is_active}
                  onChange={(e) => updateStylist({ is_active: e.target.checked })}
                />
              </div>

              <div className="gp-neg-danger-zone">
                <h4>Zona de peligro</h4>
                <button className="gp-btn danger" onClick={handleDelete} disabled={saving} type="button">
                  <Trash2 style={{ width: 14, height: 14 }} /> Eliminar estilista
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {scheduleOpen && (
        <StylistScheduleEditor
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          stylistId={stylistId}
          stylistName={stylist.name}
          tenantId={tenantId}
        />
      )}
    </div>
  );
}

export default StylistDrawer;
