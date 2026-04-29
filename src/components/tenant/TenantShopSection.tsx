import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Star } from "lucide-react";
import { motion } from "motion/react";
import { ProductDetailDialog, ShopProductDetail } from "./ProductDetailDialog";
import { ShopCart } from "./ShopCart";
import { cn } from "@/lib/utils";

interface TenantShopSectionProps {
  tenantId: string;
  tenantSlug: string;
}

export const TenantShopSection = ({ tenantId, tenantSlug }: TenantShopSectionProps) => {
  const [products, setProducts] = useState<ShopProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ShopProductDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, description, short_description, image_url, price, stock, is_featured, category")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .gt("stock", 0)
        .order("is_featured", { ascending: false })
        .order("name");
      setProducts((data || []) as ShopProductDetail[]);
      setLoading(false);
    };
    load();
  }, [tenantId]);

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <>
      <section id="tienda" className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3 backdrop-blur-sm">
              <ShoppingBag className="h-4 w-4" />
              <span>Nuestra tienda</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Productos exclusivos</h2>
            <div className="h-[2px] w-16 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
            <p className="mt-4 text-muted-foreground max-w-md mx-auto text-sm md:text-base">
              Llévate a casa nuestros favoritos o reserva con tu próxima cita
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 max-w-6xl mx-auto">
            {products.map((p, idx) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.4) }}
                onClick={() => setSelected(p)}
                className={cn(
                  "group relative text-left overflow-hidden rounded-2xl",
                  "bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/40",
                  "shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]",
                  "transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
                )}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                  )}
                  {p.is_featured && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-white" />
                      <span>Destacado</span>
                    </div>
                  )}
                  {p.stock <= 3 && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-background/90 text-foreground text-[10px] font-medium backdrop-blur-sm border">
                      Solo {p.stock}
                    </div>
                  )}
                </div>
                <div className="p-3 md:p-4 space-y-1">
                  <h3 className="font-semibold text-sm md:text-base line-clamp-1">{p.name}</h3>
                  {p.short_description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {p.short_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base md:text-lg font-bold text-primary">
                      {p.price.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <ProductDetailDialog
        product={selected}
        tenantId={tenantId}
        open={!!selected}
        onClose={() => setSelected(null)}
      />

      <ShopCart tenantId={tenantId} tenantSlug={tenantSlug} />
    </>
  );
};
