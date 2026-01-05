import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Banknote, 
  CreditCard, 
  XCircle,
  MoreVertical,
  AlertTriangle,
  UserCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  payment_method: "cash" | "card" | "mixed";
  payment_details?: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  created_by: string;
  voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
  // Enriched audit data
  created_by_name?: string;
  voided_by_name?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onUpdate: () => void;
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
        .update({
          voided: true,
          voided_at: new Date().toISOString(),
          voided_by: user?.id,
        })
        .eq("id", selectedTransaction.id);

      if (error) throw error;

      toast({
        title: "Transacción anulada",
        description: "El cobro se ha anulado correctamente",
      });

      onUpdate();
    } catch (error: any) {
      console.error("Error voiding transaction:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo anular la transacción",
        variant: "destructive",
      });
    } finally {
      setVoidingId(null);
      setShowVoidDialog(false);
      setSelectedTransaction(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay transacciones hoy</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`p-4 rounded-lg border ${transaction.voided ? "opacity-50 bg-muted" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">
                  {format(new Date(transaction.created_at), "HH:mm")}
                </span>
                {transaction.voided && (
                  <Badge variant="destructive" className="text-xs">Anulado</Badge>
                )}
              </div>
              <span className="text-lg font-bold">
                {formatCurrency(transaction.total)}
              </span>
            </div>
            
            {/* Audit info - who did what */}
            <div className="mb-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <UserCircle className="h-3 w-3" />
                <span>Atendió: <strong className="text-foreground">{transaction.stylist}</strong></span>
              </div>
              {transaction.created_by_name && (
                <div className="flex items-center gap-1.5">
                  <span className="ml-4">Cobró: <strong className="text-foreground">{transaction.created_by_name}</strong></span>
                </div>
              )}
              {transaction.voided && transaction.voided_by_name && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <span className="ml-4">Anuló: <strong>{transaction.voided_by_name}</strong></span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              {transaction.payment_method === "cash" ? (
                <Badge variant="outline" className="gap-1">
                  <Banknote className="h-3 w-3" /> Efectivo
                </Badge>
              ) : transaction.payment_method === "card" ? (
                <Badge variant="outline" className="gap-1">
                  <CreditCard className="h-3 w-3" /> Tarjeta
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Banknote className="h-3 w-3" />
                  <CreditCard className="h-3 w-3" /> Mixto
                </Badge>
              )}
              {!transaction.voided && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-destructive border-destructive/50"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowVoidDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Anular
                </Button>
              )}
            </div>
            {transaction.notes && (
              <p className="text-sm text-muted-foreground mt-2">{transaction.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Atendió</TableHead>
              <TableHead>Cobró</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className={transaction.voided ? "opacity-50 line-through" : ""}
              >
                <TableCell className="font-mono text-sm">
                  {format(new Date(transaction.created_at), "HH:mm")}
                  {transaction.voided && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Anulado
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {transaction.stylist}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>
                    {transaction.created_by_name || "-"}
                    {transaction.voided && transaction.voided_by_name && (
                      <div className="text-xs text-destructive mt-0.5">
                        Anuló: {transaction.voided_by_name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.payment_method === "cash" ? (
                    <Badge variant="outline" className="gap-1">
                      <Banknote className="h-3 w-3" />
                      Efectivo
                    </Badge>
                  ) : transaction.payment_method === "card" ? (
                    <Badge variant="outline" className="gap-1">
                      <CreditCard className="h-3 w-3" />
                      Tarjeta
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Banknote className="h-3 w-3" />
                      <CreditCard className="h-3 w-3" />
                      Mixto
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold text-lg">
                  {formatCurrency(transaction.total)}
                </TableCell>
                <TableCell>
                  {!transaction.voided && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowVoidDialog(true);
                          }}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Anular
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Anular esta transacción?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La transacción quedará marcada como
              anulada y no contará en los totales.
              {selectedTransaction && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-semibold text-lg">
                    {formatCurrency(selectedTransaction.total)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedTransaction.created_at), "HH:mm")} - {selectedTransaction.payment_method === "cash" ? "Efectivo" : "Tarjeta"}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!voidingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidTransaction}
              disabled={!!voidingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {voidingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Anulando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Anular transacción
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};