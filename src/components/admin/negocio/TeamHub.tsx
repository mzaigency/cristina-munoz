import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Plus,
  Search,
  Calendar,
  Euro,
  Loader2,
  ChevronRight,
  Moon,
  Wallet,
} from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { StylistDrawer } from "./StylistDrawer";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PlanUsageBar } from "@/components/admin/PlanUsageBar";
import { UpgradePrompt } from "@/components/admin/UpgradePrompt";

/**
 * Equipo — lista tipo contactos, pensada para equipos de 1-10 personas.
 * Cada fila responde de un vistazo: ¿trabaja hoy? ¿cuánto lleva este mes?
 * ¿cuánto le tengo que pagar? El detalle vive en el drawer.
 */

interface TeamHubProps {
  tenantId: string;
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

interface StylistMetrics {
  bookings: number;
  revenue: number;
  commissionPct: number | null;
  commissionFixed: number | null;
  commissionType: string | null;
}

interface TodayHours {
  working: boolean;
  start: string | null;
  end: string | null;
}

const PRESET_COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#06B6D4", "#84CC16"];

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

function earningsFor(m: StylistMetrics): number | null {
  if (m.commissionType === "percentage"&& m.commissionPct != null) { return Math.round((m.revenue * m.commissionPct) / 100); } if (m.commissionType ==="fixed" && m.commissionFixed != null) {
    return Math.round(m.commissionFixed * m.bookings);
  }
  return null;
}

export function TeamHub({ tenantId }: TeamHubProps) {
  const { toast } = useToast();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [metrics, setMetrics] = useState<Map<string, StylistMetrics>>(new Map());
  const [today, setToday] = useState<Map<string, TodayHours>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const {
    maxStylists,
    currentStylists,
    canAddStylist,
    isOverLimit,
    planSlug,
    getUpgradePlanForLimit,
    refetch: refetchLimits,
  } = usePlanLimits(tenantId);

  const load = async () => {
    setLoading(true);
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const todayDow = now.getDay();

    const [stylistsRes, txRes, bookingsRes, commissionsRes, ownHoursRes, salonHoursRes] = await Promise.all([
      supabase
        .from("tenant_stylists")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("is_active", { ascending: false })
        .order("name"),
      supabase
        .from("transactions")
        .select("total, stylist_id")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString()),
      supabase
        .from("bookings")
        .select("stylist")
        .eq("tenant_id", tenantId)
        .gte("Fecha", format(monthStart, "yyyy-MM-dd"))
        .lte("Fecha", format(monthEnd, "yyyy-MM-dd")),
      supabase
        .from("stylist_commissions")
        .select("stylist_id, commission_percentage, commission_fixed, commission_type")
        .eq("tenant_id", tenantId),
      supabase
        .from("stylist_business_hours")
        .select("stylist_id, is_working, start_time, end_time")
        .eq("day_of_week", todayDow),
      supabase
        .from("tenant_business_hours")
        .select("is_open, open_time, close_time")
        .eq("tenant_id", tenantId)
        .eq("day_of_week", todayDow)
        .maybeSingle(),
    ]);

    const sts = (stylistsRes.data ?? []) as Stylist[];
    const txs = (txRes.data ?? []) as Array<{ total: number; stylist_id: string | null }>;
    const bookings = (bookingsRes.data ?? []) as Array<{ stylist: string | null }>;
    const commissions = (commissionsRes.data ?? []) as Array<{
      stylist_id: string | null;
      commission_percentage: number | null;
      commission_fixed: number | null;
      commission_type: string | null;
    }>;

    const map = new Map<string, StylistMetrics>();
    sts.forEach((s) =>
      map.set(s.id, { bookings: 0, revenue: 0, commissionPct: null, commissionFixed: null, commissionType: null }),
    );

    txs.forEach((t) => {
      if (!t.stylist_id) return;
      const m = map.get(t.stylist_id);
      if (m) m.revenue += Number(t.total ?? 0);
    });

    const nameToId = new Map(sts.map((s) => [s.name, s.id]));
    bookings.forEach((b) => {
      if (!b.stylist) return;
      const id = nameToId.get(b.stylist);
      if (!id) return;
      const m = map.get(id);
      if (m) m.bookings += 1;
    });

    commissions.forEach((c) => {
      if (!c.stylist_id) return;
      const m = map.get(c.stylist_id);
      if (m) {
        m.commissionPct = c.commission_percentage;
        m.commissionFixed = c.commission_fixed;
        m.commissionType = c.commission_type;
      }
    });

    // Horario de HOY: propio si existe, si no el del salón
    const salonToday = salonHoursRes.data as {
      is_open: boolean;
      open_time: string | null;
      close_time: string | null;
    } | null;
    const ownToday = (ownHoursRes.data ?? []) as Array<{
      stylist_id: string;
      is_working: boolean;
      start_time: string | null;
      end_time: string | null;
    }>;
    const ownMap = new Map(ownToday.map((h) => [h.stylist_id, h]));
    const todayMap = new Map<string, TodayHours>();
    sts.forEach((s) => {
      const own = ownMap.get(s.id);
      if (own) {
        todayMap.set(s.id, { working: own.is_working, start: own.start_time, end: own.end_time });
      } else if (salonToday) {
        todayMap.set(s.id, { working: salonToday.is_open, start: salonToday.open_time, end: salonToday.close_time });
      }
    });

    setStylists(sts);
    setMetrics(map);
    setToday(todayMap);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const term = search.trim().toLowerCase();
  const actives = useMemo(
    () => stylists.filter((s) => s.is_active && (!term || s.name.toLowerCase().includes(term))),
    [stylists, term],
  );
  const inactives = useMemo(
    () => stylists.filter((s) => !s.is_active && (!term || s.name.toLowerCase().includes(term))),
    [stylists, term],
  );

  const teamTotals = useMemo(() => {
    let bookings = 0;
    let toPay = 0;
    stylists.forEach((s) => {
      if (!s.is_active) return;
      const m = metrics.get(s.id);
      if (!m) return;
      bookings += m.bookings;
      toPay += earningsFor(m) ?? 0;
    });
    return { bookings, toPay };
  }, [stylists, metrics]);

  const openCreate = () => {
    // Al límite del plan: upgrade sutil en vez del formulario
    if (!canAddStylist()) {
      setUpgradeOpen(true);
      return;
    }
    const used = new Set(stylists.map((s) => s.color));
    setNewColor(PRESET_COLORS.find((c) => !used.has(c)) ?? PRESET_COLORS[0]);
    setNewName("");
    setCreating(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: "Ponle un nombre", variant: "destructive"}); return; } setSaving(true); const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g, "");
    const { data, error } = await supabase
      .from("tenant_stylists")
      .insert({
        tenant_id: tenantId,
        name: newName.trim(),
        slug,
        color: newColor,
        is_active: true,
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${newName.trim()} ya está en el equipo 🎉` });
    setCreating(false);
    setNewName("");
    await load();
    refetchLimits();
    if (data?.id) setSelectedId(data.id);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  const renderRow = (s: Stylist) => {
    const m = metrics.get(s.id) ?? {
      bookings: 0,
      revenue: 0,
      commissionPct: null,
      commissionFixed: null,
      commissionType: null,
    };
    const pay = earningsFor(m);
    const t = today.get(s.id);

    return (
      <button key={s.id} className="gp-team-row" onClick={() => setSelectedId(s.id)} type="button">
        <div
          className="gp-neg-stylist-avatar gp-team-row-avatar"style={{ background: s.color ||"var(--gp-accent)" }}
        >
          {s.avatar_url ? <img src={s.avatar_url} alt="" /> : <span>{s.name.charAt(0).toUpperCase()}</span>}
        </div>

        <div className="gp-team-row-main">
          <strong>{s.name}</strong>
          {s.is_active ? (
            t ? (
              t.working && t.start && t.end ? (
                <span className="gp-team-today on">
                  Hoy {hhmm(t.start)}–{hhmm(t.end)}
                </span>
              ) : (
                <span className="gp-team-today">
                  <Moon style={{ width: 11, height: 11 }} /> Hoy descansa
                </span>
              )
            ) : (
              <span className="gp-team-today">Sin horario</span>
            )
          ) : (
            <span className="gp-team-today">Inactivo</span>
          )}
        </div>

        <div className="gp-team-row-stats">
          <span className="gp-team-stat">
            <Calendar />
            {m.bookings}
            <small>citas</small>
          </span>
          <span className="gp-team-stat">
            <Euro />
            {Math.round(m.revenue).toLocaleString("es-ES")}
            <small>factura</small>
          </span>
          <span className={`gp-team-stat${pay != null ? " pay":""}`}>
            <Wallet />
            {pay != null ? `${pay.toLocaleString("es-ES")}€` : "—"}
            <small>a pagar</small>
          </span>
        </div>

        <ChevronRight className="gp-team-row-chev" />
      </button>
    );
  };

  return (
    <div className="gp-fade">
      {/* Cabecera */}
      <div className="gp-page-h">
        <div>
          <h2>Equipo</h2>
          <p>Quién trabaja, cuánto produce y cuánto le pagas este mes.</p>
        </div>
        <div className="gp-page-actions"style={{ display:"flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <button className="gp-btn primary sm" onClick={openCreate} type="button">
            <Plus style={{ width: 13, height: 13 }} /> Añadir
          </button>
          {maxStylists < 999 && (
            <PlanUsageBar
              current={currentStylists}
              max={maxStylists}
              label="profesionales"
              className="w-[150px]"
            />
          )}
        </div>
      </div>

      {/* Pasado del límite (p. ej. tras bajar de plan): aviso fino */}
      {isOverLimit("stylists") && (
        <div className="gp-team-overlimit">
          Tienes {currentStylists} profesionales y tu plan incluye {maxStylists}.{" "}
          <button onClick={() => setUpgradeOpen(true)} type="button">
            Mejorar plan
          </button>
        </div>
      )}

      {stylists.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic">
              <Users style={{ width: 24, height: 24 }} />
            </div>
            <h4>Tu equipo, aquí</h4>
            <p>Añade a cada profesional para asignarle citas, horario y comisión.</p>
            <button className="gp-btn primary" style={{ marginTop: 12 }} onClick={openCreate}>
              <Plus style={{ width: 14, height: 14 }} /> Añadir profesional
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Resumen del mes */}
          <div className="gp-team-kpis">
            <div className="gp-team-kpi">
              <span>{actives.length === 1 ? "Profesional activo":"Profesionales activos"}</span>
              <strong>{stylists.filter((s) => s.is_active).length}</strong>
            </div>
            <div className="gp-team-kpi">
              <span>Citas del equipo · mes</span>
              <strong>{teamTotals.bookings}</strong>
            </div>
            <div className="gp-team-kpi pay">
              <span>Total a pagar · mes</span>
              <strong>{teamTotals.toPay.toLocaleString("es-ES")}€</strong>
            </div>
          </div>

          {/* Buscador solo cuando hay equipo grande */}
          {stylists.length > 8 && (
            <div className="gp-mkt-search"style={{ maxWidth: 280, marginBottom: 12 }}> <Search style={{ width: 14, height: 14, color:"var(--gp-muted-c)" }} />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Activos */}
          <div className="gp-team-list">{actives.map(renderRow)}</div>

          {/* Inactivos, discretos al final */}
          {inactives.length > 0 && (
            <>
              <div className="gp-team-divider">Inactivos ({inactives.length})</div>
              <div className="gp-team-list is-off">{inactives.map(renderRow)}</div>
            </>
          )}
        </>
      )}

      {/* Upgrade sutil: solo al intentar añadir estando al límite */}
      <UpgradePrompt
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={planSlug}
        targetPlan={getUpgradePlanForLimit("stylists") || "pro"}
        feature="Más profesionales en tu equipo"
        tenantId={tenantId}
      />

      {/* Drawer de detalle */}
      {selectedId && (
        <StylistDrawer
          tenantId={tenantId}
          stylistId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}

      {/* Alta */}
      {creating && (
        <div className="gp-neg-create-backdrop" onClick={() => !saving && setCreating(false)}>
          <div className="gp-neg-create" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo profesional</h3>
            <label>
              <span>Nombre</span>
              <input
                type="text"value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key ==="Enter" && !saving) handleCreate();
                }}
                placeholder="Ej: Cristina Muñoz"
                autoFocus
              />
            </label>
            <label>
              <span>Color en la agenda</span>
              <div className="gp-neg-color-row">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`gp-neg-color-dot${newColor === c ? " on":""}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                    type="button"
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </label>
            <div className="gp-neg-create-actions">
              <button className="gp-btn" onClick={() => setCreating(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="gp-btn primary" onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="gp-spinner-sm" />}
                Añadir al equipo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamHub;
