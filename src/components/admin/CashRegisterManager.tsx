import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt, History, BarChart3, Lock, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuickPayment } from "./cash-register/QuickPayment";
import { TransactionHistory } from "./cash-register/TransactionHistory";
import { CashRegisterStats } from "./cash-register/CashRegisterStats";
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
}

export const CashRegisterManager = ({ tenantId }: CashRegisterManagerProps) => {
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
  const [activeTab, setActiveTab] = useState("payment");
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

      const txs = (transactionsData || []).map(tx => ({
        ...tx,
        services: (tx.services as unknown as Transaction['services']) || [],
        payment_method: tx.payment_method as Transaction['payment_method'],
        discount: tx.discount ?? 0,
        voided: tx.voided ?? false,
        payment_details: tx.payment_details as Record<string, unknown> | null,
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
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Day Summary Cards */}
      <DailySummary summary={daySummary} onRefresh={fetchTodayData} />

      {/* Main Content Tabs */}
      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="p-2 sm:p-4 pb-0">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="payment" className="gap-1 sm:gap-2 px-2 py-2 sm:py-2.5 text-xs sm:text-sm">
                <Receipt className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Cobrar</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 sm:gap-2 px-2 py-2 sm:py-2.5 text-xs sm:text-sm">
                <History className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-1 sm:gap-2 px-2 py-2 sm:py-2.5 text-xs sm:text-sm">
                <Download className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Exportar</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1 sm:gap-2 px-2 py-2 sm:py-2.5 text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Stats</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-4 sm:pt-6">
            <TabsContent value="payment" className="mt-0">
              {daySummary.isClosed ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
                  <Lock className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-medium">Caja cerrada</p>
                  <p className="text-xs sm:text-sm">No se pueden registrar más cobros hoy</p>
                </div>
              ) : (
                <QuickPayment onTransactionCreated={handleTransactionCreated} tenantId={tenantId} />
              )}
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <TransactionHistory
                transactions={transactions}
                onUpdate={fetchTodayData}
              />
            </TabsContent>
            <TabsContent value="export" className="mt-0">
              <ExportData tenantId={tenantId} />
            </TabsContent>
            <TabsContent value="stats" className="mt-0">
              <CashRegisterStats />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};
