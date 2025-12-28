import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, User, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Stylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  avatar_url: string | null;
  google_calendar_id: string | null;
  is_active: boolean;
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
    }
    setLoading(false);
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
        <div className="flex items-center justify-between">
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
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Estilista
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stylists.map((stylist) => (
              <Card key={stylist.id} className={!stylist.is_active ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={stylist.avatar_url || undefined} />
                      <AvatarFallback style={{ backgroundColor: stylist.color || "#8B5CF6" }}>
                        {stylist.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{stylist.name}</p>
                      <p className="text-sm text-muted-foreground">@{stylist.slug}</p>
                      {!stylist.is_active && (
                        <span className="text-xs text-destructive">Inactivo</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(stylist)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
