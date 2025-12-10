import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Banknote, 
  CreditCard, 
  Delete,
  CheckCircle2,
  Calculator
} from "lucide-react";

interface QuickPaymentProps {
  onTransactionCreated: () => void;
}

export const QuickPayment = ({ onTransactionCreated }: QuickPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [notes, setNotes] = useState("");
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
      setNotes("");
    } else if (key === ".") {
      if (!amount.includes(".")) {
        setAmount(amount + key);
      }
    } else {
      const parts = amount.split(".");
      if (parts[1] && parts[1].length >= 2) return;
      setAmount(amount + key);
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No autenticado");
      }

      const cashInfo = paymentMethod === "cash" && numericCashGiven > 0 
        ? `Entregado: ${formatCurrency(numericCashGiven)}, Cambio: ${formatCurrency(change)}`
        : null;
      const combinedNotes = [cashInfo, notes.trim()].filter(Boolean).join(" | ") || null;

      const { error } = await supabase.from("transactions").insert({
        stylist: "peluqueria",
        customer_name: "Cliente",
        services: [{ name: "Servicio", price: numericAmount }],
        subtotal: numericAmount,
        discount: 0,
        total: numericAmount,
        payment_method: paymentMethod,
        notes: combinedNotes,
        created_by: user.id,
      });

      if (error) throw error;

      setAmount("");
      setCashGiven("");
      setNotes("");
      
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

  const keypadButtons = [
    "7", "8", "9",
    "4", "5", "6",
    "1", "2", "3",
    ".", "0", "delete"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Amount & Keypad */}
      <div className="space-y-4">
        {/* Amount Display */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
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
              className="h-12 text-xl font-semibold"
              onClick={() => handleKeyPress(key)}
            >
              {key === "delete" ? <Delete className="h-5 w-5" /> : key}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => handleKeyPress("clear")}
        >
          Borrar todo
        </Button>
      </div>

      {/* Right Column - Payment Options & Actions */}
      <div className="space-y-4">
        {/* Payment Method Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={paymentMethod === "cash" ? "default" : "outline"}
            className="h-12 gap-2"
            onClick={() => setPaymentMethod("cash")}
          >
            <Banknote className="h-4 w-4" />
            Efectivo
          </Button>
          <Button
            variant={paymentMethod === "card" ? "default" : "outline"}
            className="h-12 gap-2"
            onClick={() => setPaymentMethod("card")}
          >
            <CreditCard className="h-4 w-4" />
            Tarjeta
          </Button>
        </div>

        {/* Cash Change Calculator */}
        {paymentMethod === "cash" && (
          <Card className="border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Calculator className="h-4 w-4" />
                <Label className="text-sm font-medium">Calcular cambio</Label>
              </div>
              
              <Input
                type="text"
                value={cashGiven}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setCashGiven(val);
                }}
                placeholder="Efectivo entregado"
                className="text-center font-semibold"
              />

              <div className="grid grid-cols-4 gap-1">
                {[5, 10, 20, 50].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickCash(value)}
                    className="text-xs h-8"
                  >
                    {value}€
                  </Button>
                ))}
              </div>

              {numericCashGiven >= numericAmount && numericAmount > 0 && (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground">Cambio</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(change)}
                  </div>
                </div>
              )}

              {numericCashGiven > 0 && numericCashGiven < numericAmount && (
                <div className="p-2 bg-destructive/10 rounded-lg text-center">
                  <span className="text-sm text-destructive">
                    Faltan {formatCurrency(numericAmount - numericCashGiven)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes Field */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 200))}
            placeholder="Añadir comentario..."
            className="resize-none h-16 text-sm"
            maxLength={200}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || numericAmount <= 0}
          className="w-full h-12 text-lg"
          size="lg"
        >
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
    </div>
  );
};
