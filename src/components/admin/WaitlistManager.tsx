import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Clock,
  Phone,
  Calendar,
  Trash2,
  Bell,
  CheckCircle,
  Loader2,
  ListOrdered,
  Smartphone,
  MessageCircle,
  ChevronRight,
  User,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WaitlistEntry {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  user_id: string | null;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  preferred_stylist_id: string | null;
  services: any[];
  priority: number;
  status: string;
  notified_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Stylist {
  id: string;
  name: string;
}

interface WaitlistManagerProps {
  tenantId: string;
}

export function WaitlistManager({ tenantId }: WaitlistManagerProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    preferred_date: "",
    preferred_time_start: "",
    preferred_time_end: "",
    preferred_stylist_id: "",
    priority: 0,
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const [waitlistRes, stylistsRes] = await Promise.all([
        supabase
          .from("waitlist" as any)
          .select("*")
          .eq("tenant_id", tenantId)
          .in("status", ["waiting", "notified"])
          .order("priority", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("tenant_stylists")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
      ]);

      if (waitlistRes.error) throw waitlistRes.error;
      setEntries((waitlistRes.data || []) as unknown as WaitlistEntry[]);
      setStylists(stylistsRes.data || []);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.client_name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .insert({
          tenant_id: tenantId,
          client_name: formData.client_name.trim(),
          client_phone: formData.client_phone.trim() || null,
          client_email: formData.client_email.trim() || null,
          preferred_date: formData.preferred_date || null,
          preferred_time_start: formData.preferred_time_start || null,
          preferred_time_end: formData.preferred_time_end || null,
          preferred_stylist_id: formData.preferred_stylist_id || null,
          priority: formData.priority,
          notes: formData.notes.trim() || null
        });

      if (error) throw error;
      
      toast({ title: "Añadido a lista de espera" });
      setIsDialogOpen(false);
      setFormData({
        client_name: "",
        client_phone: "",
        client_email: "",
        preferred_date: "",
        preferred_time_start: "",
        preferred_time_end: "",
        preferred_stylist_id: "",
        priority: 0,
        notes: ""
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNotify = async (entry: WaitlistEntry) => {
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .update({ 
          status: "notified", 
          notified_at: new Date().toISOString() 
        })
        .eq("id", entry.id);

      if (error) throw error;
      toast({ title: "Cliente notificado", description: `Se ha notificado a ${entry.client_name}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleMarkBooked = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .update({ status: "booked" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Marcado como reservado" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar de la lista de espera?")) return;
    
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Eliminado de la lista" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getPriorityIndicator = (priority: number) => {
    if (priority >= 2) return <div className="w-1 h-full bg-red-500 absolute left-0 top-0 rounded-l-xl" />;
    if (priority === 1) return <div className="w-1 h-full bg-amber-500 absolute left-0 top-0 rounded-l-xl" />;
    return null;
  };

  const getStatusBadge = (entry: WaitlistEntry) => {
    if (entry.status === "notified") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 border-blue-500/30">
          <Bell className="h-2.5 w-2.5 mr-0.5" />
          Avisado
        </Badge>
      );
    }
    return null;
  };

  const getContactIcon = (entry: WaitlistEntry) => {
    if (entry.user_id) {
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <Smartphone className="h-3.5 w-3.5" />
          <span className="text-xs">App</span>
        </div>
      );
    }
    if (entry.client_phone) {
      return (
        <a href={`tel:${entry.client_phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span className="text-xs">{entry.client_phone}</span>
        </a>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        <span className="text-xs">Sin contacto</span>
      </div>
    );
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <ListOrdered className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Lista de Espera</h2>
            <p className="text-xs text-muted-foreground">{entries.length} esperando</p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm" className="rounded-full h-9 px-4">
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </Button>
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Sin clientes en espera</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los clientes pueden unirse cuando no haya huecos disponibles
            </p>
          </CardContent>
        </Card>
      ) : (
        /* List */
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <Card key={entry.id} className="relative overflow-hidden">
              {getPriorityIndicator(entry.priority)}
              <CardContent className="p-3 pl-4">
                <div className="flex items-center gap-3">
                  {/* Position indicator */}
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm truncate">{entry.client_name}</h3>
                      {getStatusBadge(entry)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {getContactIcon(entry)}
                      
                      {entry.preferred_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {format(new Date(entry.preferred_date), "d MMM", { locale: es })}
                            {entry.preferred_time_start && ` · ${entry.preferred_time_start.slice(0, 5)}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="text-[11px] text-muted-foreground mt-1 truncate italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {entry.user_id && entry.status === "waiting" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => handleNotify(entry)}
                        title="Enviar mensaje"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => handleMarkBooked(entry.id)}
                      title="Marcar como reservado"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {entry.client_phone && (
                          <DropdownMenuItem asChild>
                            <a href={`tel:${entry.client_phone}`} className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              Llamar
                            </a>
                          </DropdownMenuItem>
                        )}
                        {entry.status === "waiting" && !entry.user_id && entry.client_phone && (
                          <DropdownMenuItem onClick={() => handleNotify(entry)}>
                            <Bell className="h-4 w-4 mr-2" />
                            Marcar notificado
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(entry.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info card */}
      {entries.length > 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
                <Bell className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">Aviso automático</p>
                <p className="text-[11px] text-muted-foreground">
                  Cuando se cancele una cita, los clientes con la app recibirán un mensaje automático si hay hueco para su fecha preferida.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Añadir a Lista de Espera
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Nombre del cliente *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Nombre completo"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="612 345 678 (opcional)"
                type="tel"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Fecha preferida</Label>
              <Input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Desde</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_start}
                  onChange={(e) => setFormData({ ...formData, preferred_time_start: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_end}
                  onChange={(e) => setFormData({ ...formData, preferred_time_end: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Profesional preferido</Label>
              <Select 
                value={formData.preferred_stylist_id || "none"} 
                onValueChange={(v) => setFormData({ ...formData, preferred_stylist_id: v === "none" ? "" : v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sin preferencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin preferencia</SelectItem>
                  {stylists.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Prioridad</Label>
              <Select 
                value={formData.priority.toString()} 
                onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Normal
                    </span>
                  </SelectItem>
                  <SelectItem value="1">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Media
                    </span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Alta
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
