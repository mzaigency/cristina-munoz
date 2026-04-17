import { motion } from "framer-motion";
import {
  Calendar,
  Wallet,
  MessageCircle,
  Star,
  Plus,
  CreditCard,
  Ban,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DemoShell } from "./_shared/DemoShell";
import { demoStats } from "./demoData";

/**
 * Clon visual 1:1 del AdminDashboard real.
 * Mismo grid 2x2 con gradientes, mismas Quick Actions, misma tipografía.
 * Los datos son ficticios (demoStats) — no toca Supabase.
 */
const DemoDashboard = () => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  const statCards = [
    {
      id: "bookings",
      label: "Citas hoy",
      value: demoStats.bookingsToday.toString(),
      subtitle: `Próxima: ${demoStats.nextBookingTime} - ${demoStats.nextBookingName}`,
      icon: <Calendar className="h-5 w-5" />,
      color: "from-violet-500 to-purple-600",
    },
    {
      id: "revenue",
      label: "Ingresos hoy",
      value: formatCurrency(demoStats.todayRevenue),
      subtitle: `+${demoStats.weeklyGrowth}% vs semana pasada`,
      icon: <Wallet className="h-5 w-5" />,
      color: "from-emerald-500 to-green-600",
    },
    {
      id: "messages",
      label: "Mensajes",
      value: demoStats.unreadMessages.toString(),
      subtitle: "sin leer",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "from-blue-500 to-cyan-600",
      badge: true,
    },
    {
      id: "reviews",
      label: "Reseñas",
      value: demoStats.pendingReviews.toString(),
      subtitle: "pendientes",
      icon: <Star className="h-5 w-5" />,
      color: "from-amber-500 to-orange-600",
      badge: true,
    },
  ];

  const quickActions = [
    { id: "new-booking", label: "Nueva cita", icon: <Plus className="h-5 w-5" />, color: "bg-primary" },
    { id: "new-payment", label: "Cobrar", icon: <CreditCard className="h-5 w-5" />, color: "bg-emerald-500" },
    { id: "block-slot", label: "Bloquear", icon: <Ban className="h-5 w-5" />, color: "bg-amber-500" },
  ];

  return (
    <DemoShell>
      <div className="space-y-6 p-4 pb-6 bg-background">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-1"
        >
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Buenos días</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </motion.div>

        {/* KPI Cards 2x2 con gradientes */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-2xl p-4 text-left"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90`} />
              <div className="relative z-10 text-white">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    {card.icon}
                  </div>
                  {card.badge && (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  )}
                </div>
                <p className="text-2xl font-bold mb-0.5">{card.value}</p>
                <p className="text-xs font-medium opacity-90">{card.label}</p>
                <p className="text-[10px] opacity-70 mt-1 line-clamp-1">{card.subtitle}</p>
              </div>
              <ArrowRight className="absolute bottom-3 right-3 h-4 w-4 text-white/50" />
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-1">Acciones rápidas</h3>
          <div className="flex gap-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex-1"
              >
                <div className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-border bg-background">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DemoShell>
  );
};

export default DemoDashboard;
