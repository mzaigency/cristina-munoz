import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Client } from "./types";
import { TAG_OPTIONS, TAG_COLORS } from "./types";

interface ClientFormProps {
  tenantId: string;
  editingClient: Client | null;
  initialData?: { name: string; phone: string; email: string; notes: string; tags: string[]; birthday: string };
  onSaved: () => void;
  existingClients: Client[];
}

export function ClientForm({ tenantId, editingClient, initialData, onSaved, existingClients }: ClientFormProps) {
  const [formData, setFormData] = useState(initialData || {
    name: "", phone: "", email: "", notes: "", tags: [] as string[], birthday: ""
  });
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const { toast } = useToast();

  const checkDuplicate = (phone: string) => {
    if (!phone.trim()) { setDuplicateWarning(null); return; }
    const normalized = phone.replace(/\s+/g, "");
    const dup = existingClients.find(c =>
      c.id !== editingClient?.id && c.phone?.replace(/\s+/g, "") === normalized
    );
    setDuplicateWarning(dup ? `Ya existe un cliente con este teléfono: ${dup.name}` : null);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        notes: formData.notes.trim() || null,
        tags: formData.tags,
        birthday: formData.birthday || null,
      };

      if (editingClient) {
        const { error } = await supabase.from("clients" as any).update(payload).eq("id", editingClient.id);
        if (error) throw error;
        toast({ title: "Cliente actualizado" });
      } else {
        const { error } = await supabase.from("clients" as any).insert({ tenant_id: tenantId, ...payload });
        if (error) throw error;
        toast({ title: "Cliente creado" });
      }
      onSaved();
    } catch (error) {
      console.error("Error saving client:", error);
      toast({ title: "Error", description: "No se pudo guardar el cliente", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Nombre *</label>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del cliente" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Teléfono</label>
        <Input
          value={formData.phone}
          onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); checkDuplicate(e.target.value); }}
          placeholder="612 345 678"
          type="tel"
        />
        {duplicateWarning && (
          <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{duplicateWarning}</span>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Email</label>
        <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="cliente@email.com" type="email" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Cumpleaños</label>
        <Input value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} type="date" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Etiquetas</label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={`cursor-pointer transition-all ${formData.tags.includes(tag) ? TAG_COLORS[tag] : "opacity-50 hover:opacity-75"}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Notas privadas</label>
        <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Preferencias, alergias, observaciones..." rows={3} />
      </div>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {editingClient ? "Guardar cambios" : "Crear cliente"}
      </Button>
    </div>
  );
}
