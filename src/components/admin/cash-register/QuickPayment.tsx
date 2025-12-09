import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Banknote, CreditCard, Delete, CheckCircle2, Calculator } from "lucide-react";

interface QuickPaymentProps {
  onTransactionCreated: () => void;
}

export const QuickPayment = ({ onTransactionCreated }: QuickPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

  const { toast } = useToast();

  const numericAmount = parseFloat(amount) || 0;
  const numericCashGiven = parseFloat(cashGiven) || 0;
  const change = numericCashGiven - numericAmount;

  const handleKeyPress = (key: string) => {
    if (key === "delete") {
      setAmount(amount.slice(0, -1));
    } else if (key === "clear") {
      setAmount("");
      setCashGiven("");
    } else if (key === ".") {
      if (!amount.includes(".")) {
        setAmount(amount + key);
      }
    } else {
      // Limit decimals to 2
      const parts = amount.split(".");
      if (parts[1] && parts[1].length >= 2) return;
      setAmount(amount + key);
    }
  };

  const handleCashKeyPress = (key: string) => {
    if (key === "delete") {
      setCashGiven(cashGiven.slice(0, -1));
    } else if (key === "clear") {
      setCashGiven("");
    } else if (key === ".") {
      if (!cashGiven.includes(".")) {
        setCashGiven(cashGiven + key);
      }
    } else {
      const parts = cashGiven.split(".");
      if (parts[1] && parts[1].length >= 2) return;
      setCashGiven(cashGiven + key);
    }
  };

  const handleQuickCash = (value: number) => {
    setCashGiven(value.toString());
  };

  const handleSubmit = async () => {
    if (numericAmount <= 0) {
      toast({
        title: "Error",
        description: "Introduce un importe válido",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "cash" && numericCashGiven > 0 && numericCashGiven < numericAmount) {
      toast({
        title: "Error",
        description: "El efectivo entregado es menor que el importe",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No autenticado");
      }

      const { error } = await supabase.from("transactions").insert({
        stylist: "peluqueria",
        customer_name: "Cliente",
        services: [{ name: "Servicio", price: numericAmount }],
        subtotal: numericAmount,
        discount: 0,
        total: numericAmount,
        payment_method: paymentMethod,
        notes:
          paymentMethod === "cash" && numericCashGiven > 0
            ? `Entregado: ${formatCurrency(numericCashGiven)}, Cambio: ${formatCurrency(change)}`
            : null,
        created_by: user.id,
      });

      if (error) throw error;

      // Reset form
      setAmount("");
      setCashGiven("");

      onTransactionCreated();
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el cobro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const keypadButtons = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "delete"];

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={paymentMethod === "cash" ? "default" : "outline"}
          className="h-14 text-lg gap-2"
          onClick={() => setPaymentMethod("cash")}
        >
          <Banknote className="h-5 w-5" />
          Efectivo
        </Button>
        <Button
          variant={paymentMethod === "card" ? "default" : "outline"}
          className="h-14 text-lg gap-2"
          onClick={() => setPaymentMethod("card")}
        >
          <CreditCard className="h-5 w-5" />
          Tarjeta
        </Button>
      </div>

      {/* Amount Display */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <Label className="text-sm text-muted-foreground">Importe a cobrar</Label>
          <div className="text-4xl font-bold text-primary text-center mt-2">
            {amount ? formatCurrency(numericAmount) : "0,00 €"}
          </div>
        </CardContent>
      </Card>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {keypadButtons.map((key) => (
          <Button
            key={key}
            variant="outline"
            className="h-14 text-xl font-semibold"
            onClick={() => handleKeyPress(key)}
          >
            {key === "delete" ? <Delete className="h-5 w-5" /> : key}
          </Button>
        ))}
      </div>

      <Button variant="ghost" className="w-full" onClick={() => handleKeyPress("clear")}>
        Borrar todo
      </Button>

      {/* Cash Change Calculator - Only show when cash is selected */}
      {paymentMethod === "cash" && numericAmount > 0 && (
        <Card className="border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Calculator className="h-4 w-4" />
              <Label className="text-sm font-medium">Calcular cambio</Label>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Efectivo entregado</Label>
              <Input
                type="text"
                value={cashGiven}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setCashGiven(val);
                }}
                placeholder="0,00"
                className="text-lg font-semibold text-center mt-1"
              />
            </div>

            {/* Quick cash buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickCash(value)}
                  className="text-sm"
                >
                  {value}€
                </Button>
              ))}
            </div>

            {numericCashGiven >= numericAmount && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-center">
                <span className="text-sm text-muted-foreground">Cambio a devolver</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(change)}
                </div>
              </div>
            )}

            {numericCashGiven > 0 && numericCashGiven < numericAmount && (
              <div className="p-3 bg-destructive/10 rounded-lg text-center">
                <span className="text-sm text-destructive">
                  Faltan {formatCurrency(numericAmount - numericCashGiven)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button onClick={handleSubmit} disabled={loading || numericAmount <= 0} className="w-full h-14 text-lg" size="lg">
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Cobrar {numericAmount > 0 ? formatCurrency(numericAmount) : ""}
          </>
        )}
      </Button>
    </div>
  );
};
