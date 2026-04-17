import { motion } from "framer-motion";
import {
  Banknote,
  CreditCard,
  TrendingUp,
  Receipt,
  Lock,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DemoShell } from "./_shared/DemoShell";
import { demoStats, demoTransactions } from "./demoData";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

/**
 * Clon visual del CashRegisterManager + DailySummary + TransactionHistory.
 * - 4 tarjetas (Efectivo / Tarjeta / Total / Operaciones) con sus gradientes exactos
 * - Tabs Cobro / Historial / Resumen
 * - Lista de transacciones con badges
 */
const DemoCashRegister = () => {
  return (
    <DemoShell>
      <div className="bg-background min-h-full p-4 space-y-4">
        {/* Header igual a DailySummary */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground truncate">
              Caja - {format(new Date(), "d MMM", { locale: es })}
            </h2>
            <p className="text-xs text-muted-foreground">
              {demoStats.transactionCount} transacciones
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <div className="h-8 w-8 rounded-md border border-border flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground flex items-center gap-1.5 text-xs font-medium">
              <Lock className="h-3.5 w-3.5" /> Cerrar
            </div>
          </div>
        </div>

        {/* 4 tarjetas idénticas a DailySummary */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-emerald-200/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 shrink-0">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">Efectivo</p>
                <p className="text-base font-bold text-emerald-600 truncate">
                  {formatCurrency(demoStats.cashTotal)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-lg border border-blue-200/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">Tarjeta</p>
                <p className="text-base font-bold text-blue-600 truncate">
                  {formatCurrency(demoStats.cardTotal)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="text-base font-bold text-primary truncate">
                  {formatCurrency(demoStats.todayRevenue)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-lg border border-violet-200/50 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-violet-500/20 shrink-0">
                <Receipt className="h-4 w-4 text-violet-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">Operaciones</p>
                <p className="text-base font-bold text-violet-600">
                  {demoStats.transactionCount}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs estilo admin */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <div className="flex-1 text-center py-1.5 rounded-md bg-background text-xs font-medium shadow-sm">
            Historial
          </div>
          <div className="flex-1 text-center py-1.5 rounded-md text-xs text-muted-foreground">
            Cobro
          </div>
          <div className="flex-1 text-center py-1.5 rounded-md text-xs text-muted-foreground">
            Resumen
          </div>
        </div>

        {/* Lista transacciones (clon de TransactionHistory mobile) */}
        <div className="space-y-2">
          {demoTransactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="p-3 rounded-lg border border-border"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-medium">{tx.time}</span>
                <span className="text-base font-bold">{formatCurrency(tx.amount)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mb-2">
                Atendió: <strong className="text-foreground">{tx.stylist}</strong> · {tx.client}
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border text-[10px]">
                {tx.method === "cash" ? (
                  <>
                    <Banknote className="h-3 w-3" /> Efectivo
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3 w-3" /> Tarjeta
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DemoShell>
  );
};

export default DemoCashRegister;
