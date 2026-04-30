import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Plus, Minus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface AddonProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  short_description: string | null;
  stock: number;
  is_featured: boolean;
}

export interface SelectedAddon {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BookingProductsAddonProps {
  tenantId: string;
  selected: SelectedAddon[];
  onChange: (items: SelectedAddon[]) => void;
}

export const BookingProductsAddon = ({ tenantId, selected, onChange }: BookingProductsAddonProps) => {
  const [products, setProducts] = useState<AddonProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, short_description, stock, is_featured")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .gt("stock", 0)
        .order("is_featured", { ascending: false })
        .order("name")
        .limit(8);
      setProducts((data || []) as AddonProduct[]);
      setLoading(false);
    };
    load();
  }, [tenantId]);

  const getQty = (id: string) => selected.find((s) => s.product_id === id)?.quantity ?? 0;

  const setQty = (p: AddonProduct, qty: number) => {
    const clamped = Math.max(0, Math.min(qty, p.stock));
    const others = selected.filter((s) => s.product_id !== p.id);
    if (clamped === 0) {
      onChange(others);
    } else {
      onChange([...others, { product_id: p.id, name: p.name, price: p.price, quantity: clamped }]);
    }
  };

  if (loading || products.length === 0) return null;

  const totalAddons = selected.reduce((s, i) => s + i.quantity * i.price, 0);

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">¿Añadir algún producto?</p>
            <p className="text-xs text-muted-foreground">
              {selected.length > 0
                ? `${selected.length} producto${selected.length > 1 ? "s" : ""} · ${totalAddons.toFixed(2)} €`
                : "Recógelos en tu cita"}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-primary flex-shrink-0">
          {expanded ? "Ocultar" : "Ver"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.map((p) => {
                const qty = getQty(p.id);
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "relative rounded-xl bg-card border overflow-hidden transition-all",
                      qty > 0 ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                    )}
                  >
                    <div className="aspect-square bg-muted/40 relative">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-xs font-semibold line-clamp-2 leading-snug min-h-[2rem]">
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold tabular-nums">{p.price.toFixed(2)} €</span>
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => setQty(p, 1)}
                            className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setQty(p, qty - 1)}
                              className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center active:scale-95"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(p, qty + 1)}
                              disabled={qty >= p.stock}
                              className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 disabled:opacity-40"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
