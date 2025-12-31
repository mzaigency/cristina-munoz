import { motion } from "motion/react";
import { 
  Calendar, 
  Heart, 
  MessageCircle, 
  Search, 
  Sparkles,
  Store,
  Image,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/useHaptic";

type EmptyStateType = 
  | "no-bookings" 
  | "no-favorites" 
  | "no-messages" 
  | "no-results" 
  | "no-salons"
  | "no-photos"
  | "no-notifications"
  | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const configs: Record<EmptyStateType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}> = {
  "no-bookings": {
    icon: <Calendar className="h-12 w-12" />,
    title: "Sin citas próximas",
    description: "Explora salones y reserva tu primera cita. ¡Te esperamos!",
    gradient: "from-violet-500 to-purple-500",
  },
  "no-favorites": {
    icon: <Heart className="h-12 w-12" />,
    title: "Sin favoritos aún",
    description: "Toca el corazón en los salones que más te gusten para guardarlos aquí.",
    gradient: "from-rose-500 to-pink-500",
  },
  "no-messages": {
    icon: <MessageCircle className="h-12 w-12" />,
    title: "Sin mensajes",
    description: "Aquí aparecerán tus conversaciones con los salones.",
    gradient: "from-blue-500 to-cyan-500",
  },
  "no-results": {
    icon: <Search className="h-12 w-12" />,
    title: "Sin resultados",
    description: "No encontramos lo que buscas. Prueba con otros términos.",
    gradient: "from-amber-500 to-orange-500",
  },
  "no-salons": {
    icon: <Store className="h-12 w-12" />,
    title: "Sin salones disponibles",
    description: "Pronto habrá más salones en tu zona. ¡Vuelve pronto!",
    gradient: "from-emerald-500 to-teal-500",
  },
  "no-photos": {
    icon: <Image className="h-12 w-12" />,
    title: "Sin fotos",
    description: "Aquí aparecerán las fotos cuando se añadan.",
    gradient: "from-indigo-500 to-violet-500",
  },
  "no-notifications": {
    icon: <Bell className="h-12 w-12" />,
    title: "Sin notificaciones",
    description: "Aquí verás las novedades y recordatorios de tus citas.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  "generic": {
    icon: <Sparkles className="h-12 w-12" />,
    title: "Nada por aquí",
    description: "Este espacio está vacío por ahora.",
    gradient: "from-gray-500 to-slate-500",
  },
};

export function EmptyState({
  type = "generic",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  const config = configs[type];
  const haptic = useHaptic();

  const handleAction = () => {
    haptic.selection();
    onAction?.();
  };

  const handleSecondaryAction = () => {
    haptic.selection();
    onSecondaryAction?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      {/* Animated icon with gradient background */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={`mb-6 p-5 rounded-full bg-gradient-to-br ${config.gradient} text-white shadow-lg`}
      >
        <motion.div
          animate={{ 
            y: [0, -3, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {config.icon}
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        {title || config.title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-xs mb-6"
      >
        {description || config.description}
      </motion.p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {actionLabel && onAction && (
            <Button onClick={handleAction} className="min-w-[140px]">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              variant="outline" 
              onClick={handleSecondaryAction}
              className="min-w-[140px]"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
