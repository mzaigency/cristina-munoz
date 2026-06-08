import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  initialClientId?: string;
}

export function ClientsCRM({ tenantId, initialClientId }: ClientsCRMProps) {
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

  // Auto-open client detail when navigating from calendar
  useEffect(() => {
    if (initialClientId && clients.length > 0) {
      const client = clients.find(c => c.id === initialClientId);
      if (client) {
        setSelectedClient(client);
        setIsDetailOpen(true);
      }
    }
  }, [initialClientId, clients]);

  const fetchClients = async () => {
    try {
      const [clientsRes, transactionsRes] = await Promise.all([
        supabase
          .from("clients" as any)
          .select("*")
          .eq("tenant_id", tenantId)
          .neq("is_blocked", true)
          .order("last_visit_at", { ascending: false, nullsFirst: false }),
        supabase
          .from("transactions")
          .select("customer_name, total")
          .eq("tenant_id", tenantId)
          .eq("voided", false),
      ]);

      if (clientsRes.error) throw clientsRes.error;

      // Build spending map by normalized name
      const spendMap = new Map<string, number>();
      if (transactionsRes.data) {
        for (const tx of transactionsRes.data) {
          const key = (tx.customer_name || "").trim().toLowerCase();
          if (key) spendMap.set(key, (spendMap.get(key) || 0) + Number(tx.total || 0));
        }
      }

      // Enrich clients with real spending
      const enriched = ((clientsRes.data || []) as unknown as Client[]).map(c => {
        const key = c.name.trim().toLowerCase();
        const spent = spendMap.get(key) || 0;
        return { ...c, total_spent: spent > 0 ? spent : c.total_spent };
      });

      setClients(enriched);
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
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="gp-page-h">
        <div>
          <h2>Clientes</h2>
          <p>{clients.length} registrados</p>
        </div>
        <div className="gp-page-actions">
          <button className="gp-btn sm" onClick={() => exportClientsCsv(clients)} aria-label="Exportar clientes a CSV">
            <Download style={{ width: 14, height: 14 }} />
          </button>
          <button className="gp-btn primary sm" onClick={handleNewClient}>
            <UserPlus style={{ width: 14, height: 14 }} /> Nuevo
          </button>
        </div>
      </div>

      {/* KPIs */}
      {!loading && <ClientStats clients={clients} />}

      {/* Search */}
      <div className="gp-search-top">
        <Search style={{ width: 15, height: 15, color: "var(--gp-muted-c)", flexShrink: 0 }} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="gp-card" style={{ height: 72, background: "var(--gp-chip)" }} />
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><Users style={{ width: 24, height: 24 }} /></div>
            <h4>{searchQuery || activeFilter !== "all" ? "Sin resultados" : "Sin clientes"}</h4>
            <p>
              {searchQuery ? "Prueba con otro término" : activeFilter !== "all" ? "No hay clientes con este filtro" : "Añade tu primer cliente para empezar"}
            </p>
            {!searchQuery && activeFilter === "all" && (
              <button className="gp-btn primary sm" style={{ marginTop: 12 }} onClick={handleNewClient}>
                <UserPlus style={{ width: 14, height: 14 }} /> Añadir cliente
              </button>
            )}
          </div>
        </div>
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
