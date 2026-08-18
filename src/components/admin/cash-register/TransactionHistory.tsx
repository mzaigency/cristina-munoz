import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Banknote,
  CreditCard,
  XCircle,
  AlertTriangle,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";
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

interface Transaction {
  id: string;
  tenant_id?: string | null;
  stylist: string;
  stylist_id?: string | null;
  customer_name: string;
  customer_name_encrypted?: string | null;
  services: Array<{ id?: string; name: string; price: number; quantity?: number; total?: number }>;
  subtotal: number;
  discount: number;
  discount_type?: string | null;
  discount_reason?: string | null;
  total: number;
  tip_amount?: number | null;
  payment_method: "cash"|"card"|"mixed";
  payment_details?: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  created_by: string;
  voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
  created_by_name?: string;
  voided_by_name?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR"}).format(n); function PayMethod({ method }: { method: string }) { if (method ==="cash")
    return (
      <span className="gp-badge ok"style={{ display:"inline-flex", alignItems: "center", gap: 3 }}>
        <Banknote style={{ width: 11, height: 11 }} /> Efectivo
      </span>
    );
  if (method === "card")
    return (
      <span className="gp-badge info"style={{ display:"inline-flex", alignItems: "center", gap: 3 }}>
        <CreditCard style={{ width: 11, height: 11 }} /> Tarjeta
      </span>
    );
  return (
    <span className="gp-badge neutral"style={{ display:"inline-flex", alignItems: "center", gap: 3 }}>
      <Banknote style={{ width: 11, height: 11 }} />
      <CreditCard style={{ width: 11, height: 11 }} /> Mixto
    </span>
  );
}

export const TransactionHistory = ({ transactions, onUpdate }: TransactionHistoryProps) => {
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const handleVoidTransaction = async () => {
    if (!selectedTransaction) return;
    try {
      setVoidingId(selectedTransaction.id);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("transactions")
        .update({ voided: true, voided_at: new Date().toISOString(), voided_by: user?.id })
        .eq("id", selectedTransaction.id);
      if (error) throw error;
      toast({ title: "Transacción anulada", description: "El cobro se ha anulado correctamente"}); onUpdate(); } catch (error: any) { toast({ title:"Error", description: error.message || "No se pudo anular la transacción", variant: "destructive" });
    } finally {
      setVoidingId(null);
      setShowVoidDialog(false);
      setSelectedTransaction(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="gp-empty">
        <div className="gp-empty-ic"><UserCircle style={{ width: 24, height: 24 }} /></div>
        <p>Sin transacciones hoy</p>
      </div>
    );
  }

  return (
    <>
      <div className="gp-list">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="gp-row"style={t.voided ? { opacity: 0.45, textDecoration:"line-through"} : {}} > <div style={{ display:"flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <span
                className="gp-mono"style={{ fontSize: 13, fontWeight: 700, color:"var(--gp-muted-c)", flexShrink: 0 }}
              >
                {format(new Date(t.created_at), "HH:mm")}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.stylist}</span>
                  <PayMethod method={t.payment_method} />
                  {t.voided && (
                    <span className="gp-badge danger">Anulado</span>
                  )}
                </div>
                {(t.created_by_name || (t.voided && t.voided_by_name)) && (
                  <div style={{ fontSize: 12, color: "var(--gp-muted-c)", marginTop: 2 }}>
                    {t.created_by_name && <span>Cobró: {t.created_by_name}</span>}
                    {t.voided && t.voided_by_name && (
                      <span style={{ marginLeft: 8, color: "var(--gp-danger)"}}> Anuló: {t.voided_by_name} </span> )} </div> )} {t.notes && ( <p style={{ fontSize: 12, color:"var(--gp-muted-c)", marginTop: 2 }}>{t.notes}</p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span className="gp-mono" style={{ fontSize: 15, fontWeight: 800 }}>{fmt(t.total)}</span>
              {!t.voided && (
                <button
                  className="gp-icon-btn"style={{ color:"var(--gp-danger, #e53e3e)" }}
                  title="Anular"onClick={() => { setSelectedTransaction(t); setShowVoidDialog(true); }} > <XCircle style={{ width: 16, height: 16 }} /> </button> )} </div> </div> ))} </div> <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}> <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle style={{ display:"flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: "var(--gp-danger, #e53e3e)"}} /> ¿Anular esta transacción? </AlertDialogTitle> <AlertDialogDescription> Esta acción no se puede deshacer. La transacción quedará marcada como anulada y no contará en los totales. {selectedTransaction && ( <div style={{ marginTop: 14, padding:"12px 16px", background: "var(--gp-chip)", borderRadius: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>{fmt(selectedTransaction.total)}</p>
                  <p style={{ fontSize: 13, color: "var(--gp-muted-c)", margin: "2px 0 0"}}> {format(new Date(selectedTransaction.created_at),"HH:mm")} ·{" "}
                    {selectedTransaction.payment_method === "cash"?"Efectivo": selectedTransaction.payment_method ==="card"?"Tarjeta":"Mixto"}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!voidingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoidTransaction} disabled={!!voidingId}>
              {voidingId
                ? <Loader2 className="gp-spinner-sm" />
                : <XCircle style={{ width: 14, height: 14, marginRight: 6 }} />}
              Anular transacción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
