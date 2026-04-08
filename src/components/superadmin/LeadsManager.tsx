import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Filter, SlidersHorizontal, MessageSquare, Calendar,
  Building2, Phone, Mail, MapPin, Loader2, ChevronDown, X, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Lead = {
  id: string;
  created_at: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string | null;
  services: string[] | null;
  status: string;
  notes: string | null;
  updated_at: string;
};

const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "contactado", label: "Contactado", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "en_proceso", label: "En proceso", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "convertido", label: "Convertido", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "descartado", label: "Descartado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
];

const getStatusMeta = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

export const LeadsManager = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("b2b_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los leads", variant: "destructive" });
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  }, [filterStatus, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStatus = async (leadId: string, newStatus: string) => {
    const { error } = await supabase
      .from("b2b_leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
      return;
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("b2b_leads")
      .update({ notes: editNotes || null })
      .eq("id", selectedLead.id);

    if (error) {
      toast({ title: "Error", description: "No se pudieron guardar las notas", variant: "destructive" });
    } else {
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: editNotes || null } : l))
      );
      setSelectedLead((prev) => prev ? { ...prev, notes: editNotes || null } : null);
      toast({ title: "Notas guardadas" });
    }
    setSavingNotes(false);
  };

  const deleteLead = async (leadId: string) => {
    const { error } = await supabase
      .from("b2b_leads")
      .delete()
      .eq("id", leadId);

    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
      return;
    }

    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);
    toast({ title: "Lead eliminado" });
  };

  const filtered = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.business_name.toLowerCase().includes(q) ||
      lead.contact_name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.city || "").toLowerCase().includes(q)
    );
  });

  const counts = leads.reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <Card
            key={s.value}
            className={`p-3 cursor-pointer transition-all border ${
              filterStatus === s.value ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => setFilterStatus(filterStatus === s.value ? "all" : s.value)}
          >
            <p className="text-2xl font-bold text-foreground">{counts[s.value] || 0}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {filterStatus !== "all" && (
          <Button variant="outline" size="sm" onClick={() => setFilterStatus("all")} className="gap-1.5">
            <X className="w-3.5 h-3.5" />
            Limpiar filtro
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No hay leads{filterStatus !== "all" ? ` con estado "${getStatusMeta(filterStatus).label}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => {
            const meta = getStatusMeta(lead.status);
            return (
              <Card
                key={lead.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-border"
                onClick={() => {
                  setSelectedLead(lead);
                  setEditNotes(lead.notes || "");
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{lead.business_name}</h3>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${meta.color} border-0`}>
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{lead.contact_name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </span>
                      {lead.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {lead.city}
                        </span>
                      )}
                    </div>
                    {lead.services && lead.services.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {lead.services.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(lead.created_at), "dd MMM yyyy", { locale: es })}
                    </p>
                    {lead.notes && (
                      <MessageSquare className="w-3.5 h-3.5 text-primary mt-1 ml-auto" />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        {selectedLead && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {selectedLead.business_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Contacto</p>
                  <p className="font-medium text-foreground">{selectedLead.contact_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Fecha</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(selectedLead.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <a href={`mailto:${selectedLead.email}`} className="font-medium text-primary text-xs break-all">
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Teléfono</p>
                  <a href={`tel:${selectedLead.phone}`} className="font-medium text-primary">
                    {selectedLead.phone}
                  </a>
                </div>
                {selectedLead.city && (
                  <div>
                    <p className="text-muted-foreground text-xs">Ciudad</p>
                    <p className="font-medium text-foreground">{selectedLead.city}</p>
                  </div>
                )}
              </div>

              {selectedLead.services && selectedLead.services.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Servicios</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedLead.services.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <p className="text-muted-foreground text-xs mb-1.5">Estado</p>
                <Select
                  value={selectedLead.status}
                  onValueChange={(v) => updateStatus(selectedLead.id, v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <p className="text-muted-foreground text-xs mb-1.5">Notas de seguimiento</p>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Escribe notas sobre este lead..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar este lead?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteLead(selectedLead.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={saveNotes} disabled={savingNotes} className="gap-1.5">
                {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar notas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
