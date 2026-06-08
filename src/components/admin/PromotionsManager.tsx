import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 style={{ width: 28, height: 28, color: "var(--gp-accent)", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="gp-page-h">
        <div>
          <h2>Promociones y Cupones</h2>
          <p>{promotions.length} promociones</p>
        </div>
        <div className="gp-page-actions">
          <button className="gp-btn primary sm" onClick={handleOpenCreate}>
            <Plus style={{ width: 14, height: 14 }} /> Nueva
          </button>
        </div>
      </div>

      {promotions.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><Ticket style={{ width: 24, height: 24 }} /></div>
            <h4>Sin promociones</h4>
            <p>No hay promociones todavía</p>
            <button className="gp-btn primary" style={{ marginTop: 12 }} onClick={handleOpenCreate}>
              <Plus style={{ width: 14, height: 14 }} /> Crear primera promoción
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {promotions.map(promo => (
            <div key={promo.id} className="gp-card pad" style={!promo.is_active ? { opacity: 0.55 } : {}}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gp-ink)" }}>{promo.name}</span>
                    {!promo.is_active && <span className="gp-badge neutral"><span className="pip" style={{ background: "currentColor" }} />Inactivo</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <span className="gp-badge accent">
                      {promo.discount_type === "percentage" ? (
                        <><Percent style={{ width: 11, height: 11 }} />{promo.discount_value}%</>
                      ) : (
                        <>{promo.discount_value} €</>
                      )}
                    </span>
                    {promo.code && (
                      <button
                        className="gp-badge neutral"
                        style={{ cursor: "pointer", border: "1px solid var(--gp-line2)", background: "none", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}
                        onClick={() => copyCode(promo.code!)}
                      >
                        <Tag style={{ width: 11, height: 11 }} />
                        {promo.code}
                        <Copy style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                    {promo.valid_until && (
                      <span style={{ fontSize: 12.5, color: "var(--gp-muted-c)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar style={{ width: 12, height: 12 }} />
                        Hasta {format(new Date(promo.valid_until), "d MMM", { locale: es })}
                      </span>
                    )}
                    {promo.max_uses && (
                      <span style={{ fontSize: 12.5, color: "var(--gp-muted-c)" }}>
                        {promo.uses_count}/{promo.max_uses} usos
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="gp-icon-btn" onClick={() => handleOpenEdit(promo)}>
                    <Edit style={{ width: 14, height: 14 }} />
                  </button>
                  <button className="gp-icon-btn" style={{ color: "var(--gp-danger)" }} onClick={() => handleDelete(promo.id)}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </div>
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
                <button className="gp-btn sm" onClick={generateCode}>Generar</button>
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
            <button className="gp-btn" onClick={() => setIsDialogOpen(false)}>Cancelar</button>
            <button className="gp-btn primary" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 style={{ width: 14, height: 14, animation: "spin 0.7s linear infinite", display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />}
              {editingPromotion ? "Guardar" : "Crear"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}