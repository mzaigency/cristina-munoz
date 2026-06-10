import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Target,
  Save,
  Loader2,
  TrendingUp,
  Euro,
  Calendar,
  Users,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PDFReportsGenerator } from "../PDFReportsGenerator";

interface GoalsReportsProps {
  tenantId: string;
  tenantName: string;
}

interface MonthlyGoal {
  id: string | null;
  revenue_goal: number;
  bookings_goal: number;
  new_clients_goal: number;
}

interface MonthData {
  key: string;
  label: string;
  revenue: number;
  bookings: number;
  newClients: number;
  goal: number;
}

export function GoalsReports({ tenantId, tenantName }: GoalsReportsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState<MonthlyGoal>({
    id: null,
    revenue_goal: 0,
    bookings_goal: 0,
    new_clients_goal: 0,
  });
  const [draft, setDraft] = useState<MonthlyGoal>({
    id: null,
    revenue_goal: 0,
    bookings_goal: 0,
    new_clients_goal: 0,
  });
  const [progress, setProgress] = useState({ revenue: 0, bookings: 0, newClients: 0 });
  const [history, setHistory] = useState<MonthData[]>([]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const load = async () => {
    setLoading(true);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthStartISO = monthStart.toISOString();
    const monthEndISO = monthEnd.toISOString();

    const [goalRes, txRes, bookingsRes, clientsRes, histGoalsRes] = await Promise.all([
      supabase
        .from("monthly_goals" as never)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("total, created_at")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", subMonths(monthStart, 11).toISOString())
        .lte("created_at", monthEndISO),
      supabase
        .from("bookings")
        .select("id, Fecha")
        .eq("tenant_id", tenantId)
        .gte("Fecha", format(subMonths(monthStart, 11), "yyyy-MM-dd"))
        .lte("Fecha", format(monthEnd, "yyyy-MM-dd")),
      supabase
        .from("clients")
        .select("id, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", subMonths(monthStart, 11).toISOString())
        .lte("created_at", monthEndISO),
      supabase
        .from("monthly_goals" as never)
        .select("month, year, revenue_goal")
        .eq("tenant_id", tenantId),
    ]);

    const goalData = goalRes.data as MonthlyGoal | null;
    if (goalData) {
      setGoal(goalData);
      setDraft(goalData);
    }

    // Current month progress
    const txs = (txRes.data ?? []) as Array<{ total: number; created_at: string }>;
    const bookings = (bookingsRes.data ?? []) as Array<{ id: string; Fecha: string }>;
    const clients = (clientsRes.data ?? []) as Array<{ id: string; created_at: string }>;

    const monthTx = txs.filter(
      (t) => new Date(t.created_at) >= monthStart && new Date(t.created_at) <= monthEnd
    );
    const monthBookings = bookings.filter((b) => b.Fecha >= format(monthStart, "yyyy-MM-dd") && b.Fecha <= format(monthEnd, "yyyy-MM-dd"));
    const monthClients = clients.filter(
      (c) => new Date(c.created_at) >= monthStart && new Date(c.created_at) <= monthEnd
    );

    setProgress({
      revenue: monthTx.reduce((acc, t) => acc + Number(t.total ?? 0), 0),
      bookings: monthBookings.length,
      newClients: monthClients.length,
    });

    // Build history for last 6 months
    const histGoals = (histGoalsRes.data ?? []) as Array<{ month: number; year: number; revenue_goal: number | null }>;
    const goalByMonth = new Map<string, number>();
    histGoals.forEach((g) =>
      goalByMonth.set(`${g.year}-${String(g.month).padStart(2, "0")}`, g.revenue_goal ?? 0)
    );

    const histArr: MonthData[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const key = format(m, "yyyy-MM");
      const rev = txs
        .filter((t) => new Date(t.created_at) >= mStart && new Date(t.created_at) <= mEnd)
        .reduce((acc, t) => acc + Number(t.total ?? 0), 0);
      const bk = bookings.filter((b) => {
        const d = parseISO(b.Fecha);
        return d >= mStart && d <= mEnd;
      }).length;
      const newC = clients.filter((c) => {
        const d = new Date(c.created_at);
        return d >= mStart && d <= mEnd;
      }).length;
      histArr.push({
        key,
        label: format(m, "MMM", { locale: es }),
        revenue: rev,
        bookings: bk,
        newClients: newC,
        goal: goalByMonth.get(key) ?? 0,
      });
    }
    setHistory(histArr);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const save = async () => {
    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      month: currentMonth,
      year: currentYear,
      revenue_goal: draft.revenue_goal,
      bookings_goal: draft.bookings_goal,
      new_clients_goal: draft.new_clients_goal,
    };
    if (goal.id) {
      const { error } = await supabase
        .from("monthly_goals" as never)
        .update(payload)
        .eq("id", goal.id);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("monthly_goals" as never)
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setGoal({ ...draft, id: (data as { id: string } | null)?.id ?? null });
    }
    toast({ title: "Objetivos guardados" });
    setEditing(false);
    load();
  };

  const revPct = goal.revenue_goal > 0 ? Math.min(100, (progress.revenue / goal.revenue_goal) * 100) : 0;
  const bkPct = goal.bookings_goal > 0 ? Math.min(100, (progress.bookings / goal.bookings_goal) * 100) : 0;
  const ncPct = goal.new_clients_goal > 0 ? Math.min(100, (progress.newClients / goal.new_clients_goal) * 100) : 0;

  const maxHistRev = Math.max(1, ...history.map((h) => Math.max(h.revenue, h.goal)));

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  return (
    <div className="gp-fade gp-neg-goals">
      <div className="gp-page-h">
        <div>
          <h2>Objetivos y Reportes</h2>
          <p>
            {format(now, "MMMM yyyy", { locale: es })} ·{" "}
            {goal.revenue_goal > 0
              ? `${Math.round(revPct)}% del objetivo`
              : "Define tu meta"}
          </p>
        </div>
        <div className="gp-page-actions">
          {!editing ? (
            <button className="gp-btn primary sm" onClick={() => setEditing(true)} type="button">
              <Pencil style={{ width: 13, height: 13 }} /> Editar
            </button>
          ) : (
            <>
              <button
                className="gp-btn sm"
                onClick={() => {
                  setEditing(false);
                  setDraft(goal);
                }}
                type="button"
              >
                <X style={{ width: 13, height: 13 }} /> Cancelar
              </button>
              <button className="gp-btn primary sm" onClick={save} disabled={saving} type="button">
                {saving ? <Loader2 className="gp-spinner-sm" /> : <Save style={{ width: 13, height: 13 }} />}
                Guardar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Goals 3-col */}
      <div className="gp-neg-goals-grid">
        <GoalCard
          icon={<Euro />}
          tone="ok"
          label="Ingresos"
          current={progress.revenue}
          goal={goal.revenue_goal}
          unit="€"
          editing={editing}
          onChange={(v) => setDraft({ ...draft, revenue_goal: v })}
          draftValue={draft.revenue_goal}
        />
        <GoalCard
          icon={<Calendar />}
          tone="brand"
          label="Citas"
          current={progress.bookings}
          goal={goal.bookings_goal}
          unit=""
          editing={editing}
          onChange={(v) => setDraft({ ...draft, bookings_goal: v })}
          draftValue={draft.bookings_goal}
        />
        <GoalCard
          icon={<Users />}
          tone="warn"
          label="Clientes nuevos"
          current={progress.newClients}
          goal={goal.new_clients_goal}
          unit=""
          editing={editing}
          onChange={(v) => setDraft({ ...draft, new_clients_goal: v })}
          draftValue={draft.new_clients_goal}
        />
      </div>

      {/* History bars */}
      <section className="gp-card pad gp-mkt-card">
        <div className="gp-mkt-card-h">
          <div>
            <h3>Últimos 6 meses</h3>
            <p>Ingresos vs objetivo</p>
          </div>
          <TrendingUp style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />
        </div>
        <div className="gp-neg-history">
          {history.map((h) => {
            const revH = (h.revenue / maxHistRev) * 100;
            const goalH = h.goal > 0 ? (h.goal / maxHistRev) * 100 : 0;
            const hit = h.goal > 0 && h.revenue >= h.goal;
            return (
              <div key={h.key} className="gp-neg-history-col">
                <div className="gp-neg-history-bars">
                  {h.goal > 0 && (
                    <div
                      className="gp-neg-history-goal"
                      style={{ bottom: `${goalH}%` }}
                      title={`Objetivo ${h.goal}€`}
                    />
                  )}
                  <div
                    className={`gp-neg-history-rev${hit ? " hit" : ""}`}
                    style={{ height: `${revH}%` }}
                    title={`${Math.round(h.revenue)}€`}
                  />
                </div>
                <span className="gp-neg-history-label">{h.label}</span>
                <span className="gp-neg-history-val">
                  {h.revenue > 0 ? `${Math.round(h.revenue / 1000)}k` : "—"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="gp-neg-history-legend">
          <span><span className="dot rev" /> Ingresos</span>
          <span><span className="dot goal" /> Objetivo</span>
        </div>
      </section>

      {/* PDF reports */}
      <section>
        <PDFReportsGenerator tenantId={tenantId} tenantName={tenantName} />
      </section>
    </div>
  );
}

function GoalCard({
  icon,
  tone,
  label,
  current,
  goal,
  unit,
  editing,
  draftValue,
  onChange,
}: {
  icon: React.ReactNode;
  tone: "ok" | "brand" | "warn";
  label: string;
  current: number;
  goal: number;
  unit: string;
  editing: boolean;
  draftValue: number;
  onChange: (v: number) => void;
}) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div className="gp-card pad gp-neg-goal-card">
      <div className="gp-neg-goal-h">
        <span className={`gp-mkt-quick-ic tone-${tone}`}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="gp-neg-goal-numbers">
        <strong>
          {Math.round(current).toLocaleString("es-ES")}
          {unit}
        </strong>
        <span>
          de{" "}
          {editing ? (
            <input
              type="number"
              className="gp-neg-goal-input"
              value={draftValue}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              min={0}
            />
          ) : goal > 0 ? (
            <>
              {goal.toLocaleString("es-ES")}
              {unit}
            </>
          ) : (
            "definir"
          )}
        </span>
      </div>
      {goal > 0 && (
        <>
          <div className="gp-neg-goal-bar">
            <div className={`gp-neg-goal-bar-fill tone-${tone}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="gp-neg-goal-pct">
            <strong>{Math.round(pct)}%</strong>
            {pct >= 100 ? <Check style={{ width: 14, height: 14 }} /> : null}
          </div>
        </>
      )}
    </div>
  );
}

export default GoalsReports;
