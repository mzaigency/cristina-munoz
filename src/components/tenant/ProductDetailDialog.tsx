import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Minus, Star, Check } from "lucide-react";
import { useShopCart } from "@/contexts/ShopCartContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export interface ShopProductDetail {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  price: number;
  stock: number;
  is_featured: boolean;
  category: string | null;
}

interface ProductDetailDialogProps {
  product: ShopProductDetail | null;
  tenantId: string;
  open: boolean;
  onClose: () => void;
}

export const ProductDetailDialog = ({ product, tenantId, open, onClose }: ProductDetailDialogProps) => {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, items } = useShopCart();

  useEffect(() => {
    if (open) {
      setQty(1);
      setAdded(false);
    }
  }, [open, product?.id]);

  if (!product) return null;

  const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const maxQty = Math.max(1, product.stock - inCart);

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock,
      },
      tenantId,
      qty
    );
    setAdded(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/40">
        {/* Imagen grande */}
        <div className="relative aspect-square bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <ShoppingBag className="h-20 w-20" />
            </div>
          )}
          {product.is_featured && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-white" />
              Destacado
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div>
            {product.category && (
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{product.category}</p>
            )}
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-2xl font-bold text-primary mt-1">{product.price.toFixed(2)} €</p>
          </div>

          {(product.description || product.short_description) && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description || product.short_description}
            </p>
          )}

          {/* Stock */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {product.stock > 0 ? `Disponibles: ${product.stock}` : "Agotado"}
            </span>
            {inCart > 0 && (
              <span className="text-primary font-medium">{inCart} en tu carrito</span>
            )}
          </div>

          {/* Selector de cantidad */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-muted/50 border">
            <span className="text-sm font-medium pl-2">Cantidad</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-9 w-9 rounded-lg bg-background border flex items-center justify-center hover:bg-muted transition disabled:opacity-30"
                disabled={qty <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="h-9 w-9 rounded-lg bg-background border flex items-center justify-center hover:bg-muted transition disabled:opacity-30"
                disabled={qty >= maxQty}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={product.stock === 0 || maxQty < 1 || added}
            className={cn(
              "w-full h-12 rounded-xl text-base font-semibold transition-all",
              added && "bg-green-600 hover:bg-green-600"
            )}
          >
            <AnimatePresence mode="wait">
              {added ? (
                <motion.span
                  key="ok"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-5 w-5" /> Añadido al carrito
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Añadir al carrito · {(product.price * qty).toFixed(2)} €
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
