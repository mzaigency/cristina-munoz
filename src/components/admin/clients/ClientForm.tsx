import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, UserCheck, X, Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Client } from "./types";
import { TAG_OPTIONS, TAG_COLORS } from "./types";

interface ProfileResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string;
}

interface ClientFormProps {
  tenantId: string;
  editingClient: Client | null;
  initialData?: { name: string; phone: string; email: string; notes: string; tags: string[]; birthday: string; user_id?: string | null };
  onSaved: () => void;
  existingClients: Client[];
}

export function ClientForm({ tenantId, editingClient, initialData, onSaved, existingClients }: ClientFormProps) {
  const [formData, setFormData] = useState(initialData || {
    name: "", phone: "", email: "", notes: "", tags: [] as string[], birthday: "", user_id: null as string | null
  });
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const { toast } = useToast();

  // Profile linking
  const [profileSearch, setProfileSearch] = useState("");
  const [profileResults, setProfileResults] = useState<ProfileResult[]>([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [linkedProfile, setLinkedProfile] = useState<ProfileResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load linked profile on mount
  useEffect(() => {
    const uid = formData.user_id || editingClient?.user_id;
    if (uid) {
      supabase.from("profiles").select("id, full_name, username, avatar_url, email").eq("id", uid).single()
        .then(({ data }) => { if (data) setLinkedProfile(data as ProfileResult); });
    }
  }, []);

  const searchProfiles = (term: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (term.length < 2) { setProfileResults([]); setShowDropdown(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingProfiles(true);
      try {
        const cleanTerm = term.replace("@", "");
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, email")
          .or(`username.ilike.%${cleanTerm}%,full_name.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
          .limit(6);
        setProfileResults((data as ProfileResult[]) || []);
        setShowDropdown(true);
      } catch { setProfileResults([]); }
      finally { setSearchingProfiles(false); }
    }, 300);
  };

  const selectProfile = (profile: ProfileResult) => {
    setLinkedProfile(profile);
    setFormData(prev => ({ ...prev, user_id: profile.id }));
    setShowDropdown(false);
    setProfileSearch("");
  };

  const unlinkProfile = () => {
    setLinkedProfile(null);
    setFormData(prev => ({ ...prev, user_id: null }));
  };

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
        user_id: formData.user_id || null,
      };

      if (editingClient) {
        const { error } = await supabase.from("clients" as any).update(payload).eq("id", editingClient.id);
        if (error) throw error;
        toast({ title: "Cliente actualizado" });
      } else {
        const { error } = await supabase.from("clients"as any).insert({ tenant_id: tenantId, ...payload }); if (error) throw error; toast({ title:"Cliente creado" });
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
          <div className="flex items-center gap-1.5 mt-1.5 text-[var(--gp-warn-ink)] text-xs">
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

      {/* Profile linking */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Vincular cuenta de usuario</label>
        {linkedProfile ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-primary/5 border-primary/20">
            <Avatar className="h-8 w-8">
              {linkedProfile.avatar_url && <AvatarImage src={linkedProfile.avatar_url} />}
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {(linkedProfile.full_name || linkedProfile.email)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{linkedProfile.full_name || linkedProfile.email}</p>
              {linkedProfile.username && (
                <p className="text-xs text-primary">@{linkedProfile.username}</p>
              )}
            </div>
            <UserCheck className="h-4 w-4 text-[var(--gp-ok)] shrink-0" />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={unlinkProfile}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={profileSearch}
                onChange={(e) => { setProfileSearch(e.target.value); searchProfiles(e.target.value); }}
                onFocus={() => profileResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Buscar por @usuario, nombre o email..."
                className="pl-9"
              />
              {searchingProfiles && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {showDropdown && profileResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {profileResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center gap-2.5 p-2.5 hover:bg-muted/50 transition-colors text-left"
                    onMouseDown={(e) => { e.preventDefault(); selectProfile(p); }}
                  >
                    <Avatar className="h-7 w-7">
                      {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                      <AvatarFallback className="text-[10px]">
                        {(p.full_name || p.email)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{p.full_name || p.email}</p>
                      {p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Etiquetas</label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map(tag => (
            <Badge
              key={tag}
              variant="outline"className={`cursor-pointer transition-all ${formData.tags.includes(tag) ? TAG_COLORS[tag] :"opacity-50 hover:opacity-75"}`}
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
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>} {editingClient ?"Guardar cambios":"Crear cliente"}
      </Button>
    </div>
  );
}
