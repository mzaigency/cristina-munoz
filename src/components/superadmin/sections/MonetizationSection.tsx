import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Receipt,
  Plus,
  Edit2,
  Check,
  X,
  Loader2,
  DollarSign,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number | null;
  features: Record<string, boolean>;
  max_stylists: number;
  max_services: number;
  is_active: boolean;
  sort_order: number;
}

interface MonetizationSectionProps {
  subtab: string;
}

export const MonetizationSection: React.FC<MonetizationSectionProps> = ({ subtab }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (subtab === "transactions") {
      fetchTransactions();
    } else {
      fetchPlans();
    }
  }, [subtab]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPlans(
        (data || []).map((p) => ({
          ...p,
          features: (typeof p.features === "object" && p.features !== null && !Array.isArray(p.features)
            ? p.features
            : {}) as Record<string, boolean>,
        })),
      );
    } catch (err: any) {
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, payment_method, type, created_at, description, tenant_id, tenants(name, slug)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan({ ...plan });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!selectedPlan) return;
    setSavingPlan(true);
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          name: selectedPlan.name,
          slug: selectedPlan.slug,
          monthly_price: selectedPlan.monthly_price,
          annual_price: selectedPlan.annual_price,
          max_stylists: selectedPlan.max_stylists,
          max_services: selectedPlan.max_services,
          is_active: selectedPlan.is_active,
        })
        .eq("id", selectedPlan.id);

      if (error) throw error;
      toast({ title: "Plan actualizado", description: "Los cambios se guardaron con éxito." });
      setIsPlanModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPlan(false);
    }
  };

  // Subtab: transactions
  if (subtab === "transactions") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Facturación y Transacciones
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro global de cobros, transacciones y comisiones registradas en la plataforma.
          </p>
        </div>

        <Card className="rounded-2xl border-[var(--glow-line)] bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--glow-line)] bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Salón</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Importe</th>
                  <th className="py-3 px-4 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glow-line)]/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--glow-brand)]" />
                      Cargando transacciones...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">
                        {t.tenants?.name || "Salón"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {t.description || t.type || "Cobro de servicio"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {t.payment_method || "Tarjeta"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-foreground">
                        {t.amount}€
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground text-[11px]">
                        {t.created_at
                          ? format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: es })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // Subtab por defecto: plans
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Planes de Suscripción y Comisiones
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configura los paquetes de suscripción mensual que los salones contratan para usar GlowApp.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--glow-brand)]" />
          Cargando planes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-5 rounded-2xl border-[var(--glow-line)] bg-card shadow-xs flex flex-col justify-between ${
                plan.slug === "pro" ? "border-[var(--glow-brand)]/40 ring-1 ring-[var(--glow-brand)]/20" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-foreground uppercase tracking-wide">
                    {plan.name}
                  </span>
                  <Badge
                    variant={plan.is_active ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {plan.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black text-foreground">
                    {plan.monthly_price}€
                  </span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>

                <div className="space-y-2 py-3 border-t border-[var(--glow-line)]/70 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Estilistas máx.</span>
                    <span className="font-bold text-foreground">
                      {plan.max_stylists >= 999 ? "Ilimitados" : plan.max_stylists}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Servicios máx.</span>
                    <span className="font-bold text-foreground">
                      {plan.max_services >= 999 ? "Ilimitados" : plan.max_services}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditPlan(plan)}
                className="w-full mt-4 h-8 text-xs font-bold rounded-xl gap-1.5"
              >
                <Edit2 className="h-3 w-3" />
                <span>Editar Precios / Límites</span>
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Edición Plan */}
      {selectedPlan && (
        <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Editar Plan: {selectedPlan.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modifica los precios y cuotas del plan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Precio Mensual (€)</Label>
                <Input
                  type="number"
                  value={selectedPlan.monthly_price}
                  onChange={(e) =>
                    setSelectedPlan({
                      ...selectedPlan,
                      monthly_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-8 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Precio Anual (€) (Opcional)</Label>
                <Input
                  type="number"
                  value={selectedPlan.annual_price || ""}
                  onChange={(e) =>
                    setSelectedPlan({
                      ...selectedPlan,
                      annual_price: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="h-8 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Máx. Estilistas</Label>
                  <Input
                    type="number"
                    value={selectedPlan.max_stylists}
                    onChange={(e) =>
                      setSelectedPlan({
                        ...selectedPlan,
                        max_stylists: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Máx. Servicios</Label>
                  <Input
                    type="number"
                    value={selectedPlan.max_services}
                    onChange={(e) =>
                      setSelectedPlan({
                        ...selectedPlan,
                        max_services: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl border border-[var(--glow-line)]">
                <span className="font-bold text-foreground">Plan Activo</span>
                <Switch
                  checked={selectedPlan.is_active}
                  onCheckedChange={(val) =>
                    setSelectedPlan({ ...selectedPlan, is_active: val })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSavePlan}
                disabled={savingPlan}
                className="rounded-xl bg-[var(--glow-brand)] text-white hover:brightness-105 text-xs font-bold"
              >
                {savingPlan && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                <span>Guardar</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
