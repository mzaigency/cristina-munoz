import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";

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
      <div className="gp-loader">
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.is_active && p.stock <= p.min_stock);

  return (
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="gp-page-h">
        <div>
          <h2>Productos</h2>
          <p>{products.length} productos</p>
        </div>
        <div className="gp-page-actions">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="gp-btn primary sm" onClick={() => openDialog()}>
                <Plus style={{ width: 14, height: 14 }} /> Nuevo producto
              </button>
            </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Imagen */}
              <div className="space-y-2">
                <Label>Foto del producto</Label>
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
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Subir foto</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del producto" />
              </div>
              <div className="space-y-2">
                <Label>Descripción corta (tienda)</Label>
                <Input value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} placeholder="Una línea para la card de tienda" maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label>Descripción completa</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción detallada" rows={3} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Destacar en tienda</p>
                    <p className="text-xs text-muted-foreground">Aparecerá primero y en la reserva</p>
                  </div>
                </div>
                <Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio venta *</Label>
                  <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Coste</Label>
                  <Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Código de barras</Label>
                <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Código de barras" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stock actual</Label>
                  <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Stock mínimo</Label>
                  <Input type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} placeholder="0" />
                </div>
              </div>
              <button className="gp-btn primary block" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="gp-spinner-sm" />Guardando...</> : "Guardar producto"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="gp-card pad" style={{ borderColor: "color-mix(in oklab, var(--gp-warn), white 40%)", background: "var(--gp-warn-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--gp-warn)", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--gp-ink)" }}>Stock bajo en {lowStockProducts.length} producto(s)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {lowStockProducts.map(p => (
              <span key={p.id} className="gp-badge warn">{p.name}: {p.stock} uds</span>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="flex flex-col gap-3 md:hidden">
            {products.map(product => (
              <div key={product.id} className="gp-card pad" style={!product.is_active ? { opacity: 0.55 } : {}}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                    {product.barcode && <p style={{ fontSize: 12, color: "var(--gp-muted-c)", margin: "2px 0 0" }}>{product.barcode}</p>}
                    <span className="gp-badge neutral" style={{ marginTop: 6, display: "inline-flex" }}>{product.category || "Sin categoría"}</span>
                  </div>
                  <button
                    className={`gp-badge${product.is_active ? " ok" : " neutral"}`}
                    style={{ cursor: "pointer", border: "none", fontFamily: "inherit", flexShrink: 0, marginLeft: 8 }}
                    onClick={() => toggleActive(product)}
                  >
                    <span className="pip" style={{ background: "currentColor" }} />
                    {product.is_active ? "Activo" : "Inactivo"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {[
                    { label: "Coste", val: formatCurrency(product.cost), warn: false },
                    { label: "Precio", val: formatCurrency(product.price), warn: false },
                    { label: "Stock", val: `${product.stock} uds`, warn: product.stock <= product.min_stock },
                  ].map(({ label, val, warn }) => (
                    <div key={label}>
                      <p style={{ fontSize: 11.5, color: "var(--gp-muted-c)", margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0, color: warn ? "var(--gp-warn)" : "var(--gp-ink)" }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="gp-btn sm" style={{ flex: 1 }} onClick={() => openStockDialog(product)}>
                    <PackagePlus style={{ width: 13, height: 13 }} /> Stock
                  </button>
                  <button className="gp-icon-btn" onClick={() => openDialog(product)}>
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                  <button className="gp-icon-btn" style={{ color: "var(--gp-danger)" }} onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="gp-card hidden md:block" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gp-line2)" }}>
                  {["Producto", "Categoría", "Coste", "Precio", "Stock", "Estado", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--gp-muted-c)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} style={{ borderBottom: "1px solid var(--gp-line2)", opacity: !product.is_active ? 0.55 : 1 }}>
                    <td style={{ padding: "10px 14px" }}>
                      <p style={{ fontWeight: 600, margin: 0 }}>{product.name}</p>
                      {product.barcode && <p style={{ fontSize: 12, color: "var(--gp-muted-c)", margin: 0 }}>{product.barcode}</p>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span className="gp-badge neutral">{product.category || "Sin categoría"}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13.5, color: "var(--gp-muted-c)" }}>{formatCurrency(product.cost)}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: product.stock <= product.min_stock ? 700 : 400, color: product.stock <= product.min_stock ? "var(--gp-warn)" : "var(--gp-ink)" }}>
                        {product.stock}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        className={`gp-badge${product.is_active ? " ok" : " neutral"}`}
                        style={{ cursor: "pointer", border: "none", fontFamily: "inherit" }}
                        onClick={() => toggleActive(product)}
                      >
                        <span className="pip" style={{ background: "currentColor" }} />
                        {product.is_active ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="gp-icon-btn" onClick={() => openStockDialog(product)} title="Entrada de stock">
                          <PackagePlus style={{ width: 14, height: 14 }} />
                        </button>
                        <button className="gp-icon-btn" onClick={() => openDialog(product)}>
                          <Pencil style={{ width: 14, height: 14 }} />
                        </button>
                        <button className="gp-icon-btn" style={{ color: "var(--gp-danger)" }} onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><Package style={{ width: 24, height: 24 }} /></div>
            <h4>Sin productos</h4>
            <p>Añade productos para poder venderlos desde la caja</p>
          </div>
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
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">Stock actual: {selectedProduct.stock} unidades</p>
              </div>
              <div className="space-y-2">
                <Label>Cantidad a añadir *</Label>
                <Input 
                  type="number" 
                  value={stockEntry.quantity} 
                  onChange={(e) => setStockEntry({ ...stockEntry, quantity: e.target.value })} 
                  placeholder="Ej: 10"
                  className="text-center text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio de compra (opcional)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={stockEntry.cost} 
                  onChange={(e) => setStockEntry({ ...stockEntry, cost: e.target.value })} 
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Se actualizará el coste del producto</p>
              </div>
              <button className="gp-btn primary block" onClick={handleStockEntry} disabled={saving}>
                {saving ? <Loader2 className="gp-spinner-sm" /> : <PackagePlus style={{ width: 14, height: 14, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />}
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
