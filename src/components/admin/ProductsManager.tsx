import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        price: product.price.toString(),
        cost: product.cost.toString(),
        category: product.category || "",
        barcode: product.barcode || "",
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
      });
    } else {
      setSelectedProduct(null);
      setFormData({ name: "", description: "", price: "", cost: "", category: "", barcode: "", stock: "0", min_stock: "0" });
    }
    setDialogOpen(true);
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.is_active && p.stock <= p.min_stock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Productos ({products.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="gap-2 w-full sm:w-auto h-11 sm:h-10">
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del producto" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción opcional" />
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
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar producto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Stock bajo en {lowStockProducts.length} producto(s)</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStockProducts.map(p => (
                <Badge key={p.id} variant="outline" className="text-orange-700 border-orange-300">
                  {p.name}: {p.stock} uds
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {products.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {products.map(product => (
              <Card key={product.id} className={!product.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{product.name}</p>
                      {product.barcode && <p className="text-xs text-muted-foreground">{product.barcode}</p>}
                      <Badge variant="secondary" className="mt-1">{product.category || "Sin categoría"}</Badge>
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"} onClick={() => toggleActive(product)} className="cursor-pointer shrink-0 ml-2">
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Coste</p>
                      <p>{formatCurrency(product.cost)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Precio</p>
                      <p className="font-medium">{formatCurrency(product.price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock</p>
                      <p className={product.stock <= product.min_stock ? "text-orange-600 font-medium" : ""}>
                        {product.stock} uds
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-10" onClick={() => openStockDialog(product)}>
                      <PackagePlus className="h-4 w-4 mr-1" /> Stock
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => openDialog(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 text-destructive border-destructive/50"
                      onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Coste</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[140px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => (
                    <TableRow key={product.id} className={!product.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.barcode && <p className="text-xs text-muted-foreground">{product.barcode}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{product.category || "Sin categoría"}</Badge></TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(product.cost)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-right">
                        <span className={product.stock <= product.min_stock ? "text-orange-600 font-medium" : ""}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(product)}>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openStockDialog(product)} title="Entrada de stock">
                            <PackagePlus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDialog(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive"
                            onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay productos configurados</p>
            <p className="text-sm">Añade productos para poder venderlos desde la caja</p>
          </CardContent>
        </Card>
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
              <Button onClick={handleStockEntry} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                Añadir stock
              </Button>
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
