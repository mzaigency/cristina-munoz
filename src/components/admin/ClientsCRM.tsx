import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence } from "framer-motion";
import { Search, UserPlus, Users, Download } from "lucide-react";

import type { Client, FilterOption, SortOption } from "./clients/types";
import { ClientStats } from "./clients/ClientStats";
import { ClientFilters } from "./clients/ClientFilters";
import { ClientCard } from "./clients/ClientCard";
import { ClientDetail } from "./clients/ClientDetail";
import { ClientForm } from "./clients/ClientForm";
import { exportClientsCsv } from "./clients/exportCsv";

interface ClientsCRMProps {
  tenantId: string;
}

export function ClientsCRM({ tenantId }: ClientsCRMProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("last_visit");

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
        .neq("is_blocked", true)
        .order("last_visit_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setClients((data || []) as unknown as Client[]);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let result = clients.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply filter
    switch (activeFilter) {
      case "VIP":
      case "Frecuente":
      case "Nuevo":
        result = result.filter(c => c.tags?.includes(activeFilter));
        break;
      case "inactive":
        result = result.filter(c => !c.last_visit_at || new Date(c.last_visit_at) < thirtyDaysAgo);
        break;
      case "top_spenders":
        result = [...result].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 20);
        break;
    }

    // Apply sort (skip for top_spenders already sorted)
    if (activeFilter !== "top_spenders") {
      result.sort((a, b) => {
        switch (sortBy) {
          case "name_asc": return a.name.localeCompare(b.name);
          case "most_spent": return (b.total_spent || 0) - (a.total_spent || 0);
          case "most_visits": return (b.total_visits || 0) - (a.total_visits || 0);
          default: // last_visit
            if (!a.last_visit_at) return 1;
            if (!b.last_visit_at) return -1;
            return new Date(b.last_visit_at).getTime() - new Date(a.last_visit_at).getTime();
        }
      });
    }

    return result;
  }, [clients, searchQuery, activeFilter, sortBy]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      const { error } = await supabase.from("clients" as any).delete().eq("id", clientId);
      if (error) throw error;
      toast({ title: "Cliente eliminado" });
      setIsDetailOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({ title: "Error", description: "No se pudo eliminar el cliente", variant: "destructive" });
    }
  };

  const formInitialData = editingClient
    ? {
        name: editingClient.name,
        phone: editingClient.phone || "",
        email: editingClient.email || "",
        notes: editingClient.notes || "",
        tags: editingClient.tags || [],
        birthday: editingClient.birthday || "",
      }
    : { name: "", phone: "", email: "", notes: "", tags: [], birthday: "" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Clientes
          </h2>
          <p className="text-sm text-muted-foreground">{clients.length} registrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportClientsCsv(clients)} aria-label="Exportar clientes a CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={handleNewClient} size="sm">
            <UserPlus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {!loading && <ClientStats clients={clients} />}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="pl-9"
        />
      </div>

      {/* Filters & Sort */}
      <ClientFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium mb-1">{searchQuery || activeFilter !== "all" ? "Sin resultados" : "Sin clientes"}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? "Prueba con otro término" : activeFilter !== "all" ? "No hay clientes con este filtro" : "Añade tu primer cliente para empezar"}
          </p>
          {!searchQuery && activeFilter === "all" && (
            <Button onClick={handleNewClient} size="sm"><UserPlus className="h-4 w-4 mr-1" /> Añadir cliente</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((client, index) => (
              <ClientCard
                key={client.id}
                client={client}
                index={index}
                onClick={() => handleClientSelect(client)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail */}
      {isMobile ? (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent side="right" className="p-0 w-full sm:max-w-md">
            <SheetHeader className="sr-only"><SheetTitle>Detalle del cliente</SheetTitle></SheetHeader>
            {selectedClient && (
              <ClientDetail
                client={selectedClient}
                tenantId={tenantId}
                onEdit={() => handleEditClient(selectedClient)}
                onDelete={() => handleDeleteClient(selectedClient.id)}
              />
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-md p-0 max-h-[80vh] overflow-hidden">
            <DialogHeader className="sr-only"><DialogTitle>Detalle del cliente</DialogTitle></DialogHeader>
            {selectedClient && (
              <ClientDetail
                client={selectedClient}
                tenantId={tenantId}
                onEdit={() => handleEditClient(selectedClient)}
                onDelete={() => handleDeleteClient(selectedClient.id)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Form */}
      {isMobile ? (
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[85vh]">
            <SheetHeader><SheetTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</SheetTitle></SheetHeader>
            <ClientForm
              tenantId={tenantId}
              editingClient={editingClient}
              initialData={formInitialData}
              onSaved={() => { setIsFormOpen(false); fetchClients(); }}
              existingClients={clients}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</DialogTitle></DialogHeader>
            <ClientForm
              tenantId={tenantId}
              editingClient={editingClient}
              initialData={formInitialData}
              onSaved={() => { setIsFormOpen(false); fetchClients(); }}
              existingClients={clients}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
