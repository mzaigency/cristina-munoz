import { useState, useEffect } from "react";
import { STYLIST_FALLBACK } from "@/lib/chartColors";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  Percent,
  Euro,
  TrendingUp,
  Loader2,
  Users,
  Calculator,
  Save
} from "lucide-react";

interface Stylist {
  id: string;
  name: string;
  avatar_url: string | null;
  color: string | null;
}

interface Commission {
  id?: string;
  stylist_id: string;
  commission_percentage: number;
  commission_type: string;
  commission_fixed: number;
}

interface StylistEarnings {
  stylist_id: string;
  stylist_name: string;
  total_sales: number;
  commission_earned: number;
  services_count: number;
}

interface CommissionsManagerProps {
  tenantId: string;
}

export function CommissionsManager({ tenantId }: CommissionsManagerProps) {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [commissions, setCommissions] = useState<Record<string, Commission>>({});
  const [earnings, setEarnings] = useState<StylistEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  useEffect(() => {
    if (stylists.length > 0) {
      calculateEarnings();
    }
  }, [selectedMonth, stylists, commissions]);

  const fetchData = async () => {
    try {
      const [stylistsRes, commissionsRes] = await Promise.all([
        supabase
          .from("tenant_stylists")
          .select("id, name, avatar_url, color")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("stylist_commissions" as any)
          .select("*")
          .eq("tenant_id", tenantId)
      ]);

      if (stylistsRes.error) throw stylistsRes.error;
      setStylists(stylistsRes.data || []);

      // Map commissions by stylist_id
      const commissionsMap: Record<string, Commission> = {};
      ((commissionsRes.data || []) as unknown as Commission[]).forEach(c => {
        commissionsMap[c.stylist_id] = c;
      });
      setCommissions(commissionsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = async () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
    const endDate = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("stylist, stylist_id, total, services")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);

      if (error) throw error;

      // Aggregate by stylist
      const earningsMap: Record<string, StylistEarnings> = {};
      
      stylists.forEach(stylist => {
        earningsMap[stylist.id] = {
          stylist_id: stylist.id,
          stylist_name: stylist.name,
          total_sales: 0,
          commission_earned: 0,
          services_count: 0
        };
      });

      (data || []).forEach(tx => {
        const stylistId = tx.stylist_id;
        if (stylistId && earningsMap[stylistId]) {
          const services = Array.isArray(tx.services) ? tx.services : [];
          earningsMap[stylistId].total_sales += Number(tx.total) || 0;
          earningsMap[stylistId].services_count += services.length;
        }
      });

      // Calculate commissions
      Object.values(earningsMap).forEach(e => {
        const commission = commissions[e.stylist_id];
        if (commission) {
          if (commission.commission_type === "percentage") {
            e.commission_earned = (e.total_sales * (commission.commission_percentage || 0)) / 100;
          } else if (commission.commission_type === "fixed") {
            e.commission_earned = (commission.commission_fixed || 0) * e.services_count;
          } else if (commission.commission_type === "mixed") {
            e.commission_earned = 
              (e.total_sales * (commission.commission_percentage || 0)) / 100 +
              (commission.commission_fixed || 0) * e.services_count;
          }
        }
      });

      setEarnings(Object.values(earningsMap).sort((a, b) => b.total_sales - a.total_sales));
    } catch (error) {
      console.error("Error calculating earnings:", error);
    }
  };

  const updateCommission = (stylistId: string, field: keyof Commission, value: any) => {
    setCommissions(prev => ({
      ...prev,
      [stylistId]: {
        ...prev[stylistId],
        stylist_id: stylistId,
        commission_type: prev[stylistId]?.commission_type || "percentage",
        commission_percentage: prev[stylistId]?.commission_percentage || 0,
        commission_fixed: prev[stylistId]?.commission_fixed || 0,
        [field]: value
      }
    }));
  };

  const saveCommissions = async () => {
    setSaving(true);
    try {
      for (const stylistId of Object.keys(commissions)) {
        const commission = commissions[stylistId];
        
        // Check if exists
        const { data: existing } = await supabase
          .from("stylist_commissions" as any)
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("stylist_id", stylistId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("stylist_commissions" as any)
            .update({
              commission_percentage: commission.commission_percentage,
              commission_type: commission.commission_type,
              commission_fixed: commission.commission_fixed
            })
            .eq("id", (existing as any).id);
        } else {
          await supabase
            .from("stylist_commissions" as any)
            .insert({
              tenant_id: tenantId,
              stylist_id: stylistId,
              commission_percentage: commission.commission_percentage,
              commission_type: commission.commission_type,
              commission_fixed: commission.commission_fixed
            });
        }
      }

      toast({ title: "Comisiones guardadas" });
      calculateEarnings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSales = earnings.reduce((sum, e) => sum + e.total_sales, 0);
  const totalCommissions = earnings.reduce((sum, e) => sum + e.commission_earned, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Sistema de Comisiones
          </h2>
          <p className="text-sm text-outline">Configura y calcula comisiones por estilista</p>
        </div>
        <button className="glow-btn glow-btn--primary" onClick={saveCommissions} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </button>
      </div>

      {/* Commission Configuration */}
      <div className="glow-card">
        <div className="glow-card-h"><div>
          <h3>
            <Users className="h-4 w-4" />
            Configuración de Comisiones
          </h3>
          <div className="glow-card-h-sub">Define el tipo y porcentaje de comisión para cada estilista</div>
        </div></div>
        <div className="glow-card-b">
          <div className="space-y-4">
            {stylists.map(stylist => {
              const commission = commissions[stylist.id] || {
                commission_type: "percentage",
                commission_percentage: 0,
                commission_fixed: 0
              };
              
              return (
                <div key={stylist.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={stylist.avatar_url || undefined} />
                    <AvatarFallback style={{ backgroundColor: stylist.color || STYLIST_FALLBACK }}>
                      {stylist.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium min-w-[100px]">{stylist.name}</span>
                  
                  <Select 
                    value={commission.commission_type} 
                    onValueChange={(v) => updateCommission(stylist.id, "commission_type", v)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                      <SelectItem value="fixed">Fijo/servicio</SelectItem>
                      <SelectItem value="mixed">Mixto</SelectItem>
                    </SelectContent>
                  </Select>

                  {(commission.commission_type === "percentage" || commission.commission_type === "mixed") && (
                    <div className="flex items-center gap-1">
                      <input className="glow-input w-20"
                        type="number"
                        value={commission.commission_percentage}
                        onChange={(e) => updateCommission(stylist.id, "commission_percentage", parseFloat(e.target.value) || 0)}
                      />
                      <Percent className="h-4 w-4 text-outline" />
                    </div>
                  )}

                  {(commission.commission_type === "fixed" || commission.commission_type === "mixed") && (
                    <div className="flex items-center gap-1">
                      <input className="glow-input w-20"
                        type="number"
                        step="0.01"
                        value={commission.commission_fixed}
                        onChange={(e) => updateCommission(stylist.id, "commission_fixed", parseFloat(e.target.value) || 0)}
                      />
                      <Euro className="h-4 w-4 text-outline" />
                      <span className="text-xs text-outline">/servicio</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Earnings Report */}
      <div className="glow-card">
        <div className="glow-card-h"><div>
          <div className="flex items-center justify-between">
            <div>
              <h3>
                <TrendingUp className="h-4 w-4" />
                Informe de Comisiones
              </h3>
              <div className="glow-card-h-sub">Cálculo basado en transacciones del período</div>
            </div>
            <input className="glow-input w-40"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div></div>
        <div className="glow-card-b">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{totalSales.toFixed(2)}€</p>
              <p className="text-sm text-outline">Ventas totales</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold text-primary">{totalCommissions.toFixed(2)}€</p>
              <p className="text-sm text-outline">Total comisiones</p>
            </div>
          </div>

          <div className="space-y-3">
            {earnings.map(e => {
              const stylist = stylists.find(s => s.id === e.stylist_id);
              return (
                <div key={e.stylist_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={stylist?.avatar_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: stylist?.color || STYLIST_FALLBACK }}>
                        {e.stylist_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{e.stylist_name}</p>
                      <p className="text-sm text-outline">
                        {e.services_count} servicios · {e.total_sales.toFixed(2)}€ ventas
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-base px-3">
                    {e.commission_earned.toFixed(2)}€
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}