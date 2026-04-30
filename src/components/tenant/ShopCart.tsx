import { useState, useEffect } from "react";
import { useShopCart } from "@/contexts/ShopCartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, X, Plus, Minus, Trash2, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShopCartProps {
  tenantId: string;
  tenantSlug: string;
}

export const ShopCart = ({ tenantId }: ShopCartProps) => {
  const { items, totalQty, totalPrice, updateQty, removeItem, clear } = useShopCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Auto-cargar datos del usuario logueado desde su perfil
  useEffect(() => {
    if (!user || profileLoaded) return;
    (async () => {
      const metaName = (user.user_metadata?.full_name as string) || "";
      const metaPhone = (user.user_metadata?.phone as string) || "";
      let finalName = metaName;
      let finalPhone = metaPhone;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          finalName = (data as any).full_name || finalName;
          finalPhone = (data as any).phone || finalPhone;
        }
      } catch {}
      if (finalName) setName(finalName);
      if (finalPhone) setPhone(finalPhone);
      setProfileLoaded(true);
    })();
  }, [user, profileLoaded]);

  if (totalQty === 0 && !open) return null;

  const handleSubmit = async () => {
    const finalName = name.trim() || (user?.user_metadata?.full_name as string) || user?.email || "";
    const finalPhone = phone.trim();
    if (!finalName) {
      toast({ title: "Necesitamos tu nombre", variant: "destructive" });
      return;
    }
    if (!finalPhone) {
      toast({ title: "Necesitamos un teléfono de contacto", variant: "destructive" });
      return;
    }

    setCheckingOut(true);
    try {
      const { error } = await supabase.from("product_orders").insert({
        tenant_id: tenantId,
        user_id: user?.id ?? null,
        customer_name: finalName,
        customer_phone: finalPhone,
        items: items.map((i) => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: totalPrice,
        status: "pending",
        pickup_type: "pickup",
        notes: notes.trim() || null,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        clear();
        setOpen(false);
        setSuccess(false);
        setName("");
        setPhone("");
        setNotes("");
      }, 1800);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "No se pudo procesar el pedido",
        description: err.message?.includes("Stock") ? err.message : "Inténtalo de nuevo",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <AnimatePresence>
        {totalQty > 0 && (
          <motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            onClick={() => setOpen(true)}
            className={cn(
              "fixed z-40 right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] md:bottom-6",
              "h-14 px-5 rounded-full bg-primary text-primary-foreground",
              "shadow-2xl shadow-primary/40 backdrop-blur-xl",
              "flex items-center gap-3 font-semibold"
            )}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalQty}
              </span>
            </div>
            <span>{totalPrice.toFixed(2)} €</span>
          </motion.button>
        )}
      </AnimatePresence>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-0 bg-background/95 backdrop-blur-xl"
        >
          <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Tu carrito ({totalQty})
              </SheetTitle>
            </SheetHeader>

            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12 text-center space-y-3"
              >
                <div className="mx-auto h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold">¡Pedido enviado!</h3>
                <p className="text-sm text-muted-foreground">
                  El salón recibirá tu pedido y se pondrá en contacto contigo.
                </p>
              </motion.div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border"
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-sm text-primary font-semibold">{item.price.toFixed(2)} €</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive/70 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Datos contacto */}
                {user && name && phone ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
                    <UserIcon className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-medium text-foreground truncate">{name}</p>
                      <p className="text-muted-foreground">{phone}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Datos de tu cuenta</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tu nombre *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Teléfono *</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="612 345 678" type="tel" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Notas (opcional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo a tener en cuenta..." rows={2} />
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">{totalPrice.toFixed(2)} €</span>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={checkingOut}
                  className="w-full h-12 rounded-xl text-base font-semibold"
                >
                  {checkingOut ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Enviar pedido al salón"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Recogida en el salón. El salón se pondrá en contacto contigo.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
