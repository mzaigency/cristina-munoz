import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
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
  Ticket,
  AlertTriangle,
  Share2,
  TrendingUp,
  Sparkles,
  Cake,
  Heart,
  Gift,
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

interface TemplatePreset {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  tone: string;
  data: Partial<Promotion> & {
    name: string;
    discount_type: string;
    discount_value: number;
    code?: string;
  };
}

const PRESETS: TemplatePreset[] = [
  {
    id: "bienvenida",
    label: "Bienvenida",
    description: "10% off para nuevas clientas",
    icon: Sparkles,
    tone: "brand",
    data: { name: "Bienvenida", discount_type: "percentage", discount_value: 10, code: "BIENVENIDA", applies_to: "all"}, }, { id:"cumple",
    label: "Cumpleaños",
    description: "15% off el mes del cumple",
    icon: Cake,
    tone: "rose",
    data: { name: "Cumpleaños", discount_type: "percentage", discount_value: 15, code: "CUMPLE", applies_to: "all"}, }, { id:"reactivar",
    label: "Te echamos de menos",
    description: "20% off para reactivar inactivas",
    icon: Heart,
    tone: "warn",
    data: { name: "Vuelve", discount_type: "percentage", discount_value: 20, code: "VUELVE", applies_to: "services"}, }, { id:"primera",
    label: "Primera visita",
    description: "5€ off mínimo 30€",
    icon: Gift,
    tone: "ok",
    data: { name: "Primera visita", discount_type: "fixed", discount_value: 5, min_purchase: 30, code: "PRIMERA", applies_to: "all" },
  },
];

export function PromotionsManager({ tenantId }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const [showPresets, setShowPresets] = useState(false);
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
    loyalty_points_required: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPromotions();
    fetchSlug();
  }, [tenantId]);

  const fetchSlug = async () => {
    const { data } = await supabase.from("tenants").select("slug").eq("id", tenantId).single();
    if (data?.slug) setTenantSlug(data.slug);
  };

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
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

  const stats = useMemo(() => {
    const now = new Date();
    const active = promotions.filter((p) => {
      if (!p.is_active) return false;
      if (p.valid_until && new Date(p.valid_until) < now) return false;
      return true;
    });
    const totalUses = promotions.reduce((acc, p) => acc + (p.uses_count ?? 0), 0);
    const expiringSoon = active.filter((p) => {
      if (!p.valid_until) return false;
      const diff = differenceInDays(new Date(p.valid_until), now);
      return diff >= 0 && diff <= 7;
    });
    return { active: active.length, total: promotions.length, totalUses, expiringSoon };
  }, [promotions]);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const openCreate = () => {
    setEditingPromotion(null);
    setShowPresets(true);
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
      loyalty_points_required: 0,
    });
    setIsDialogOpen(true);
  };

  const applyPreset = (preset: TemplatePreset) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.data.name,
      code: preset.data.code || prev.code,
      discount_type: preset.data.discount_type,
      discount_value: preset.data.discount_value,
      min_purchase: preset.data.min_purchase ?? 0,
      applies_to: preset.data.applies_to ?? "all",
    }));
    setShowPresets(false);
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setShowPresets(false);
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
      loyalty_points_required: promo.loyalty_points_required,
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
      const payload = {
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
        loyalty_points_required: formData.loyalty_points_required,
      };
      if (editingPromotion) {
        const { error } = await supabase
          .from("promotions")
          .update(payload)
          .eq("id", editingPromotion.id);
        if (error) throw error;
        toast({ title: "Promoción actualizada" });
      } else {
        const { error } = await supabase.from("promotions").insert(payload);
        if (error) throw error;
        toast({ title: "Promoción creada"}); } setIsDialogOpen(false); fetchPromotions(); } catch (e) { const err = e as Error; toast({ title:"Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Promoción eliminada"}); fetchPromotions(); } catch (e) { const err = e as Error; toast({ title:"Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !promo.is_active })
        .eq("id", promo.id);
      if (error) throw error;
      fetchPromotions();
    } catch (e) {
      const err = e as Error;
      toast({ title: "Error", description: err.message, variant: "destructive"}); } }; const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast({ title:"Código copiado"}); }; const sharePromo = (promo: Promotion) => { const link = `https://glowapp.app/${tenantSlug}`; const valueLabel = promo.discount_type ==="percentage"? `${promo.discount_value}%` : `${promo.discount_value}€`; const codePart = promo.code ? ` con el código *${promo.code}*` :"";
    const text = `🎁 ${promo.name}: ${valueLabel} de descuento${codePart}. Reserva aquí: ${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const promoStatus = (p: Promotion): { label: string; tone: string } => {
    const now = new Date();
    if (!p.is_active) return { label: "Inactiva", tone: "neutral"}; if (p.valid_until && new Date(p.valid_until) < now) return { label:"Expirada", tone: "neutral"}; if (p.max_uses && p.uses_count >= p.max_uses) return { label:"Agotada", tone: "neutral"}; if (p.valid_until) { const diff = differenceInDays(new Date(p.valid_until), now); if (diff <= 7 && diff >= 0) return { label: `Quedan ${diff}d`, tone:"warn"}; } return { label:"Activa", tone: "ok"}; }; if (loading) { return ( <div style={{ display:"flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  return (
    <div className="gp-fade gp-mkt-promos">
      <div className="gp-page-h">
        <div>
          <h2>Promociones y Cupones</h2>
          <p>{stats.active} activas · {stats.totalUses} canjes · {stats.total} en total</p>
        </div>
        <div className="gp-page-actions">
          <button className="gp-btn primary sm" onClick={openCreate}>
            <Plus style={{ width: 14, height: 14 }} /> Nueva
          </button>
        </div>
      </div>

      {stats.expiringSoon.length > 0 && (
        <div className="gp-mkt-alert">
          <AlertTriangle style={{ width: 16, height: 16 }} />
          <div>
            <strong>{stats.expiringSoon.length} expira{stats.expiringSoon.length === 1 ? "":"n"} esta semana</strong>
            <span> · {stats.expiringSoon.map((p) => p.name).join(", ")}</span>
          </div>
        </div>
      )}

      {promotions.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><Ticket style={{ width: 24, height: 24 }} /></div>
            <h4>Sin promociones</h4>
            <p>Crea una con plantilla o desde cero</p>
            <button className="gp-btn primary" style={{ marginTop: 12 }} onClick={openCreate}>
              <Plus style={{ width: 14, height: 14 }} /> Crear primera promo
            </button>
          </div>
        </div>
      ) : (
        <div className="gp-mkt-promo-list">
          {promotions.map((promo) => {
            const status = promoStatus(promo);
            const usagePct = promo.max_uses
              ? Math.min(100, Math.round(((promo.uses_count ?? 0) / promo.max_uses) * 100))
              : null;
            return (
              <div
                key={promo.id}
                className={`gp-card pad gp-mkt-promo${!promo.is_active ? " is-off":""}`}
              >
                <div className="gp-mkt-promo-h">
                  <div className="gp-mkt-promo-title">
                    <div className="gp-mkt-promo-discount">
                      {promo.discount_type === "percentage" ? (
                        <>
                          <span>{promo.discount_value}</span>
                          <Percent />
                        </>
                      ) : (
                        <>
                          <span>{promo.discount_value}</span>
                          <small>€</small>
                        </>
                      )}
                    </div>
                    <div>
                      <strong>{promo.name}</strong>
                      <span className={`gp-badge ${status.tone}`}>
                        <span className="pip"style={{ background:"currentColor" }} />
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="gp-mkt-promo-actions">
                    <button className="gp-icon-btn" onClick={() => sharePromo(promo)} title="Compartir">
                      <Share2 style={{ width: 14, height: 14 }} />
                    </button>
                    <button className="gp-icon-btn" onClick={() => openEdit(promo)} title="Editar">
                      <Edit style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      className="gp-icon-btn"style={{ color:"var(--gp-danger)" }}
                      onClick={() => handleDelete(promo.id)}
                      title="Eliminar"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>

                <div className="gp-mkt-promo-meta">
                  {promo.code && (
                    <button className="gp-mkt-code" onClick={() => copyCode(promo.code!)}>
                      <Tag style={{ width: 11, height: 11 }} />
                      {promo.code}
                      <Copy style={{ width: 11, height: 11 }} />
                    </button>
                  )}
                  {promo.min_purchase > 0 && (
                    <span className="gp-mkt-promo-tag">Mín. {promo.min_purchase}€</span>
                  )}
                  {promo.applies_to !== "all" && (
                    <span className="gp-mkt-promo-tag">
                      {promo.applies_to === "services"?"Servicios":"Productos"}
                    </span>
                  )}
                  {promo.valid_until && (
                    <span className="gp-mkt-promo-tag">
                      <Calendar style={{ width: 11, height: 11 }} />
                      Hasta {format(new Date(promo.valid_until), "d MMM", { locale: es })}
                    </span>
                  )}
                </div>

                {(usagePct !== null || promo.uses_count > 0) && (
                  <div className="gp-mkt-promo-usage">
                    <div className="gp-mkt-promo-usage-h">
                      <TrendingUp style={{ width: 12, height: 12 }} />
                      <span>
                        {promo.uses_count} {promo.max_uses ? `/ ${promo.max_uses}` : ""} usos
                      </span>
                    </div>
                    {usagePct !== null && (
                      <div className="gp-mkt-promo-bar">
                        <div className="gp-mkt-promo-bar-fill" style={{ width: `${usagePct}%` }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="gp-mkt-promo-toggle">
                  <span>Activa</span>
                  <Switch checked={promo.is_active} onCheckedChange={() => toggleActive(promo)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Editar Promoción":"Nueva Promoción"}
            </DialogTitle>
          </DialogHeader>

          {showPresets && !editingPromotion && (
            <div className="gp-mkt-preset-grid">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`gp-mkt-preset-tile tone-${p.tone}`}
                    onClick={() => applyPreset(p)}
                  >
                    <span className="gp-mkt-preset-ic">
                      <Icon />
                    </span>
                    <strong>{p.label}</strong>
                    <span>{p.description}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="gp-mkt-preset-tile tone-neutral"
                onClick={() => setShowPresets(false)}
              >
                <span className="gp-mkt-preset-ic">
                  <Sparkles />
                </span>
                <strong>Desde cero</strong>
                <span>Configuración custom</span>
              </button>
            </div>
          )}

          {(!showPresets || editingPromotion) && (
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
                  <button type="button" className="gp-btn sm" onClick={generateCode}>
                    Generar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">% Porcentaje</SelectItem>
                      <SelectItem value="fixed">€ Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Compra mín. (€)</Label>
                  <Input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) =>
                      setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label>Usos máx.</Label>
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
                  <Label>Desde</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Aplica a</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(v) => setFormData({ ...formData, applies_to: v })}
                >
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
                <Label>Activa</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <button type="button" className="gp-btn" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </button>
            {(!showPresets || editingPromotion) && (
              <button type="button" className="gp-btn primary" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="gp-spinner-sm"/>} {editingPromotion ?"Guardar":"Crear"}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
