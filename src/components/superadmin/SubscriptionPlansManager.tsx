import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CreditCard, Plus, Edit2, Trash2, Check, X, 
  DollarSign, Users, Layers, Save, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number | null;
  features: string[];
  max_stylists: number;
  max_services: number;
  is_active: boolean;
  sort_order: number;
}

export const SubscriptionPlansManager = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setPlans(data?.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
      })) || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    
    setSaving(true);
    try {
      const planData = {
        name: editingPlan.name,
        slug: editingPlan.slug,
        monthly_price: editingPlan.monthly_price,
        annual_price: editingPlan.annual_price,
        features: editingPlan.features,
        max_stylists: editingPlan.max_stylists,
        max_services: editingPlan.max_services,
        is_active: editingPlan.is_active,
        sort_order: editingPlan.sort_order
      };

      if (editingPlan.id) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);
        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: editingPlan.id ? "Plan actualizado" : "Plan creado"
      });
      
      setIsDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el plan",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Plan eliminado"
      });
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el plan",
        variant: "destructive"
      });
    }
  };

  const openNewPlan = () => {
    setEditingPlan({
      id: '',
      name: '',
      slug: '',
      monthly_price: 0,
      annual_price: null,
      features: [],
      max_stylists: 5,
      max_services: 50,
      is_active: true,
      sort_order: plans.length + 1
    });
    setIsDialogOpen(true);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setIsDialogOpen(true);
  };

  const addFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, '']
    });
  };

  const updateFeature = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({
      ...editingPlan,
      features: newFeatures
    });
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Planes de Suscripción
          </h2>
          <p className="text-muted-foreground">Configura los precios y características de cada plan</p>
        </div>
        <Button onClick={openNewPlan} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden ${!plan.is_active ? 'opacity-60' : ''}`}>
                {!plan.is_active && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">Inactivo</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openEditPlan(plan)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">/{plan.slug}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">€{plan.monthly_price}</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>
                    {plan.annual_price && (
                      <p className="text-sm text-muted-foreground">
                        €{plan.annual_price}/año (ahorra {Math.round((1 - plan.annual_price / (plan.monthly_price * 12)) * 100)}%)
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{plan.max_stylists === 999 ? '∞' : plan.max_stylists}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      <span>{plan.max_services === 999 ? '∞' : plan.max_services}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{plan.features.length - 3} más
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id ? 'Editar Plan' : 'Nuevo Plan'}
            </DialogTitle>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Plan</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    placeholder="Ej: Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (identificador)</Label>
                  <Input
                    value={editingPlan.slug}
                    onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                    placeholder="Ej: premium"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Precio Mensual (€)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPlan.monthly_price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio Anual (€) - opcional</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPlan.annual_price || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, annual_price: parseFloat(e.target.value) || null })}
                    placeholder="Ej: 990"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Máx. Estilistas
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingPlan.max_stylists}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_stylists: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Máx. Servicios
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingPlan.max_services}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_services: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Características
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addFeature}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Añadir
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Ej: Reservas ilimitadas"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                        className="flex-shrink-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div>
                  <Label>Plan Activo</Label>
                  <p className="text-xs text-muted-foreground">Los planes inactivos no se muestran a los usuarios</p>
                </div>
                <Switch
                  checked={editingPlan.is_active}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })}
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label>Orden de visualización</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingPlan.sort_order}
                  onChange={(e) => setEditingPlan({ ...editingPlan, sort_order: parseInt(e.target.value) || 1 })}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving || !editingPlan.name || !editingPlan.slug}
                  className="flex-1 gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
