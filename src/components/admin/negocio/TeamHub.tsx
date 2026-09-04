import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CHART_COLORS, readableInk } from "@/lib/chartColors";
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
  UserPlus,
  Clock,
  CalendarOff,
  Palmtree,
  ArrowRight,
} from "lucide-react";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { StylistDrawer } from "./StylistDrawer";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PlanUsageBar } from "@/components/admin/PlanUsageBar";
import { UpgradePrompt } from "@/components/admin/UpgradePrompt";
import { GlowModal } from "@/components/admin/layout/GlowModal";

/**
 * Equipo — lista de profesionales y métricas del mes.
 * Incluye accesos directos a Horarios/Vacaciones y detección en tiempo real
 * de ausencias programadas.
 */

export interface TeamHubProps {
  tenantId: string;
  onNavigateTab?: (tab: string) => void;
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

interface AbsenceInfo {
  label: string;
  date_to: string;
  is_today: boolean;
}

const PRESET_COLORS = CHART_COLORS;

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

const fmtDay = (iso: string) => {
  try {
    return format(parseISO(iso), "d MMM", { locale: es });
  } catch {
    return iso;
  }
};

function earningsFor(m: StylistMetrics): number | null {
  if (m.commissionType === "percentage" && m.commissionPct != null) {
    return Math.round((m.revenue * m.commissionPct) / 100);
  }
  if (m.commissionType === "fixed" && m.commissionFixed != null) {
    return Math.round(m.commissionFixed * m.bookings);
  }
  return null;
}

export function TeamHub({ tenantId, onNavigateTab }: TeamHubProps) {
  const { toast } = useToast();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [metrics, setMetrics] = useState<Map<string, StylistMetrics>>(new Map());
  const [today, setToday] = useState<Map<string, TodayHours>>(new Map());
  const [absences, setAbsences] = useState<Map<string, AbsenceInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"schedule" | "performance" | "profile">("schedule");
  const [autoOpenAbsence, setAutoOpenAbsence] = useState(false);
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
    const todayStr = format(now, "yyyy-MM-dd");
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const todayDow = now.getDay();

    const [
      stylistsRes,
      txRes,
      bookingsRes,
      commissionsRes,
      ownHoursRes,
      salonHoursRes,
      absencesRes,
    ] = await Promise.all([
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
      supabase
        .from("stylist_hours_overrides")
        .select("stylist_id, date_from, date_to, label, is_closed")
        .eq("tenant_id", tenantId)
        .gte("date_to", todayStr)
        .order("date_from"),
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

    // Horario de HOY
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

    // Ausencias activas hoy o próximas
    const absMap = new Map<string, AbsenceInfo>();
    const overrides = (absencesRes.data ?? []) as Array<{
      stylist_id: string;
      date_from: string;
      date_to: string;
      label: string | null;
      is_closed: boolean;
    }>;

    overrides.forEach((o) => {
      if (!absMap.has(o.stylist_id)) {
        const isToday = o.date_from <= todayStr && o.date_to >= todayStr;
        absMap.set(o.stylist_id, {
          label: o.label || "Vacaciones",
          date_to: o.date_to,
          is_today: isToday,
        });
      }
    });

    setStylists(sts);
    setMetrics(map);
    setToday(todayMap);
    setAbsences(absMap);
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
      toast({ title: "Ponle un nombre", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
    if (data?.id) {
      setSelectedId(data.id);
      setDrawerTab("schedule");
    }
  };

  const openStylistDrawer = (id: string, tab: "schedule" | "performance" | "profile" = "schedule", openAdd = false) => {
    setSelectedId(id);
    setDrawerTab(tab);
    setAutoOpenAbsence(openAdd);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="glow-spinner" />
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
    const abs = absences.get(s.id);

    return (
      <div
        key={s.id}
        className="border-b border-border/40 last:border-b-0 hover:bg-muted/15 transition-colors"
      >
        <div
          className="glow-team-row"
          onClick={() => openStylistDrawer(s.id, "schedule", false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") openStylistDrawer(s.id, "schedule", false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px 8px",
            cursor: "pointer",
            borderBottom: "none",
          }}
        >
          <div
            className="glow-neg-stylist-avatar glow-team-row-avatar"
            style={{
              background: s.color || "var(--glow-brand)",
              color: readableInk(s.color || "#22408C"),
              width: 42,
              height: 42,
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            {s.avatar_url ? <img src={s.avatar_url} alt="" /> : <span>{s.name.charAt(0).toUpperCase()}</span>}
          </div>

          <div className="glow-team-row-main" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 14, fontWeight: 700, color: "var(--glow-ink)" }}>{s.name}</strong>
              {abs?.is_today && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--glow-accent, #99329a)",
                    background: "rgba(153, 50, 154, 0.09)",
                    padding: "1px 7px",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Palmtree style={{ width: 11, height: 11 }} />
                  {abs.label} (hasta {fmtDay(abs.date_to)})
                </span>
              )}
            </div>

            {s.is_active ? (
              abs?.is_today ? (
                <span className="glow-team-today" style={{ color: "var(--glow-accent, #99329a)", fontSize: 12 }}>
                  Ausente hoy
                </span>
              ) : t ? (
                t.working && t.start && t.end ? (
                  <span className="glow-team-today on" style={{ fontSize: 12 }}>
                    Hoy {hhmm(t.start)}–{hhmm(t.end)}
                  </span>
                ) : (
                  <span className="glow-team-today" style={{ fontSize: 12 }}>
                    <Moon style={{ width: 11, height: 11 }} /> Hoy descansa
                  </span>
                )
              ) : (
                <span className="glow-team-today" style={{ fontSize: 12 }}>Sin horario</span>
              )
            ) : (
              <span className="glow-team-today" style={{ fontSize: 12 }}>Inactivo</span>
            )}
          </div>

          {/* Métricas del mes */}
          <div className="glow-team-row-stats">
            <span className="glow-team-stat">
              <Calendar />
              {m.bookings}
              <small>citas</small>
            </span>
            <span className="glow-team-stat">
              <Euro />
              {Math.round(m.revenue).toLocaleString("es-ES")}
              <small>factura</small>
            </span>
            <span className={`glow-team-stat${pay != null ? " pay" : ""}`}>
              <Wallet />
              {pay != null ? `${pay.toLocaleString("es-ES")}€` : "—"}
              <small>a pagar</small>
            </span>
          </div>

          <ChevronRight className="glow-team-row-chev" />
        </div>

        {/* Botones de acción directa rápida: Modificar Horario & Vacaciones */}
        <div
          className="flex items-center gap-2 px-3 pb-2.5 pt-0"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => openStylistDrawer(s.id, "schedule", false)}
            className="flex-1 py-1.5 px-2.5 text-xs font-medium rounded-lg bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center gap-1.5 border border-border/50 transition-colors shadow-xs cursor-pointer"
            title="Ver o modificar horarios y turnos de este profesional"
          >
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Modificar horario</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => openStylistDrawer(s.id, "schedule", true)}
            className="flex-1 py-1.5 px-2.5 text-xs font-medium rounded-lg bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center gap-1.5 border border-border/50 transition-colors shadow-xs cursor-pointer"
            title="Añadir vacaciones, bajas o ausencias a este profesional"
          >
            <Palmtree className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Vacaciones</span>
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <div className="glow-fade">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-4 w-full text-left">
        <div className="w-full sm:w-auto text-left">
          <div className="flex flex-wrap items-center justify-start gap-2 text-left">
            <h2 className="text-xl font-bold tracking-tight text-foreground m-0 text-left">Equipo</h2>
            {onNavigateTab && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigateTab("horarios")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-full border border-primary/20 transition-all cursor-pointer"
              >
                <Clock className="w-3 h-3" />
                <span>Cuadrante general</span>
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-left">
            Profesionales, comisiones y acceso directo a turnos y vacaciones.
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:items-end gap-1.5">
          <button
            className="glow-btn glow-btn--primary glow-btn--sm w-full sm:w-auto justify-center"
            onClick={openCreate}
            type="button"
          >
            <Plus style={{ width: 13, height: 13 }} />
            <span>Añadir profesional</span>
          </button>
          {maxStylists < 999 && (
            <PlanUsageBar
              current={currentStylists}
              max={maxStylists}
              label="profesionales"
              className="w-full sm:w-[150px]"
            />
          )}
        </div>
      </div>

      {/* Pasado del límite: aviso */}
      {isOverLimit("stylists") && (
        <div className="glow-team-overlimit">
          Tienes {currentStylists} profesionales y tu plan incluye {maxStylists}.{" "}
          <button onClick={() => setUpgradeOpen(true)} type="button">
            Mejorar plan
          </button>
        </div>
      )}

      {stylists.length === 0 ? (
        <div className="glow-card">
          <div className="glow-empty">
            <div className="glow-empty-ic">
              <Users style={{ width: 24, height: 24 }} />
            </div>
            <h4>Tu equipo, aquí</h4>
            <p>Añade a cada profesional para asignarle citas, horario y comisión.</p>
            <button className="glow-btn glow-btn--primary" style={{ marginTop: 12 }} onClick={openCreate}>
              <Plus style={{ width: 14, height: 14 }} /> Añadir profesional
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Resumen del mes */}
          <div className="glow-team-kpis">
            <div className="glow-team-kpi">
              <span>{actives.length === 1 ? "Profesional activo" : "Profesionales activos"}</span>
              <strong>{stylists.filter((s) => s.is_active).length}</strong>
            </div>
            <div className="glow-team-kpi">
              <span>Citas del equipo · mes</span>
              <strong>{teamTotals.bookings}</strong>
            </div>
            <div className="glow-team-kpi pay">
              <span>Total a pagar · mes</span>
              <strong>{teamTotals.toPay.toLocaleString("es-ES")}€</strong>
            </div>
          </div>

          {/* Buscador solo cuando hay equipo grande */}
          {stylists.length > 8 && (
            <div className="glow-mkt-search" style={{ maxWidth: 280, marginBottom: 12 }}>
              <Search style={{ width: 14, height: 14, color: "var(--glow-ink-3)" }} />
              <input
                type="text"
                placeholder="Buscar profesional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Lista de Activos */}
          <div className="glow-team-list">{actives.map(renderRow)}</div>

          {/* Inactivos */}
          {inactives.length > 0 && (
            <>
              <div className="glow-team-divider">Inactivos ({inactives.length})</div>
              <div className="glow-team-list is-off">{inactives.map(renderRow)}</div>
            </>
          )}
        </>
      )}

      {/* Upgrade Modal */}
      <UpgradePrompt
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={planSlug}
        targetPlan={getUpgradePlanForLimit("stylists") || "pro"}
        feature="Más profesionales en tu equipo"
        tenantId={tenantId}
      />

      {/* Drawer de detalle con pestañas */}
      {selectedId && (
        <StylistDrawer
          tenantId={tenantId}
          stylistId={selectedId}
          initialTab={drawerTab}
          autoOpenAddAbsence={autoOpenAbsence}
          onClose={() => {
            setSelectedId(null);
            setAutoOpenAbsence(false);
          }}
          onChanged={load}
        />
      )}

      {/* Modal Alta */}
      <GlowModal
        open={creating}
        onOpenChange={(o) => !saving && setCreating(o)}
        title="Nuevo profesional"
        description="Le reservamos su columna en la agenda y turnos."
        icon={<UserPlus />}
        size="sm"
        footer={
          <>
            <button className="glow-btn" onClick={() => setCreating(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="glow-btn glow-btn--primary" onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="glow-spinner-sm" />}
              Añadir al equipo
            </button>
          </>
        }
      >
        <div className="glow-form">
          <div className="glow-field">
            <label htmlFor="team-name">Nombre</label>
            <input
              id="team-name"
              className="glow-input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) handleCreate();
              }}
              placeholder="Ej: Cristina Muñoz"
              autoFocus
            />
          </div>
          <div className="glow-field">
            <label>Color en la agenda</label>
            <div className="glow-neg-color-row">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`glow-neg-color-dot${newColor === c ? " on" : ""}`}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                  type="button"
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </GlowModal>
    </div>
  );
}

export default TeamHub;
