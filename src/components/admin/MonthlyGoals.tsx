import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, differenceInDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Euro,
  Loader2,
  Save,
  AlertTriangle
} from "lucide-react";

interface MonthlyGoal {
  id?: string;
  revenue_goal: number;
  bookings_goal: number;
  new_clients_goal: number;
}

interface CurrentProgress {
  revenue: number;
  bookings: number;
  newClients: number;
}

interface MonthlyGoalsProps {
  tenantId: string;
}

export function MonthlyGoals({ tenantId }: MonthlyGoalsProps) {
  const [goals, setGoals] = useState<MonthlyGoal>({
    revenue_goal: 0,
    bookings_goal: 0,
    new_clients_goal: 0
  });
  const [progress, setProgress] = useState<CurrentProgress>({
    revenue: 0,
    bookings: 0,
    newClients: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      // Fetch goals
      const { data: goalsData } = await supabase
        .from("monthly_goals" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle();

      if (goalsData) {
        setGoals(goalsData as unknown as MonthlyGoal);
      }

      // Fetch current progress
      const startDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const [transactionsRes, bookingsRes, clientsRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("total")
          .eq("tenant_id", tenantId)
          .eq("voided", false)
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`),
        supabase
          .from("bookings")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("status", "confirmed")
          .gte("Fecha", startDate)
          .lte("Fecha", endDate),
        supabase
          .from("clients" as any)
          .select("id")
          .eq("tenant_id", tenantId)
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`)
      ]);

      const revenue = (transactionsRes.data || []).reduce((sum, t) => sum + Number(t.total), 0);
      const bookings = bookingsRes.data?.length || 0;
      const newClients = (clientsRes.data as any)?.length || 0;

      setProgress({ revenue, bookings, newClients });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async () => {
    setSaving(true);
    try {
      const goalsData = {
        tenant_id: tenantId,
        month: currentMonth,
        year: currentYear,
        revenue_goal: goals.revenue_goal,
        bookings_goal: goals.bookings_goal,
        new_clients_goal: goals.new_clients_goal
      };

      const { data: existing } = await supabase
        .from("monthly_goals" as any)
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("monthly_goals" as any)
          .update(goalsData)
          .eq("id", (existing as any).id);
      } else {
        await supabase
          .from("monthly_goals" as any)
          .insert(goalsData);
      }

      toast({ title: "Objetivos guardados" });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getProgressPercent = (current: number, goal: number) => {
    if (goal <= 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  const getPrediction = (current: number, goal: number) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysElapsed = differenceInDays(today, monthStart) + 1;
    const totalDays = differenceInDays(monthEnd, monthStart) + 1;
    const daysRemaining = totalDays - daysElapsed;
    
    const dailyRate = daysElapsed > 0 ? current / daysElapsed : 0;
    const prediction = current + (dailyRate * daysRemaining);
    
    return {
      prediction,
      onTrack: prediction >= goal,
      dailyNeeded: daysRemaining > 0 ? (goal - current) / daysRemaining : 0
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const revenuePrediction = getPrediction(progress.revenue, goals.revenue_goal);
  const bookingsPrediction = getPrediction(progress.bookings, goals.bookings_goal);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Objetivos {format(new Date(), "MMMM yyyy", { locale: es })}
          </h2>
          <p className="text-sm text-muted-foreground">Define y sigue tus metas mensuales</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={saveGoals} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Editar objetivos
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Revenue Goal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-[var(--gp-ok-ink)]" />
              Facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-xs">Objetivo (€)</Label>
                <Input
                  type="number"
                  value={goals.revenue_goal}
                  onChange={(e) => setGoals({ ...goals, revenue_goal: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold">{progress.revenue.toFixed(0)}€</p>
                    <p className="text-xs text-muted-foreground">de {goals.revenue_goal.toFixed(0)}€</p>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {getProgressPercent(progress.revenue, goals.revenue_goal).toFixed(0)}%
                  </p>
                </div>
                <Progress value={getProgressPercent(progress.revenue, goals.revenue_goal)} className="h-2" />
                
                {goals.revenue_goal > 0 && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${revenuePrediction.onTrack ? 'text-[var(--gp-ok-ink)]' : 'text-[var(--gp-warn-ink)]'}`}>
                    {revenuePrediction.onTrack ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    Proyección: {revenuePrediction.prediction.toFixed(0)}€
                    {!revenuePrediction.onTrack && revenuePrediction.dailyNeeded > 0 && (
                      <span className="ml-1">({revenuePrediction.dailyNeeded.toFixed(0)}€/día)</span>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Bookings Goal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--gp-info-ink)]" />
              Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-xs">Objetivo</Label>
                <Input
                  type="number"
                  value={goals.bookings_goal}
                  onChange={(e) => setGoals({ ...goals, bookings_goal: parseInt(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold">{progress.bookings}</p>
                    <p className="text-xs text-muted-foreground">de {goals.bookings_goal}</p>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {getProgressPercent(progress.bookings, goals.bookings_goal).toFixed(0)}%
                  </p>
                </div>
                <Progress value={getProgressPercent(progress.bookings, goals.bookings_goal)} className="h-2" />
                
                {goals.bookings_goal > 0 && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${bookingsPrediction.onTrack ? 'text-[var(--gp-ok-ink)]' : 'text-[var(--gp-warn-ink)]'}`}>
                    {bookingsPrediction.onTrack ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    Proyección: {bookingsPrediction.prediction.toFixed(0)} citas
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* New Clients Goal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--gp-purple-ink)]" />
              Nuevos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-xs">Objetivo</Label>
                <Input
                  type="number"
                  value={goals.new_clients_goal}
                  onChange={(e) => setGoals({ ...goals, new_clients_goal: parseInt(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold">{progress.newClients}</p>
                    <p className="text-xs text-muted-foreground">de {goals.new_clients_goal}</p>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {getProgressPercent(progress.newClients, goals.new_clients_goal).toFixed(0)}%
                  </p>
                </div>
                <Progress value={getProgressPercent(progress.newClients, goals.new_clients_goal)} className="h-2" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {!isEditing && goals.revenue_goal > 0 && !revenuePrediction.onTrack && (
        <Card className="border-[var(--gp-warn)] bg-[var(--gp-warn-soft)] ">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-[var(--gp-warn-ink)] ">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">
                Vas por debajo del objetivo de facturación. Necesitas facturar <strong>{revenuePrediction.dailyNeeded.toFixed(0)}€/día</strong> para alcanzarlo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}