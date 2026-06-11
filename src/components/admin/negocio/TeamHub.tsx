import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Plus,
  Search,
  Star,
  Euro,
  Calendar,
  Percent,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { StylistDrawer } from "./StylistDrawer";
import { useToast } from "@/hooks/use-toast";

interface TeamHubProps {
  tenantId: string;
}

interface Stylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  avatar_url: string | null;
  google_calendar_id: string | null;
  is_active: boolean;
  user_id: string | null;
}

interface StylistMetrics {
  bookings: number;
  revenue: number;
  rating: number;
  commissionPct: number | null;
  commissionType: string | null;
}

const PRESET_COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#06B6D4", "#84CC16"];

export function TeamHub({ tenantId }: TeamHubProps) {
  const { toast } = useToast();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [metrics, setMetrics] = useState<Map<string, StylistMetrics>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [stylistsRes, txRes, bookingsRes, reviewsRes, commissionsRes] = await Promise.all([
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
        .from("reviews")
        .select("rating, stylist_id" as never)
        .eq("tenant_id", tenantId)
        .eq("approved", true),
      supabase
        .from("stylist_commissions")
        .select("stylist_id, commission_percentage, commission_type")
        .eq("tenant_id", tenantId),
    ]);

    const sts = (stylistsRes.data ?? []) as Stylist[];
    const txs = (txRes.data ?? []) as Array<{ total: number; stylist_id: string | null }>;
    const bookings = (bookingsRes.data ?? []) as Array<{ stylist: string | null }>;
    const reviews = (reviewsRes.data ?? []) as Array<{ rating: number; stylist_id: string | null }>;
    const commissions = (commissionsRes.data ?? []) as Array<{
      stylist_id: string | null;
      commission_percentage: number | null;
      commission_type: string | null;
    }>;

    const map = new Map<string, StylistMetrics>();
    sts.forEach((s) =>
      map.set(s.id, { bookings: 0, revenue: 0, rating: 0, commissionPct: null, commissionType: null })
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

    const ratingAcc = new Map<string, { sum: number; count: number }>();
    reviews.forEach((r) => {
      if (!r.stylist_id) return;
      const entry = ratingAcc.get(r.stylist_id) ?? { sum: 0, count: 0 };
      entry.sum += r.rating;
      entry.count += 1;
      ratingAcc.set(r.stylist_id, entry);
    });
    ratingAcc.forEach((v, id) => {
      const m = map.get(id);
      if (m) m.rating = v.count > 0 ? v.sum / v.count : 0;
    });

    commissions.forEach((c) => {
      if (!c.stylist_id) return;
      const m = map.get(c.stylist_id);
      if (m) {
        m.commissionPct = c.commission_percentage;
        m.commissionType = c.commission_type;
      }
    });

    setStylists(sts);
    setMetrics(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stylists.filter((s) => {
      if (filter === "active" && !s.is_active) return false;
      if (filter === "inactive" && s.is_active) return false;
      if (term && !s.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [stylists, search, filter]);

  const counts = useMemo(
    () => ({
      all: stylists.length,
      active: stylists.filter((s) => s.is_active).length,
      inactive: stylists.filter((s) => !s.is_active).length,
    }),
    [stylists]
  );

  const totals = useMemo(() => {
    let revenue = 0;
    let bookings = 0;
    metrics.forEach((m) => {
      revenue += m.revenue;
      bookings += m.bookings;
    });
    return { revenue, bookings };
  }, [metrics]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
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
    toast({ title: "Estilista añadido" });
    setCreating(false);
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
    await load();
    if (data?.id) setSelectedId(data.id);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  return (
    <div className="gp-fade gp-neg-team">
      <div className="gp-page-h">
        <div>
          <h2>Equipo</h2>
          <p>
            {counts.active} activos · {totals.bookings} citas mes ·{" "}
            {Math.round(totals.revenue).toLocaleString("es-ES")}€
          </p>
        </div>
        <div className="gp-page-actions">
          <button className="gp-btn primary sm" onClick={() => setCreating(true)} type="button">
            <Plus style={{ width: 13, height: 13 }} /> Nuevo
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="gp-mkt-posts-toolbar">
        <div className="gp-mkt-chip-row">
          <button
            className={`gp-mkt-chip${filter === "all" ? " on" : ""}`}
            onClick={() => setFilter("all")}
            type="button"
          >
            Todos ({counts.all})
          </button>
          <button
            className={`gp-mkt-chip${filter === "active" ? " on" : ""}`}
            onClick={() => setFilter("active")}
            type="button"
          >
            Activos ({counts.active})
          </button>
          <button
            className={`gp-mkt-chip${filter === "inactive" ? " on" : ""}`}
            onClick={() => setFilter("inactive")}
            type="button"
          >
            Inactivos ({counts.inactive})
          </button>
        </div>
        <div className="gp-mkt-search" style={{ maxWidth: 280 }}>
          <Search style={{ width: 14, height: 14, color: "var(--gp-muted-c)" }} />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic">
              <Users style={{ width: 24, height: 24 }} />
            </div>
            <h4>Sin estilistas</h4>
            <p>Añade tu primer profesional</p>
            <button className="gp-btn primary" style={{ marginTop: 12 }} onClick={() => setCreating(true)}>
              <Plus style={{ width: 14, height: 14 }} /> Añadir
            </button>
          </div>
        </div>
      ) : (
        <div className="gp-neg-team-grid">
          {filtered.map((s) => {
            const m = metrics.get(s.id) ?? {
              bookings: 0,
              revenue: 0,
              rating: 0,
              commissionPct: null,
              commissionType: null,
            };
            const earnings =
              m.commissionType === "percentage" && m.commissionPct != null
                ? Math.round((m.revenue * m.commissionPct) / 100)
                : null;
            return (
              <button
                key={s.id}
                className={`gp-neg-stylist${!s.is_active ? " is-off" : ""}`}
                onClick={() => setSelectedId(s.id)}
                type="button"
              >
                <div className="gp-neg-stylist-h">
                  <div
                    className="gp-neg-stylist-avatar"
                    style={{ background: s.color || "var(--gp-accent)" }}
                  >
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name} />
                    ) : (
                      <span>{s.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="gp-neg-stylist-info">
                    <strong>{s.name}</strong>
                    <span>
                      {s.is_active ? (
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
                <div className="gp-neg-stylist-kpis">
                  <div className="gp-neg-stylist-kpi">
                    <Calendar style={{ width: 12, height: 12 }} />
                    <span>{m.bookings}</span>
                    <small>citas</small>
                  </div>
                  <div className="gp-neg-stylist-kpi">
                    <Euro style={{ width: 12, height: 12 }} />
                    <span>{Math.round(m.revenue).toLocaleString("es-ES")}</span>
                    <small>€</small>
                  </div>
                  <div className="gp-neg-stylist-kpi">
                    <Star style={{ width: 12, height: 12 }} />
                    <span>{m.rating > 0 ? m.rating.toFixed(1) : "—"}</span>
                    <small>rating</small>
                  </div>
                </div>
                {(m.commissionPct != null || earnings != null) && (
                  <div className="gp-neg-stylist-foot">
                    <span>
                      <Percent style={{ width: 11, height: 11 }} />
                      {m.commissionPct != null ? `${m.commissionPct}% comisión` : "Sin comisión"}
                    </span>
                    {earnings != null && (
                      <span className="gp-neg-stylist-foot-earn">
                        <TrendingUp style={{ width: 11, height: 11 }} />
                        {earnings}€ a pagar
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {selectedId && (
        <StylistDrawer
          tenantId={tenantId}
          stylistId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}

      {/* Create dialog */}
      {creating && (
        <div className="gp-neg-create-backdrop" onClick={() => !saving && setCreating(false)}>
          <div className="gp-neg-create" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo estilista</h3>
            <label>
              <span>Nombre</span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Cristina Muñoz"
                autoFocus
              />
            </label>
            <label>
              <span>Color</span>
              <div className="gp-neg-color-row">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`gp-neg-color-dot${newColor === c ? " on" : ""}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                    type="button"
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
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamHub;
