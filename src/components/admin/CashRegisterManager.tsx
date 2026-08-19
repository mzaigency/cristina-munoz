import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Banknote, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuickPayment } from "./cash-register/QuickPayment";
import { TransactionHistory } from "./cash-register/TransactionHistory";

import { DailySummary } from "./cash-register/DailySummary";
import { ExportData } from "./cash-register/ExportData";

export interface Transaction {
  id: string;
  tenant_id?: string | null;
  stylist: string;
  stylist_id?: string | null;
  customer_name: string;
  customer_name_encrypted?: string | null;
  services: Array<{ id?: string; name: string; price: number; quantity?: number; total?: number }>;
  subtotal: number;
  discount: number;
  discount_type?: string | null;
  discount_reason?: string | null;
  total: number;
  tip_amount?: number | null;
  payment_method: "cash" | "card" | "mixed";
  payment_details?: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  created_by: string;
  voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
  // Enriched data for audit display
  created_by_name?: string;
  voided_by_name?: string;
}

export interface DaySummary {
  date: string;
  cashTotal: number;
  cardTotal: number;
  totalSales: number;
  transactionCount: number;
  isClosed: boolean;
}

interface CashRegisterManagerProps {
  tenantId: string;
  /** Qué pantalla de caja se muestra; la fila de pestañas vive en CajaSection */
  view?: "cobrar" | "historial" | "cierre";
}

export const CashRegisterManager = ({ tenantId, view = "cobrar" }: CashRegisterManagerProps) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [daySummary, setDaySummary] = useState<DaySummary>({
    date: format(new Date(), "yyyy-MM-dd"),
    cashTotal: 0,
    cardTotal: 0,
    totalSales: 0,
    transactionCount: 0,
    isClosed: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayData();
    
    // Subscribe to real-time updates
    const transactionsChannel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchTodayData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
    };
  }, [tenantId]);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch today's transactions for this tenant
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Collect unique user IDs for audit info
      const userIds = new Set<string>();
      (transactionsData || []).forEach(tx => {
        if (tx.created_by) userIds.add(tx.created_by);
        if (tx.voided_by) userIds.add(tx.voided_by);
      });

      // Fetch profiles for audit display
      const profilesMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", Array.from(userIds));
        
        if (profiles) {
          profiles.forEach(p => {
            profilesMap[p.id] = p.full_name || p.email;
          });
        }
      }

      const txs = (transactionsData || []).map(tx => ({
        ...tx,
        services: (tx.services as unknown as Transaction['services']) || [],
        payment_method: tx.payment_method as Transaction['payment_method'],
        discount: tx.discount ?? 0,
        voided: tx.voided ?? false,
        payment_details: tx.payment_details as Record<string, unknown> | null,
        created_by_name: profilesMap[tx.created_by] || "Desconocido",
        voided_by_name: tx.voided_by ? (profilesMap[tx.voided_by] || "Desconocido") : undefined,
      })) as Transaction[];
      setTransactions(txs);

      // Calculate summary
      const validTransactions = txs.filter((t) => !t.voided);
      const cashTotal = validTransactions
        .filter((t) => t.payment_method === "cash")
        .reduce((sum, t) => sum + Number(t.total), 0);
      const cardTotal = validTransactions
        .filter((t) => t.payment_method === "card")
        .reduce((sum, t) => sum + Number(t.total), 0);

      // Check if day is closed
      const { data: registerData } = await supabase
        .from("cash_register")
        .select("closed_at")
        .eq("tenant_id", tenantId)
        .eq("date", today)
        .maybeSingle();

      setDaySummary({
        date: today,
        cashTotal,
        cardTotal,
        totalSales: cashTotal + cardTotal,
        transactionCount: validTransactions.length,
        isClosed: !!registerData?.closed_at,
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionCreated = () => {
    fetchTodayData();
    toast({
      title: "Cobro registrado",
      description: "El pago se ha registrado correctamente",
    });
  };

  if (loading) {
    return (
      <div className="glow-loader">
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  const fmtEur = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="glow-fade font-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {view === "cobrar" && (
        <>
          {/* Resumen compacto: lo de hoy de un vistazo, sin comerse la pantalla */}
          <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[22px] font-bold text-ink-2 tabular-nums leading-none">
                {fmtEur(daySummary.totalSales)}
              </p>
              <p className="text-[11px] text-outline mt-1">
                hoy · {daySummary.transactionCount}{" "}
                {daySummary.transactionCount === 1 ? "cobro" : "cobros"}
              </p>
            </div>
            <div className="text-right text-[11px] text-outline leading-relaxed tabular-nums">
              <p className="flex items-center justify-end gap-1">
                <Banknote className="w-3.5 h-3.5 text-success" />
                {fmtEur(daySummary.cashTotal)}
              </p>
              <p className="flex items-center justify-end gap-1">
                <CreditCard className="w-3.5 h-3.5 text-info" />
                {fmtEur(daySummary.cardTotal)}
              </p>
            </div>
          </div>

          {daySummary.isClosed ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <Lock className="w-10 h-10 text-outline/50" />
              <p className="text-[16px] font-semibold text-ink-2">Caja cerrada</p>
              <p className="text-[13px] text-outline">
                No se pueden registrar más cobros hoy. Reábrela desde{" "}
                <strong className="text-ink-2">Cierre</strong>.
              </p>
            </div>
          ) : (
            <QuickPayment onTransactionCreated={handleTransactionCreated} tenantId={tenantId} />
          )}
        </>
      )}

      {view === "historial" && (
        <>
          <TransactionHistory transactions={transactions} onUpdate={fetchTodayData} />
          <ExportData tenantId={tenantId} />
        </>
      )}

      {view === "cierre" && <DailySummary summary={daySummary} onRefresh={fetchTodayData} />}
    </div>
  );
};
