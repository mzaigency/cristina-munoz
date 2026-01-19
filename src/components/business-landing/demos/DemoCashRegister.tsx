import { motion } from "motion/react";
import { CreditCard, Banknote, TrendingUp, Receipt } from "lucide-react";
import { demoTransactions, demoStats } from "./demoData";

const DemoCashRegister = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-border/50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Caja del día</h3>
            <p className="text-xs text-muted-foreground">Domingo, 19 Enero</p>
          </div>
          <div className="text-right">
            <motion.div 
              className="text-xl font-bold text-green-500"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {demoStats.todayRevenue}€
            </motion.div>
            <div className="text-[10px] text-green-500 flex items-center gap-0.5 justify-end">
              <TrendingUp className="w-3 h-3" />
              +12% vs ayer
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-3 border-b border-border/30">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2.5 rounded-xl text-xs font-semibold"
          >
            <CreditCard className="w-4 h-4" />
            Cobrar tarjeta
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-xs font-semibold"
          >
            <Banknote className="w-4 h-4" />
            Cobrar efectivo
          </motion.button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="p-3 grid grid-cols-3 gap-2 border-b border-border/30">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold">{demoStats.bookingsToday}</div>
          <div className="text-[9px] text-muted-foreground">Citas</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold">{demoStats.avgTicket}€</div>
          <div className="text-[9px] text-muted-foreground">Ticket medio</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-blue-500">65%</div>
          <div className="text-[9px] text-muted-foreground">Tarjeta</div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="p-3">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Últimos cobros</h4>
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
          {demoTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-center justify-between p-2 bg-muted/20 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  tx.method === "card" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                }`}>
                  {tx.method === "card" ? (
                    <CreditCard className="w-3.5 h-3.5" />
                  ) : (
                    <Banknote className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium">{tx.client}</div>
                  <div className="text-[10px] text-muted-foreground">{tx.service}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold">{tx.amount}€</div>
                <div className="text-[10px] text-muted-foreground">{tx.time}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/30 px-4 py-2 border-t border-border/30 flex items-center justify-center gap-2">
        <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Ver historial completo</span>
      </div>
    </motion.div>
  );
};

export default DemoCashRegister;
