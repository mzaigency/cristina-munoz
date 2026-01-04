import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  X, 
  Calendar, 
  CreditCard, 
  Ban,
  Scissors
} from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface QuickActionsFABProps {
  onAction: (actionId: string) => void;
}

export function QuickActionsFAB({ onAction }: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const haptic = useHaptic();

  const actions: QuickAction[] = [
    { 
      id: "new-booking", 
      label: "Nueva cita", 
      icon: <Calendar className="h-5 w-5" />, 
      color: "bg-violet-500" 
    },
    { 
      id: "new-payment", 
      label: "Cobrar", 
      icon: <CreditCard className="h-5 w-5" />, 
      color: "bg-emerald-500" 
    },
    { 
      id: "block-slot", 
      label: "Bloquear", 
      icon: <Ban className="h-5 w-5" />, 
      color: "bg-amber-500" 
    },
    { 
      id: "new-service", 
      label: "Servicio", 
      icon: <Scissors className="h-5 w-5" />, 
      color: "bg-blue-500" 
    },
  ];

  const handleToggle = () => {
    haptic.medium();
    setIsOpen(!isOpen);
  };

  const handleAction = (actionId: string) => {
    haptic.light();
    setIsOpen(false);
    onAction(actionId);
  };

  return (
    <div 
      className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Action items */}
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.3, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.3, 
                  y: 20,
                  transition: { delay: (actions.length - index) * 0.03 }
                }}
                onClick={() => handleAction(action.id)}
                className="flex items-center gap-3 group"
              >
                {/* Label */}
                <span className="px-3 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm shadow-lg text-sm font-medium text-foreground border border-border/50">
                  {action.label}
                </span>
                
                {/* Icon button */}
                <div className={`w-12 h-12 rounded-full ${action.color} shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform`}>
                  {action.icon}
                </div>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={handleToggle}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${
          isOpen 
            ? "bg-muted text-foreground" 
            : "bg-primary text-primary-foreground"
        }`}
        style={{
          boxShadow: isOpen 
            ? "0 4px 20px rgba(0,0,0,0.15)" 
            : "0 4px 20px rgba(139, 92, 246, 0.4)"
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        )}
      </motion.button>
    </div>
  );
}
