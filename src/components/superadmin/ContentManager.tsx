import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Image, Eye, EyeOff, Trash2, Clock, Building2, 
  Calendar, RefreshCw, Filter
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  story_type: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  views_count: number;
  tenant_id: string;
  tenant_name?: string;
  tenant_logo?: string | null;
}

export const ContentManager = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [deleteStoryId, setDeleteStoryId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data: storiesData, error } = await supabase
        .from('salon_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get tenant info
      const tenantIds = [...new Set(storiesData?.map(s => s.tenant_id) || [])];
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name, logo_url')
        .in('id', tenantIds);

      const tenantMap = new Map(tenants?.map(t => [t.id, t]) || []);

      const enrichedStories = (storiesData || []).map(s => ({
        ...s,
        tenant_name: tenantMap.get(s.tenant_id)?.name || 'Desconocido',
        tenant_logo: tenantMap.get(s.tenant_id)?.logo_url || null
      }));

      setStories(enrichedStories);

    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (storyId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('salon_stories')
        .update({ is_active: !currentState })
        .eq('id', storyId);

      if (error) throw error;

      setStories(prev => 
        prev.map(s => 
          s.id === storyId ? { ...s, is_active: !currentState } : s
        )
      );

      toast({
        title: !currentState ? "Story activada" : "Story desactivada",
        description: "El estado se ha actualizado correctamente"
      });

    } catch (error) {
      console.error("Error toggling story:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteStoryId) return;

    try {
      const { error } = await supabase
        .from('salon_stories')
        .delete()
        .eq('id', deleteStoryId);

      if (error) throw error;

      setStories(prev => prev.filter(s => s.id !== deleteStoryId));
      
      toast({
        title: "Story eliminada",
        description: "La story se ha eliminado correctamente"
      });

    } catch (error) {
      console.error("Error deleting story:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la story",
        variant: "destructive"
      });
    } finally {
      setDeleteStoryId(null);
    }
  };

  const getFilteredStories = () => {
    switch (filter) {
      case 'active':
        return stories.filter(s => s.is_active && !isPast(new Date(s.expires_at)));
      case 'expired':
        return stories.filter(s => isPast(new Date(s.expires_at)));
      case 'hidden':
        return stories.filter(s => !s.is_active);
      default:
        return stories;
    }
  };

  const activeCount = stories.filter(s => s.is_active && !isPast(new Date(s.expires_at))).length;
  const expiredCount = stories.filter(s => isPast(new Date(s.expires_at))).length;
  const hiddenCount = stories.filter(s => !s.is_active).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredStories = getFilteredStories();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stories</p>
                <p className="text-2xl font-bold">{stories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Eye className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activas Ahora</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiradas</p>
                <p className="text-2xl font-bold">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-500/10">
                <EyeOff className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ocultas</p>
                <p className="text-2xl font-bold">{hiddenCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stories Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Moderación de Stories
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ({stories.length})</SelectItem>
                  <SelectItem value="active">Activas ({activeCount})</SelectItem>
                  <SelectItem value="expired">Expiradas ({expiredCount})</SelectItem>
                  <SelectItem value="hidden">Ocultas ({hiddenCount})</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchStories}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStories.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No hay stories en esta categoría
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredStories.map((story) => {
                const isExpired = isPast(new Date(story.expires_at));
                
                return (
                  <div 
                    key={story.id}
                    className="relative group rounded-lg overflow-hidden border"
                  >
                    {/* Image */}
                    <div className="aspect-[9/16] bg-muted">
                      <img 
                        src={story.image_url} 
                        alt={story.caption || 'Story'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isExpired && (
                        <Badge variant="secondary" className="text-xs">
                          Expirada
                        </Badge>
                      )}
                      {!story.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          Oculta
                        </Badge>
                      )}
                      {story.is_active && !isExpired && (
                        <Badge className="text-xs bg-green-500">
                          Activa
                        </Badge>
                      )}
                    </div>

                    {/* Views */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        {story.views_count}
                      </Badge>
                    </div>

                    {/* Overlay with info and actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      {/* Tenant info */}
                      <div className="flex items-center gap-2 mb-2">
                        {story.tenant_logo ? (
                          <img 
                            src={story.tenant_logo} 
                            alt={story.tenant_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                            {story.tenant_name?.charAt(0)}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium truncate">
                          {story.tenant_name}
                        </span>
                      </div>

                      {/* Caption */}
                      {story.caption && (
                        <p className="text-white/80 text-xs line-clamp-2 mb-2">
                          {story.caption}
                        </p>
                      )}

                      {/* Time info */}
                      <p className="text-white/60 text-xs mb-3">
                        {formatDistanceToNow(new Date(story.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={story.is_active ? "secondary" : "default"}
                          className="flex-1"
                          onClick={() => handleToggleActive(story.id, story.is_active)}
                        >
                          {story.is_active ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Mostrar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteStoryId(story.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteStoryId} onOpenChange={() => setDeleteStoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta story?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La story será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
