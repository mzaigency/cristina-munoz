import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Banknote,
  CreditCard,
  TrendingUp,
  Lock,
  LockOpen,
  RefreshCw,
  Loader2,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DaySummary {
  date: string;
  cashTotal: number;
  cardTotal: number;
  totalSales: number;
  transactionCount: number;
  isClosed: boolean;
}

interface DailySummaryProps {
  summary: DaySummary;
  onRefresh: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export const DailySummary = ({ summary, onRefresh }: DailySummaryProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const { toast } = useToast();

  const handleCloseRegister = async () => {
    try {
      setIsClosing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase.from("cash_register").upsert({
        date: summary.date,
        cash_total: summary.cashTotal,
        card_total: summary.cardTotal,
        total_sales: summary.totalSales,
        transaction_count: summary.transactionCount,
        closed_at: new Date().toISOString(),
        closed_by: user.id,
      }, { onConflict: "date" });
      if (error) throw error;
      toast({ title: "Caja cerrada" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsClosing(false);
      setShowCloseDialog(false);
    }
  };

  const handleReopenRegister = async () => {
    try {
      setIsReopening(true);
      const { error } = await supabase.from("cash_register").update({ closed_at: null, closed_by: null }).eq("date", summary.date);
      if (error) throw error;
      toast({ title: "Caja reabierta" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsReopening(false);
      setShowReopenDialog(false);
    }
  };

  return (
    <>
      <div className="glow-page-h" style={{ marginBottom: 0 }}>
        <div>
          <h2>Caja · {format(new Date(summary.date), "d MMM", { locale: es })}</h2>
          <p>{summary.transactionCount} transacciones</p>
        </div>
        <div className="glow-page-actions">
          <button className="glow-btn glow-btn--sm" onClick={onRefresh}>
            <RefreshCw style={{ width: 13, height: 13 }} />
            <span>Actualizar</span>
          </button>
          {!summary.isClosed && summary.transactionCount > 0 && (
            <button className="glow-btn glow-btn--primary glow-btn--sm" onClick={() => setShowCloseDialog(true)}>
              <Lock style={{ width: 13, height: 13 }} />
              <span>Cerrar caja</span>
            </button>
          )}
          {summary.isClosed && (
            <button className="glow-btn glow-btn--sm" onClick={() => setShowReopenDialog(true)}>
              <LockOpen style={{ width: 13, height: 13 }} />
              <span>Reabrir</span>
            </button>
          )}
        </div>
      </div>

      <div className="glow-kpis">
        <div className="glow-kpi">
          <div className="glow-kpi-top">
            <span className="glow-kpi-ic glow-kpi-ic--ok">
              <Banknote style={{ width: 16, height: 16 }} />
            </span>
          </div>
          <div className="glow-kpi-val">{fmt(summary.cashTotal)}</div>
          <div className="glow-kpi-lbl">Efectivo</div>
        </div>
        <div className="glow-kpi">
          <div className="glow-kpi-top">
            <span className="glow-kpi-ic glow-kpi-ic--brand">
              <CreditCard style={{ width: 16, height: 16 }} />
            </span>
          </div>
          <div className="glow-kpi-val">{fmt(summary.cardTotal)}</div>
          <div className="glow-kpi-lbl">Tarjeta</div>
        </div>
        <div className="glow-kpi">
          <div className="glow-kpi-top">
            <span className="glow-kpi-ic glow-kpi-ic--accent">
              <TrendingUp style={{ width: 16, height: 16 }} />
            </span>
          </div>
          <div className="glow-kpi-val">{fmt(summary.totalSales)}</div>
          <div className="glow-kpi-lbl">Total</div>
        </div>
        <div className="glow-kpi">
          <div className="glow-kpi-top">
            <span className="glow-kpi-ic glow-kpi-ic--warn">
              <Receipt style={{ width: 16, height: 16 }} />
            </span>
          </div>
          <div className="glow-kpi-val">{summary.transactionCount}</div>
          <div className="glow-kpi-lbl">Operaciones</div>
        </div>
      </div>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar la caja de hoy?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez cerrada no se podrán registrar más cobros hoy.
              <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--glow-sunk)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 600 }}>
                  <span>Efectivo</span><span className="glow-mono">{fmt(summary.cashTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 600 }}>
                  <span>Tarjeta</span><span className="glow-mono">{fmt(summary.cardTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, borderTop: "1px solid var(--glow-line-soft)", paddingTop: 8 }}>
                  <span>Total</span><span className="glow-mono" style={{ color: "var(--glow-brand)" }}>{fmt(summary.totalSales)}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClosing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseRegister} disabled={isClosing}>
              {isClosing ? <Loader2 className="glow-spinner-sm" /> : <Lock style={{ width: 14, height: 14, marginRight: 6 }} />}
              Cerrar caja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reabrir la caja?</AlertDialogTitle>
            <AlertDialogDescription>Esto permitirá registrar nuevos cobros para hoy.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReopening}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopenRegister} disabled={isReopening}>
              {isReopening ? <Loader2 className="glow-spinner-sm" /> : <LockOpen style={{ width: 14, height: 14, marginRight: 6 }} />}
              Reabrir caja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
