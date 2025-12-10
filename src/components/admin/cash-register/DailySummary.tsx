import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  Lock, 
  LockOpen,
  RefreshCw,
  Loader2,
  Receipt
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
      
      if (!user) {
        throw new Error("No autenticado");
      }

      const { error } = await supabase
        .from("cash_register")
        .upsert({
          date: summary.date,
          cash_total: summary.cashTotal,
          card_total: summary.cardTotal,
          total_sales: summary.totalSales,
          transaction_count: summary.transactionCount,
          closed_at: new Date().toISOString(),
          closed_by: user.id,
        }, {
          onConflict: "date",
        });

      if (error) throw error;

      toast({
        title: "Caja cerrada",
        description: "El cierre de caja se ha registrado correctamente",
      });
      
      onRefresh();
    } catch (error: any) {
      console.error("Error closing register:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cerrar la caja",
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
      setShowCloseDialog(false);
    }
  };

  const handleReopenRegister = async () => {
    try {
      setIsReopening(true);
      
      const { error } = await supabase
        .from("cash_register")
        .update({
          closed_at: null,
          closed_by: null,
        })
        .eq("date", summary.date);

      if (error) throw error;

      toast({
        title: "Caja reabierta",
        description: "La caja ha sido reabierta correctamente",
      });
      
      onRefresh();
    } catch (error: any) {
      console.error("Error reopening register:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo reabrir la caja",
        variant: "destructive",
      });
    } finally {
      setIsReopening(false);
      setShowReopenDialog(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Caja - {format(new Date(summary.date), "d MMMM yyyy", { locale: es })}
          </h2>
          <p className="text-muted-foreground">
            {summary.transactionCount} transacciones hoy
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {!summary.isClosed && summary.transactionCount > 0 && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setShowCloseDialog(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Cerrar caja
            </Button>
          )}
          {summary.isClosed && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowReopenDialog(true)}
            >
              <LockOpen className="h-4 w-4 mr-2" />
              Reabrir caja
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Banknote className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Efectivo</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(summary.cashTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarjeta</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(summary.cardTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(summary.totalSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Receipt className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operaciones</p>
                <p className="text-lg font-bold text-violet-600">
                  {summary.transactionCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar la caja de hoy?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez cerrada la caja, no se podrán registrar más cobros para el día de hoy.
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Efectivo:</span>
                  <span className="font-semibold">{formatCurrency(summary.cashTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarjeta:</span>
                  <span className="font-semibold">{formatCurrency(summary.cardTotal)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary">{formatCurrency(summary.totalSales)}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClosing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseRegister} disabled={isClosing}>
              {isClosing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Cerrar caja
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reabrir la caja?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto permitirá registrar nuevos cobros para el día de hoy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReopening}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopenRegister} disabled={isReopening}>
              {isReopening ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reabriendo...
                </>
              ) : (
                <>
                  <LockOpen className="h-4 w-4 mr-2" />
                  Reabrir caja
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};