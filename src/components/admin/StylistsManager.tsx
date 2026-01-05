import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, User, Upload, Clock, Search, Link2, Unlink, Shield, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StylistScheduleEditor } from "./StylistScheduleEditor";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Stylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  avatar_url: string | null;
  google_calendar_id: string | null;
  is_active: boolean;
  user_id: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface StylistsManagerProps {
  tenantId: string;
}

export function StylistsManager({ tenantId }: StylistsManagerProps) {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [selectedStylistForSchedule, setSelectedStylistForSchedule] = useState<Stylist | null>(null);
  
  // User linking state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedStylistForLink, setSelectedStylistForLink] = useState<Stylist | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [linkedUsers, setLinkedUsers] = useState<Record<string, UserProfile>>({});
  const [selectedRole, setSelectedRole] = useState<"stylist" | "admin">("stylist");
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    color: "#8B5CF6",
    avatar_url: "",
    google_calendar_id: "",
    is_active: true
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchStylists();
  }, [tenantId]);

  const fetchStylists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_stylists")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los estilistas",
        variant: "destructive"
      });
    } else {
      setStylists(data || []);
      
      // Fetch linked user profiles
      const linkedUserIds = (data || []).filter(s => s.user_id).map(s => s.user_id as string);
      if (linkedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, username")
          .in("id", linkedUserIds);
        
        if (profiles) {
          const usersMap: Record<string, UserProfile> = {};
          profiles.forEach(p => { usersMap[p.id] = p; });
          setLinkedUsers(usersMap);
        }

        // Check which linked users are also admins
        const { data: admins } = await supabase
          .from("tenant_admins")
          .select("user_id")
          .eq("tenant_id", tenantId)
          .in("user_id", linkedUserIds);

        if (admins) {
          setAdminUserIds(new Set(admins.map(a => a.user_id)));
        }
      }
    }
    setLoading(false);
  };

  // Search users by username in real-time
  useEffect(() => {
    const searchUsers = async () => {
      const query = userSearchQuery.trim();
      
      if (query.length < 2) {
        setUserSearchResults([]);
        return;
      }

      setSearchingUsers(true);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, username")
        .ilike("username", `%${query}%`)
        .limit(8);

      if (!error && data) {
        setUserSearchResults(data);
      }
      setSearchingUsers(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [userSearchQuery]);

  // Link user to stylist
  const handleLinkUser = async (userId: string) => {
    if (!selectedStylistForLink) return;
    
    setSaving(true);
    
    try {
      // Update stylist with user_id
      const { error: stylistError } = await supabase
        .from("tenant_stylists")
        .update({ user_id: userId })
        .eq("id", selectedStylistForLink.id);

      if (stylistError) throw stylistError;

      // First, remove any orphan stylist role without tenant_id
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "stylist")
        .is("tenant_id", null);

      // Add "stylist" role to user_roles with tenant_id
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: userId, 
          role: "stylist" as const,
          tenant_id: tenantId
        });

      if (roleError) {
        // If already exists, that's fine
        if (!roleError.message.includes("duplicate")) {
          console.error("Error adding stylist role:", roleError);
        }
      }

      // If admin role selected, also add to tenant_admins
      if (selectedRole === "admin") {
        const { error: adminError } = await supabase
          .from("tenant_admins")
          .upsert({ 
            user_id: userId, 
            tenant_id: tenantId, 
            is_owner: false 
          }, { onConflict: "user_id,tenant_id" });

        if (adminError) {
          console.error("Error adding admin role:", adminError);
        }
      }

      toast({
        title: "Vinculado",
        description: selectedRole === "admin" 
          ? "Usuario vinculado como Administrador. Tiene acceso completo."
          : "Usuario vinculado como Estilista. No puede acceder a Ajustes."
      });
      setLinkDialogOpen(false);
      setUserSearchQuery("");
      setUserSearchResults([]);
      setSelectedRole("stylist");
      fetchStylists();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo vincular el usuario",
        variant: "destructive"
      });
    }
    
    setSaving(false);
  };

  // Unlink user from stylist
  const handleUnlinkUser = async (stylist: Stylist) => {
    if (!stylist.user_id) return;

    const userId = stylist.user_id;
    
    // First remove from tenant_admins if they were admin
    await supabase
      .from("tenant_admins")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .eq("is_owner", false);

    // Then unlink from stylist
    const { error } = await supabase
      .from("tenant_stylists")
      .update({ user_id: null })
      .eq("id", stylist.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo desvincular el usuario",
        variant: "destructive"
      });
      return;
    }

    // Remove stylist role for this specific tenant
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "stylist")
      .eq("tenant_id", tenantId);

    toast({
      title: "Desvinculado",
      description: "Usuario desvinculado del estilista"
    });
    fetchStylists();
  };

  // Toggle admin role for linked user
  const handleToggleAdminRole = async (stylist: Stylist) => {
    if (!stylist.user_id) return;

    const isCurrentlyAdmin = adminUserIds.has(stylist.user_id);

    if (isCurrentlyAdmin) {
      // Remove admin role
      const { error } = await supabase
        .from("tenant_admins")
        .delete()
        .eq("user_id", stylist.user_id)
        .eq("tenant_id", tenantId)
        .eq("is_owner", false);

      if (!error) {
        toast({
          title: "Rol actualizado",
          description: "Ahora es solo Estilista (sin acceso a Ajustes)"
        });
        fetchStylists();
      }
    } else {
      // Add admin role
      const { error } = await supabase
        .from("tenant_admins")
        .upsert({ 
          user_id: stylist.user_id, 
          tenant_id: tenantId, 
          is_owner: false 
        }, { onConflict: "user_id,tenant_id" });

      if (!error) {
        toast({
          title: "Rol actualizado",
          description: "Ahora es Administrador (acceso completo)"
        });
        fetchStylists();
      }
    }
  };


  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingStylist ? prev.slug : generateSlug(name)
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${tenantId}/stylists/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("tenant-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive"
      });
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("tenant-assets")
      .getPublicUrl(fileName);

    setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    setUploadingAvatar(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Error",
        description: "El nombre y el slug son obligatorios",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    if (editingStylist) {
      const { error } = await supabase
        .from("tenant_stylists")
        .update({
          name: formData.name,
          slug: formData.slug,
          color: formData.color,
          avatar_url: formData.avatar_url || null,
          google_calendar_id: formData.google_calendar_id || null,
          is_active: formData.is_active
        })
        .eq("id", editingStylist.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estilista",
          variant: "destructive"
        });
      } else {
        toast({ title: "Éxito", description: "Estilista actualizado" });
        setDialogOpen(false);
        fetchStylists();
      }
    } else {
      const { error } = await supabase
        .from("tenant_stylists")
        .insert({
          tenant_id: tenantId,
          name: formData.name,
          slug: formData.slug,
          color: formData.color,
          avatar_url: formData.avatar_url || null,
          google_calendar_id: formData.google_calendar_id || null,
          is_active: formData.is_active
        });

      if (error) {
        toast({
          title: "Error",
          description: error.code === "23505" ? "Ya existe un estilista con ese slug" : "No se pudo crear el estilista",
          variant: "destructive"
        });
      } else {
        toast({ title: "Éxito", description: "Estilista creado" });
        setDialogOpen(false);
        fetchStylists();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (stylist: Stylist) => {
    const { error } = await supabase
      .from("tenant_stylists")
      .delete()
      .eq("id", stylist.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el estilista",
        variant: "destructive"
      });
    } else {
      toast({ title: "Éxito", description: "Estilista eliminado" });
      fetchStylists();
    }
  };

  const openCreateDialog = () => {
    setEditingStylist(null);
    setFormData({
      name: "",
      slug: "",
      color: "#8B5CF6",
      avatar_url: "",
      google_calendar_id: "",
      is_active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (stylist: Stylist) => {
    setEditingStylist(stylist);
    setFormData({
      name: stylist.name,
      slug: stylist.slug,
      color: stylist.color || "#8B5CF6",
      avatar_url: stylist.avatar_url || "",
      google_calendar_id: stylist.google_calendar_id || "",
      is_active: stylist.is_active
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gestión de Estilistas
            </CardTitle>
            <CardDescription>
              Añade, edita o elimina los estilistas de tu salón
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full md:w-auto h-11 md:h-10">
                <Plus className="mr-2 h-4 w-4" />
                Añadir Estilista
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStylist ? "Editar Estilista" : "Nuevo Estilista"}
                </DialogTitle>
                <DialogDescription>
                  {editingStylist ? "Modifica los datos del estilista" : "Añade un nuevo estilista a tu equipo"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback style={{ backgroundColor: formData.color }}>
                        {formData.name.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                      {uploadingAvatar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="María García"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="maria-garcia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_calendar_id">ID de Google Calendar (opcional)</Label>
                  <Input
                    id="google_calendar_id"
                    value={formData.google_calendar_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, google_calendar_id: e.target.value }))}
                    placeholder="ejemplo@group.calendar.google.com"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="is_active">Estilista activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStylist ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {stylists.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <User className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No hay estilistas configurados</p>
            <p className="text-sm">Añade tu primer estilista para empezar</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {stylists.map((stylist) => {
              const linkedUser = stylist.user_id ? linkedUsers[stylist.user_id] : null;
              
              return (
                <Card key={stylist.id} className={!stylist.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={stylist.avatar_url || undefined} />
                        <AvatarFallback style={{ backgroundColor: stylist.color || "#8B5CF6" }}>
                          {stylist.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{stylist.name}</p>
                        <p className="text-sm text-muted-foreground truncate">@{stylist.slug}</p>
                        {!stylist.is_active && (
                          <span className="text-xs text-destructive">Inactivo</span>
                        )}
                      </div>
                    </div>
                    
                    {/* User link status */}
                    <div className="mb-3 p-2 rounded-lg bg-muted/50">
                      {linkedUser ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={linkedUser.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {linkedUser.full_name?.substring(0, 2).toUpperCase() || linkedUser.email.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{linkedUser.full_name || "Sin nombre"}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{linkedUser.email}</p>
                            </div>
                            {/* Role badge */}
                            {adminUserIds.has(stylist.user_id!) ? (
                              <Badge className="text-[10px] shrink-0 bg-primary">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                <User className="h-3 w-3 mr-1" />
                                Estilista
                              </Badge>
                            )}
                          </div>
                          {/* Toggle role button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-full text-xs"
                            onClick={() => handleToggleAdminRole(stylist)}
                          >
                            {adminUserIds.has(stylist.user_id!) ? (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Cambiar a Estilista
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Dar rol de Admin
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Unlink className="h-4 w-4" />
                          <span className="text-xs">Sin usuario vinculado</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end flex-wrap">
                      {/* Link/Unlink button */}
                      {linkedUser ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 text-amber-600 border-amber-200">
                              <Unlink className="h-3.5 w-3.5 mr-1" />
                              Desvincular
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desvincular usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                El usuario {linkedUser.email} ya no podrá acceder al panel de administración como estilista.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUnlinkUser(stylist)}>
                                Desvincular
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            setSelectedStylistForLink(stylist);
                            setUserSearchQuery("");
                            setUserSearchResults([]);
                            setLinkDialogOpen(true);
                          }}
                        >
                          <Link2 className="h-3.5 w-3.5 mr-1" />
                          Vincular
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => {
                          setSelectedStylistForSchedule(stylist);
                          setScheduleEditorOpen(true);
                        }}
                        title="Editar horarios"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => openEditDialog(stylist)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9 text-destructive border-destructive/50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar estilista?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente a {stylist.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(stylist)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Schedule Editor */}
      {selectedStylistForSchedule && (
        <StylistScheduleEditor
          open={scheduleEditorOpen}
          onClose={() => {
            setScheduleEditorOpen(false);
            setSelectedStylistForSchedule(null);
          }}
          stylistId={selectedStylistForSchedule.id}
          stylistName={selectedStylistForSchedule.name}
          tenantId={tenantId}
        />
      )}

      {/* Link User Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Vincular Usuario
            </DialogTitle>
            <DialogDescription>
              Busca un usuario por username para darle acceso al panel como <strong>{selectedStylistForLink?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por @username..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {searchingUsers && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Role selector */}
            <div className="p-3 rounded-lg border bg-muted/30">
              <Label className="text-sm font-medium mb-3 block">Asignar como:</Label>
              <RadioGroup 
                value={selectedRole} 
                onValueChange={(v) => setSelectedRole(v as "stylist" | "admin")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="stylist" id="role-stylist" />
                  <Label htmlFor="role-stylist" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Estilista</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Sin acceso a Ajustes</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="admin" id="role-admin" />
                  <Label htmlFor="role-admin" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="font-medium">Administrador/a</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Acceso completo al panel</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Search results - Instagram style */}
            {userSearchQuery.length >= 2 && (
              <div className="space-y-1 max-h-52 overflow-y-auto -mx-2 px-2">
                {userSearchResults.length === 0 && !searchingUsers ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron usuarios</p>
                  </div>
                ) : (
                  userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleLinkUser(user.id)}
                      disabled={saving}
                      className="flex items-center gap-3 p-2.5 rounded-xl w-full hover:bg-muted/70 transition-colors text-left group"
                    >
                      <Avatar className="h-11 w-11 ring-2 ring-border">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {user.full_name?.substring(0, 2).toUpperCase() || user.username?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          @{user.username || "sin_username"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.full_name || user.email}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Badge variant={selectedRole === "admin" ? "default" : "secondary"} className="text-xs">
                            {selectedRole === "admin" ? "Admin" : "Estilista"}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Initial state */}
            {userSearchQuery.length < 2 && (
              <div className="py-4 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Escribe al menos 2 caracteres</p>
                <p className="text-xs mt-1">Los resultados aparecerán automáticamente</p>
              </div>
            )}

            {/* Help text */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
              <p><strong>Diferencias de permisos:</strong></p>
              <p>• <strong>Estilista:</strong> Puede ver agenda, clientes, caja y equipo</p>
              <p>• <strong>Admin:</strong> Además puede acceder a Ajustes del salón</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
