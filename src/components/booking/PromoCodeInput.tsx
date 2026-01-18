import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Promotion } from "@/types/booking";
import { Tag, X, Check, Loader2, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoCodeInputProps {
  tenantId?: string;
  subtotal: number;
  appliedPromotion: Promotion | null;
  onApplyPromotion: (promotion: Promotion | null) => void;
}

export const PromoCodeInput = ({
  tenantId,
  subtotal,
  appliedPromotion,
  onApplyPromotion,
}: PromoCodeInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePromoCode = async () => {
    if (!code.trim() || !tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from("promotions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (fetchError || !data) {
        setError("Código no válido");
        return;
      }

      const promo = data as unknown as Promotion;
      const now = new Date().toISOString();

      // Validar fechas
      if (promo.valid_from && promo.valid_from > now) {
        setError("Este código aún no es válido");
        return;
      }
      if (promo.valid_until && promo.valid_until < now) {
        setError("Este código ha expirado");
        return;
      }

      // Validar usos máximos
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        setError("Este código ha alcanzado el límite de usos");
        return;
      }

      // Validar compra mínima
      if (promo.min_purchase && subtotal < promo.min_purchase) {
        setError(`Compra mínima: ${promo.min_purchase.toFixed(2)} €`);
        return;
      }

      onApplyPromotion(promo);
      setCode("");
    } catch (err) {
      setError("Error al validar el código");
    } finally {
      setLoading(false);
    }
  };

  const removePromotion = () => {
    onApplyPromotion(null);
    setError(null);
  };

  const calculateDiscount = (promo: Promotion): number => {
    if (promo.discount_type === 'percentage') {
      return (subtotal * promo.discount_value) / 100;
    }
    return Math.min(promo.discount_value, subtotal);
  };

  if (appliedPromotion) {
    const discount = calculateDiscount(appliedPromotion);
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Código aplicado
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10"
            onClick={removePromotion}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {appliedPromotion.code}
            </Badge>
            <span className="text-muted-foreground">{appliedPromotion.name}</span>
          </div>
          <span className="font-semibold text-green-600 dark:text-green-400">
            -{discount.toFixed(2)} €
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Tag className="h-4 w-4" />
        <span>¿Tienes un código promocional?</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Introduce tu código"
            className={cn(
              "uppercase font-mono",
              error && "border-destructive"
            )}
            onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
          />
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={validatePromoCode}
          disabled={!code.trim() || loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Percent className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};