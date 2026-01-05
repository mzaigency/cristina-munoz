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
  Mail,
  Calendar,
  Trash2,
  Bell,
  CheckCircle,
  Loader2,
  ListOrdered,
  User
} from "lucide-react";

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
    // In production, this would send a notification (SMS, WhatsApp, etc.)
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

  const getPriorityBadge = (priority: number) => {
    if (priority >= 2) return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Alta</Badge>;
    if (priority === 1) return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">Media</Badge>;
    return <Badge variant="outline">Normal</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "notified":
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Notificado</Badge>;
      case "booked":
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Reservado</Badge>;
      default:
        return <Badge variant="secondary">Esperando</Badge>;
    }
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
            <ListOrdered className="h-5 w-5 text-primary" />
            Lista de Espera
          </h2>
          <p className="text-sm text-muted-foreground">{entries.length} en espera</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay clientes en lista de espera</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      <h3 className="font-semibold truncate">{entry.client_name}</h3>
                      {getPriorityBadge(entry.priority)}
                      {getStatusBadge(entry.status)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {entry.client_phone ? (
                        <a href={`tel:${entry.client_phone}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="h-3 w-3" />
                          {entry.client_phone}
                        </a>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Glowapp
                        </span>
                      )}
                      {entry.client_email && (
                        <a href={`mailto:${entry.client_email}`} className="flex items-center gap-1 hover:text-foreground">
                          <Mail className="h-3 w-3" />
                          {entry.client_email}
                        </a>
                      )}
                    </div>

                    {entry.preferred_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        Prefiere: {format(new Date(entry.preferred_date), "d MMM", { locale: es })}
                        {entry.preferred_time_start && ` ${entry.preferred_time_start}`}
                        {entry.preferred_time_end && `-${entry.preferred_time_end}`}
                      </div>
                    )}

                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{entry.notes}"</p>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Añadido {format(new Date(entry.created_at), "d MMM HH:mm", { locale: es })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {entry.status === "waiting" && (
                      <Button variant="outline" size="sm" onClick={() => handleNotify(entry)}>
                        <Bell className="h-4 w-4 mr-1" />
                        Notificar
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleMarkBooked(entry.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Reservado
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(entry.id)}>
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
            <DialogTitle>Añadir a Lista de Espera</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="612 345 678 (opcional)"
                type="tel"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                placeholder="email@ejemplo.com"
                type="email"
              />
            </div>

            <div>
              <Label>Fecha preferida</Label>
              <Input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora desde</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_start}
                  onChange={(e) => setFormData({ ...formData, preferred_time_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora hasta</Label>
                <Input
                  type="time"
                  value={formData.preferred_time_end}
                  onChange={(e) => setFormData({ ...formData, preferred_time_end: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Estilista preferido</Label>
              <Select value={formData.preferred_stylist_id || "none"} onValueChange={(v) => setFormData({ ...formData, preferred_stylist_id: v === "none" ? "" : v })}>
                <SelectTrigger>
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
              <Label>Prioridad</Label>
              <Select value={formData.priority.toString()} onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Normal</SelectItem>
                  <SelectItem value="1">Media</SelectItem>
                  <SelectItem value="2">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}