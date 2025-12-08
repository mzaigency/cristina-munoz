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
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  booking_id: string | null;
  stylist: string;
  customer_name: string;
  services: Array<{ name: string; price: number }>;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: "cash" | "card";
  notes: string | null;
  created_at: string;
  created_by: string;
  voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
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
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Estilista</TableHead>
              <TableHead className="hidden md:table-cell">Servicios</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Total</TableHead>
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
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{transaction.customer_name}</span>
                    {transaction.voided && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Anulado
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell capitalize">
                  {transaction.stylist}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {transaction.services.map((s) => s.name).join(", ")}
                  </span>
                </TableCell>
                <TableCell>
                  {transaction.payment_method === "cash" ? (
                    <Badge variant="outline" className="gap-1">
                      <Banknote className="h-3 w-3" />
                      <span className="hidden sm:inline">Efectivo</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <CreditCard className="h-3 w-3" />
                      <span className="hidden sm:inline">Tarjeta</span>
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(transaction.total)}
                  {transaction.discount > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      -{formatCurrency(transaction.discount)}
                    </span>
                  )}
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
                  <p className="font-medium">{selectedTransaction.customer_name}</p>
                  <p className="text-sm">
                    {selectedTransaction.services.map((s) => s.name).join(", ")}
                  </p>
                  <p className="font-semibold mt-2">
                    Total: {formatCurrency(selectedTransaction.total)}
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
