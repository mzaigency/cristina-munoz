import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, Plus, Pencil, Trash2, Package, AlertTriangle, PackagePlus, Star, ImagePlus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  is_featured: boolean;
  price: number;
  cost: number;
  category: string | null;
  barcode: string | null;
  stock: number;
  min_stock: number;
  is_active: boolean;
}

interface ProductsManagerProps {
  tenantId: string;
}

const CATEGORIES = ["Champús", "Tratamientos", "Tintes", "Accesorios", "Styling", "Otros"];

export const ProductsManager = ({ tenantId }: ProductsManagerProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    short_description: "",
    image_url: "",
    is_featured: false,
    price: "",
    cost: "",
    category: "",
    barcode: "",
    stock: "",
    min_stock: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stockEntry, setStockEntry] = useState({
    quantity: "",
    cost: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [tenantId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        short_description: product.short_description || "",
        image_url: product.image_url || "",
        is_featured: product.is_featured || false,
        price: product.price.toString(),
        cost: product.cost.toString(),
        category: product.category || "",
        barcode: product.barcode || "",
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        description: "",
        short_description: "",
        image_url: "",
        is_featured: false,
        price: "",
        cost: "",
        category: "",
        barcode: "",
        stock: "0",
        min_stock: "0",
      });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagen demasiado grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }
    try {
      setUploadingImage(true);
      const ext = file.name.split(".").pop();
      const filePath = `${tenantId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
      setFormData((f) => ({ ...f, image_url: data.publicUrl }));
      toast({ title: "Imagen subida" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const openStockDialog = (product: Product) => {
    setSelectedProduct(product);
    setStockEntry({ quantity: "", cost: product.cost.toString() });
    setStockDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast({ title: "Error", description: "Nombre y precio son obligatorios", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const productData = {
        tenant_id: tenantId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        short_description: formData.short_description.trim() || null,
        image_url: formData.image_url || null,
        is_featured: formData.is_featured,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        category: formData.category || null,
        barcode: formData.barcode.trim() || null,
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
      };

      if (selectedProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", selectedProduct.id);
        if (error) throw error;
        toast({ title: "Producto actualizado" });
      } else {
        const { error } = await supabase.from("products").insert(productData as never);
        if (error) throw error;
        toast({ title: "Producto creado" });
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "No se pudo guardar el producto", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStockEntry = async () => {
    if (!selectedProduct || !stockEntry.quantity) {
      toast({ title: "Error", description: "Introduce la cantidad", variant: "destructive" });
      return;
    }

    const quantity = parseInt(stockEntry.quantity) || 0;
    if (quantity <= 0) {
      toast({ title: "Error", description: "La cantidad debe ser mayor que 0", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const newStock = selectedProduct.stock + quantity;
      const newCost = parseFloat(stockEntry.cost) || selectedProduct.cost;

      const { error } = await supabase
        .from("products")
        .update({ stock: newStock, cost: newCost })
        .eq("id", selectedProduct.id);

      if (error) throw error;
      
      toast({ 
        title: "Stock actualizado", 
        description: `Se añadieron ${quantity} unidades. Stock actual: ${newStock}` 
      });
      setStockDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "No se pudo actualizar el stock", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", selectedProduct.id);
      if (error) throw error;
      toast({ title: "Producto eliminado" });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "destructive" });
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  if (loading) {
    return (
      <div className="glow-loader">
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.is_active && p.stock <= p.min_stock);

  const allCategories = Array.from(
    new Set(products.map((pr) => pr.category || "Sin categoría")),
  ).sort();

  const visibleProducts = products.filter((pr) => {
    const cat = pr.category || "Sin categoría";
    if (catFilter === "low") return pr.is_active && pr.stock <= pr.min_stock;
    if (catFilter !== "all" && cat !== catFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return pr.name.toLowerCase().includes(q) || (pr.barcode || "").toLowerCase().includes(q);
  });

  const grouped = visibleProducts.reduce((acc, pr) => {
    const cat = pr.category || "Sin categoría";
    (acc[cat] ||= []).push(pr);
    return acc;
  }, {} as Record<string, typeof products>);
  const groupNames = Object.keys(grouped).sort();
  const stockValue = products.reduce((a, pr) => a + pr.price * pr.stock, 0);

  return (
    <div className="glow-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="glow-page-h">
        <div>
          <h2>Productos</h2>
          <p>
            {products.length} {products.length === 1 ? "producto" : "productos"}
            {stockValue > 0 && ` · ${formatCurrency(stockValue)} en stock`}
            {lowStockProducts.length > 0 && ` · ${lowStockProducts.length} bajo mínimo`}
          </p>
        </div>
        <div className="glow-page-actions">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="glow-btn glow-btn--primary glow-btn--sm" onClick={() => openDialog()}>
                <Plus style={{ width: 14, height: 14 }} /> Nuevo producto
              </button>
            </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            </DialogHeader>
            <div className="glow-form">
              {/* Imagen */}
              <div className="glow-field">
                <label>Foto del producto</label>
                {formData.image_url ? (
                  <div className="relative w-full aspect-square max-w-[200px] rounded-lg overflow-hidden border bg-muted">
                    <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-[200px] aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 transition">
                    {uploadingImage ? (
                      <Loader2 className="h-6 w-6 animate-spin text-outline" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 text-outline mb-1" />
                        <span className="text-xs text-outline">Subir foto</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                )}
              </div>
              <div className="glow-field">
                <label>Nombre *</label>
                <input className="glow-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del producto" />
              </div>
              <div className="glow-field">
                <label>Descripción corta (tienda)</label>
                <input className="glow-input" value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} placeholder="Una línea para la card de tienda" maxLength={80} />
              </div>
              <div className="glow-field">
                <label>Descripción completa</label>
                <textarea className="glow-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción detallada" rows={3} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-glow-warn-ink" />
                  <div>
                    <p className="text-sm font-medium">Destacar en tienda</p>
                    <p className="text-xs text-outline">Aparecerá primero y en la reserva</p>
                  </div>
                </div>
                <Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} />
              </div>
              <div className="glow-form-grid">
                <div className="glow-field">
                  <label>Precio venta *</label>
                  <input className="glow-input" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="glow-field">
                  <label>Coste</label>
                  <input className="glow-input" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="glow-field">
                <label>Categoría</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="glow-field">
                <label>Código de barras</label>
                <input className="glow-input" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Código de barras" />
              </div>
              <div className="glow-form-grid">
                <div className="glow-field">
                  <label>Stock actual</label>
                  <input className="glow-input" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" />
                </div>
                <div className="glow-field">
                  <label>Stock mínimo</label>
                  <input className="glow-input" type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} placeholder="0" />
                </div>
              </div>
              <button className="glow-btn glow-btn--primary glow-btn--block" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="glow-spinner-sm" />Guardando...</> : "Guardar producto"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {products.length > 0 && (
        <div className="glow-toolbar">
          <input
            className="glow-input"
            placeholder="Buscar producto o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={`glow-chip${catFilter === "all" ? " glow-chip--on" : ""}`}
            onClick={() => setCatFilter("all")}
          >
            Todos
          </button>
          {lowStockProducts.length > 0 && (
            <button
              className={`glow-chip${catFilter === "low" ? " glow-chip--on" : ""}`}
              onClick={() => setCatFilter("low")}
            >
              Stock bajo · {lowStockProducts.length}
            </button>
          )}
          {allCategories.map((c) => (
            <button
              key={c}
              className={`glow-chip${catFilter === c ? " glow-chip--on" : ""}`}
              onClick={() => setCatFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="glow-card">
          <div className="glow-empty">
            <div className="glow-empty-ic"><Package style={{ width: 24, height: 24 }} /></div>
            <h4>Sin productos</h4>
            <p>Añade productos para poder venderlos desde la caja.</p>
            <button className="glow-btn glow-btn--primary" onClick={() => openDialog()}>
              <Plus style={{ width: 14, height: 14 }} /> Añadir producto
            </button>
          </div>
        </div>
      ) : groupNames.length === 0 ? (
        <div className="glow-card">
          <div className="glow-empty">
            <div className="glow-empty-ic"><Package style={{ width: 24, height: 24 }} /></div>
            <h4>Sin resultados</h4>
            <p>Ningún producto coincide con la búsqueda.</p>
            <button className="glow-btn" onClick={() => { setSearch(""); setCatFilter("all"); }}>
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : (
        /* Una sola matriz: las categorías son cabecera de grupo. Antes había una
           lista de tarjetas para móvil y una tabla distinta para escritorio. */
        <div className="glow-card glow-card--clip">
          {groupNames.map((cat) => (
            <div key={cat}>
              <div className="glow-group">
                <span className="glow-group-dot" style={{ background: "var(--glow-line)" }} />
                <span>{cat}</span>
                <span className="glow-group-n">
                  {grouped[cat].length} {grouped[cat].length === 1 ? "producto" : "productos"}
                </span>
              </div>
              {grouped[cat].map((product) => {
                const low = product.is_active && product.stock <= product.min_stock;
                return (
                  <div
                    key={product.id}
                    className="glow-row"
                    style={!product.is_active ? { opacity: 0.55 } : undefined}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="glow-row-nm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.name}
                      </div>
                      <div className="glow-row-mt">
                        {low ? (
                          <span style={{ color: "var(--glow-warn-ink)", fontWeight: 800 }}>
                            Stock {product.stock} · mínimo {product.min_stock}
                          </span>
                        ) : (
                          <>Stock {product.stock}</>
                        )}
                        {product.barcode && ` · ${product.barcode}`}
                      </div>
                    </div>
                    <button
                      className={`glow-badge${product.is_active ? " glow-badge--ok" : ""}`}
                      style={{ cursor: "pointer", border: "none", fontFamily: "inherit", flex: "none" }}
                      onClick={() => toggleActive(product)}
                    >
                      {product.is_active ? "Activo" : "Inactivo"}
                    </button>
                    <div className="glow-row-amt">{formatCurrency(product.price)}</div>
                    <div className="glow-row-actions">
                      <button className="glow-icon-btn" aria-label="Entrada de stock" onClick={() => openStockDialog(product)}>
                        <PackagePlus style={{ width: 14, height: 14 }} />
                      </button>
                      <button className="glow-icon-btn" aria-label={`Editar ${product.name}`} onClick={() => openDialog(product)}>
                        <Pencil style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        className="glow-icon-btn"
                        aria-label={`Eliminar ${product.name}`}
                        style={{ color: "var(--glow-danger-ink)" }}
                        onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Stock Entry Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5" />
              Entrada de stock
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="glow-form">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-outline">Stock actual: {selectedProduct.stock} unidades</p>
              </div>
              <div className="glow-field">
                <label>Cantidad a añadir *</label>
                <input className="glow-input text-center text-lg" 
                  type="number" 
                  value={stockEntry.quantity} 
                  onChange={(e) => setStockEntry({ ...stockEntry, quantity: e.target.value })} 
                  placeholder="Ej: 10"
                />
              </div>
              <div className="glow-field">
                <label>Precio de compra (opcional)</label>
                <input className="glow-input" 
                  type="number" 
                  step="0.01"
                  value={stockEntry.cost} 
                  onChange={(e) => setStockEntry({ ...stockEntry, cost: e.target.value })} 
                  placeholder="0.00"
                />
                <p className="text-xs text-outline">Se actualizará el coste del producto</p>
              </div>
              <button className="glow-btn glow-btn--primary glow-btn--block" onClick={handleStockEntry} disabled={saving}>
                {saving ? <Loader2 className="glow-spinner-sm" /> : <PackagePlus style={{ width: 14, height: 14, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />}
                Añadir stock
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el producto "{selectedProduct?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
