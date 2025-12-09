import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt, History, BarChart3, Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuickPayment } from "./cash-register/QuickPayment";
import { TransactionHistory } from "./cash-register/TransactionHistory";
import { CashRegisterStats } from "./cash-register/CashRegisterStats";
import { DailySummary } from "./cash-register/DailySummary";

export interface Transaction {
  id: string;
  stylist: string;
  customer_name: string;
  services: Array<{ name: string; price: number }>;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: "cash" | "card";
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

export const CashRegisterManager = () => {
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
        },
        () => {
          fetchTodayData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch today's transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      const txs = (transactionsData || []) as Transaction[];
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
    <div className="space-y-6">
      {/* Day Summary Cards */}
      <DailySummary summary={daySummary} onRefresh={fetchTodayData} />

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payment" className="gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Cobrar</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Estadísticas</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="payment" className="mt-0">
              {daySummary.isClosed ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Lock className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Caja cerrada</p>
                  <p className="text-sm">No se pueden registrar más cobros hoy</p>
                </div>
              ) : (
                <QuickPayment onTransactionCreated={handleTransactionCreated} />
              )}
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <TransactionHistory transactions={transactions} onUpdate={fetchTodayData} />
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
