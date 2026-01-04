import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Percent,
  Tag,
  Calendar,
  Trash2,
  Edit,
  Copy,
  Loader2,
  Gift,
  Ticket
} from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  code: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applies_to: string;
  loyalty_points_required: number;
}

interface PromotionsManagerProps {
  tenantId: string;
}

export function PromotionsManager({ tenantId }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    min_purchase: 0,
    max_uses: "",
    valid_from: format(new Date(), "yyyy-MM-dd"),
    valid_until: "",
    is_active: true,
    applies_to: "all",
    loyalty_points_required: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPromotions();
  }, [tenantId]);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromotions((data || []) as unknown as Promotion[]);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleOpenCreate = () => {
    setEditingPromotion(null);
    setFormData({
      name: "",
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      min_purchase: 0,
      max_uses: "",
      valid_from: format(new Date(), "yyyy-MM-dd"),
      valid_until: "",
      is_active: true,
      applies_to: "all",
      loyalty_points_required: 0
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      name: promo.name,
      code: promo.code || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_purchase: promo.min_purchase,
      max_uses: promo.max_uses?.toString() || "",
      valid_from: promo.valid_from ? format(new Date(promo.valid_from), "yyyy-MM-dd") : "",
      valid_until: promo.valid_until ? format(new Date(promo.valid_until), "yyyy-MM-dd") : "",
      is_active: promo.is_active,
      applies_to: promo.applies_to,
      loyalty_points_required: promo.loyalty_points_required
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const promoData = {
        tenant_id: tenantId,
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_purchase: formData.min_purchase,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
        applies_to: formData.applies_to,
        loyalty_points_required: formData.loyalty_points_required
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from("promotions" as any)
          .update(promoData)
          .eq("id", editingPromotion.id);
        if (error) throw error;
        toast({ title: "Promoción actualizada" });
      } else {
        const { error } = await supabase
          .from("promotions" as any)
          .insert(promoData);
        if (error) throw error;
        toast({ title: "Promoción creada" });
      }

      setIsDialogOpen(false);
      fetchPromotions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    
    try {
      const { error } = await supabase
        .from("promotions" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Promoción eliminada" });
      fetchPromotions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Promociones y Cupones
          </h2>
          <p className="text-sm text-muted-foreground">{promotions.length} promociones</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nueva
        </Button>
      </div>

      {promotions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay promociones todavía</p>
            <Button onClick={handleOpenCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crear primera promoción
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {promotions.map(promo => (
            <Card key={promo.id} className={!promo.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{promo.name}</h3>
                      {!promo.is_active && (
                        <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline" className="gap-1">
                        {promo.discount_type === "percentage" ? (
                          <><Percent className="h-3 w-3" />{promo.discount_value}%</>
                        ) : (
                          <>{promo.discount_value}€</>
                        )}
                      </Badge>
                      
                      {promo.code && (
                        <Badge 
                          variant="secondary" 
                          className="gap-1 cursor-pointer hover:bg-secondary/80"
                          onClick={() => copyCode(promo.code!)}
                        >
                          <Tag className="h-3 w-3" />
                          {promo.code}
                          <Copy className="h-3 w-3" />
                        </Badge>
                      )}
                      
                      {promo.valid_until && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Hasta {format(new Date(promo.valid_until), "d MMM", { locale: es })}
                        </span>
                      )}
                      
                      {promo.max_uses && (
                        <span className="text-xs text-muted-foreground">
                          {promo.uses_count}/{promo.max_uses} usos
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(promo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(promo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPromotion ? "Editar Promoción" : "Nueva Promoción"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Black Friday 2024"
              />
            </div>

            <div>
              <Label>Código promocional</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BLACKFRIDAY"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={generateCode}>Generar</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de descuento</Label>
                <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Fijo (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Compra mínima (€)</Label>
                <Input
                  type="number"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Usos máximos</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Válido desde</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Válido hasta</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Aplica a</Label>
              <Select value={formData.applies_to} onValueChange={(v) => setFormData({ ...formData, applies_to: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="services">Solo servicios</SelectItem>
                  <SelectItem value="products">Solo productos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Promoción activa</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPromotion ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}