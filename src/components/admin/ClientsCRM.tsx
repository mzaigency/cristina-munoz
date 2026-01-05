import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  StickyNote,
  History,
  Trash2,
  Edit,
  ChevronRight,
  Loader2,
  UserPlus,
  Users
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  notes: string | null;
  total_visits: number;
  total_spent: number;
  last_visit_at: string | null;
  favorite_stylist_id: string | null;
  created_at: string;
  is_blocked: boolean;
}

interface Booking {
  id: string;
  Fecha: string;
  Hora: string;
  services: unknown;
  stylist: string;
  status: string;
}

interface ClientsCRMProps {
  tenantId: string;
}

const TAG_OPTIONS = ["VIP", "Frecuente", "Nuevo", "Preferente", "Corporativo"];
const TAG_COLORS: Record<string, string> = {
  "VIP": "bg-amber-500/20 text-amber-700 border-amber-500/30",
  "Frecuente": "bg-blue-500/20 text-blue-700 border-blue-500/30",
  "Nuevo": "bg-green-500/20 text-green-700 border-green-500/30",
  "Preferente": "bg-purple-500/20 text-purple-700 border-purple-500/30",
  "Corporativo": "bg-slate-500/20 text-slate-700 border-slate-500/30",
};

export function ClientsCRM({ tenantId }: ClientsCRMProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<Booking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    tags: [] as string[]
  });
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchClients();
  }, [tenantId]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .neq("is_blocked", true) // Filter out blocked clients
        .order("last_visit_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setClients((data || []) as unknown as Client[]);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientHistory = async (clientPhone: string) => {
    if (!clientPhone) return;
    
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, Fecha, Hora, services, stylist, status")
        .eq("tenant_id", tenantId)
        .eq("Telefono", clientPhone)
        .order("Fecha", { ascending: false })
        .limit(20);

      if (error) throw error;
      setClientHistory((data as Booking[]) || []);
    } catch (error) {
      console.error("Error fetching client history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
    if (client.phone) {
      fetchClientHistory(client.phone);
    }
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setFormData({ name: "", phone: "", email: "", notes: "", tags: [] });
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      notes: client.notes || "",
      tags: client.tags || []
    });
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleSaveClient = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        const { error } = await supabase
          .from("clients" as any)
          .update({
            name: formData.name.trim(),
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            notes: formData.notes.trim() || null,
            tags: formData.tags
          })
          .eq("id", editingClient.id);

        if (error) throw error;
        toast({ title: "Cliente actualizado" });
      } else {
        const { error } = await supabase
          .from("clients" as any)
          .insert({
            tenant_id: tenantId,
            name: formData.name.trim(),
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            notes: formData.notes.trim() || null,
            tags: formData.tags
          });

        if (error) throw error;
        toast({ title: "Cliente creado" });
      }

      setIsFormOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
      const { error } = await supabase
        .from("clients" as any)
        .delete()
        .eq("id", clientId);

      if (error) throw error;
      
      toast({ title: "Cliente eliminado" });
      setIsDetailOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive"
      });
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ClientDetail = () => {
    if (!selectedClient) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{selectedClient.name}</h3>
              {selectedClient.phone && (
                <a href={`tel:${selectedClient.phone}`} className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedClient.phone}
                </a>
              )}
              {selectedClient.email && (
                <a href={`mailto:${selectedClient.email}`} className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {selectedClient.email}
                </a>
              )}
            </div>
          </div>

          {selectedClient.tags && selectedClient.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedClient.tags.map(tag => (
                <Badge key={tag} variant="outline" className={TAG_COLORS[tag] || ""}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-lg font-bold text-primary">{selectedClient.total_visits}</p>
              <p className="text-[10px] text-muted-foreground">Visitas</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-lg font-bold text-green-600">{selectedClient.total_spent.toFixed(0)}€</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-lg font-bold text-muted-foreground">
                {selectedClient.last_visit_at 
                  ? format(new Date(selectedClient.last_visit_at), "dd/MM", { locale: es })
                  : "-"
                }
              </p>
              <p className="text-[10px] text-muted-foreground">Última</p>
            </div>
          </div>
        </div>

        {selectedClient.notes && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Notas</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedClient.notes}</p>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Historial de citas</span>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4 pb-4" style={{ height: 'calc(100% - 48px)' }}>
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : clientHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin historial de citas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientHistory.map(booking => {
                  const services = Array.isArray(booking.services) 
                    ? booking.services.map((s: any) => s.name || s).join(", ")
                    : "";
                  return (
                    <div 
                      key={booking.id}
                      className="p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {format(new Date(booking.Fecha), "d MMM yyyy", { locale: es })}
                        </span>
                        <Badge 
                          variant={booking.status === "confirmed" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {booking.status === "confirmed" ? "Confirmada" : booking.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.Hora} - {booking.stylist}
                      </p>
                      {services && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{services}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 border-t flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => handleEditClient(selectedClient)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleDeleteClient(selectedClient.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const ClientForm = () => (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Nombre *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nombre del cliente"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1.5 block">Teléfono</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="612 345 678"
          type="tel"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Email</label>
        <Input
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="cliente@email.com"
          type="email"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Etiquetas</label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={`cursor-pointer transition-all ${
                formData.tags.includes(tag)
                  ? TAG_COLORS[tag]
                  : "opacity-50 hover:opacity-75"
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Notas privadas</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Preferencias, alergias, observaciones..."
          rows={3}
        />
      </div>

      <Button 
        onClick={handleSaveClient} 
        className="w-full"
        disabled={saving}
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {editingClient ? "Guardar cambios" : "Crear cliente"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Clientes
          </h2>
          <p className="text-sm text-muted-foreground">{clients.length} clientes registrados</p>
        </div>
        <Button onClick={handleNewClient} size="sm">
          <UserPlus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium mb-1">
            {searchQuery ? "Sin resultados" : "Sin clientes"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery 
              ? "Prueba con otro término de búsqueda"
              : "Añade tu primer cliente para empezar"
            }
          </p>
          {!searchQuery && (
            <Button onClick={handleNewClient} size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Añadir cliente
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card 
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]"
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{client.name}</h4>
                        {client.tags?.slice(0, 2).map(tag => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${TAG_COLORS[tag] || ""}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {client.phone && <span>{client.phone}</span>}
                        <span>•</span>
                        <span>{client.total_visits} visitas</span>
                        {client.last_visit_at && (
                          <>
                            <span>•</span>
                            <span>Última: {format(new Date(client.last_visit_at), "d MMM", { locale: es })}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {isMobile ? (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent side="right" className="p-0 w-full sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>Detalle del cliente</SheetTitle>
            </SheetHeader>
            <ClientDetail />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-md p-0 max-h-[80vh] overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Detalle del cliente</DialogTitle>
            </DialogHeader>
            <ClientDetail />
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[85vh]">
            <SheetHeader>
              <SheetTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
            </SheetHeader>
            <ClientForm />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            </DialogHeader>
            <ClientForm />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
