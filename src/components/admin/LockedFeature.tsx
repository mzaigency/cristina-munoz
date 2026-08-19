import { useState } from "react";
import { motion } from "motion/react";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { UpgradePrompt } from "./UpgradePrompt";
import { cn } from "@/lib/utils";

interface LockedFeatureProps {
  featureName: string;
  currentPlan: string;
  requiredPlan: string;
  tenantId: string;
  className?: string;
  children?: React.ReactNode;
  variant?: "overlay" | "inline" | "badge";
}

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

export const LockedFeature = ({
  featureName,
  currentPlan,
  requiredPlan,
  tenantId,
  className,
  children,
  variant = "overlay",
}: LockedFeatureProps) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const planName = PLAN_NAMES[requiredPlan] || "Pro";

  if (variant === "badge") {
    return (
      <>
        <button
          onClick={() => setShowUpgrade(true)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
            "bg-glow-warn/10 text-glow-warn-ink",
            "text-xs font-medium cursor-pointer hover:bg-glow-warn/20 transition-colors",
            className
          )}
        >
          <Lock className="w-3 h-3" />
          {planName}
        </button>
        
        <UpgradePrompt
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          currentPlan={currentPlan}
          targetPlan={requiredPlan}
          feature={featureName}
          tenantId={tenantId}
        />
      </>
    );
  }

  if (variant === "inline") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col items-center justify-center p-6 text-center",
            "bg-muted/50 rounded-xl border border-dashed border-border",
            className
          )}
        >
          <div className="w-12 h-12 rounded-full bg-glow-warn/10 flex items-center justify-center mb-3">
            <Crown className="w-6 h-6 text-glow-warn-ink" />
          </div>
          <h4 className="font-semibold text-on-surface mb-1">{featureName}</h4>
          <p className="text-sm text-outline mb-4">
            Disponible en el plan {planName}
          </p>
          <button className="glow-btn glow-btn--primary gap-2" onClick={() => setShowUpgrade(true)}>
            Mejorar a {planName}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <UpgradePrompt
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          currentPlan={currentPlan}
          targetPlan={requiredPlan}
          feature={featureName}
          tenantId={tenantId}
        />
      </>
    );
  }

  // Overlay variant (default)
  return (
    <>
      <div className={cn("relative", className)}>
        {/* Contenido con blur */}
        <div className="opacity-30 pointer-events-none blur-[2px]">
          {children}
        </div>

        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
        >
          <div className="flex flex-col items-center text-center p-6 max-w-xs">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-glow-warn to-glow-warn flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-semibold text-lg text-on-surface mb-1">
              {featureName}
            </h4>
            <p className="text-sm text-outline mb-4">
              Esta función está disponible en el plan {planName}
            </p>
            <button className="glow-btn glow-btn--primary gap-2" onClick={() => setShowUpgrade(true)}>
              <Crown className="w-4 h-4" />
              Mejorar plan
            </button>
          </div>
        </motion.div>
      </div>

      <UpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        currentPlan={currentPlan}
        targetPlan={requiredPlan}
        feature={featureName}
        tenantId={tenantId}
      />
    </>
  );
};
