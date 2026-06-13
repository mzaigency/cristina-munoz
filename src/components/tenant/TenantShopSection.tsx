import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Star } from "lucide-react";
import { motion } from "motion/react";
import { ProductDetailDialog, ShopProductDetail } from "./ProductDetailDialog";
import { ShopCart } from "./ShopCart";
import { cn } from "@/lib/utils";
import { supabaseImage } from "@/lib/supabaseImage";

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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
            {products.map((p, idx) => (
              <motion.button
                key={p.id}
                data-fixed-radius
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.3) }}
                onClick={() => setSelected(p)}
                style={{ borderRadius: "1rem" }}
                className={cn(
                  "group relative text-left overflow-hidden",
                  "bg-card border border-border/60",
                  "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.10)]",
                  "transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 active:scale-[0.98]",
                  "flex flex-col"
                )}
              >
                <div className="relative aspect-square overflow-hidden bg-muted/40">
                  {p.image_url ? (
                    <img
                      src={supabaseImage(p.image_url, { width: 400 })}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <ShoppingBag className="h-10 w-10" strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 pointer-events-none">
                    {p.is_featured ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold tracking-wide flex items-center gap-1 shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-white" strokeWidth={0} />
                        TOP
                      </span>
                    ) : <span />}
                    {p.stock <= 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-background/90 text-foreground text-[10px] font-medium backdrop-blur-sm border border-border/60 shadow-sm">
                        {p.stock} uds
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-1 flex-1">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                    {p.name}
                  </h3>
                  {p.short_description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {p.short_description}
                    </p>
                  )}
                  <div className="mt-auto pt-2 flex items-baseline justify-between">
                    <span className="text-base font-bold text-foreground tabular-nums">
                      {p.price.toFixed(2)}<span className="text-xs font-medium text-muted-foreground ml-0.5">€</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver →
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
