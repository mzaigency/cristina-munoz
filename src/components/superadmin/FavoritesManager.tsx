import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Heart, Search, Building2, Users, TrendingUp 
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FavoriteWithDetails {
  id: string;
  created_at: string;
  user_email: string;
  user_name: string | null;
  tenant_name: string;
  tenant_logo: string | null;
}

interface TenantFollowers {
  tenant_id: string;
  tenant_name: string;
  tenant_logo: string | null;
  followers_count: number;
}

export const FavoritesManager = () => {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [topTenants, setTopTenants] = useState<TenantFollowers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      // Fetch all favorites with user and tenant info
      const { data: favoritesData, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          user_id,
          tenant_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user and tenant IDs
      const userIds = [...new Set(favoritesData?.map(f => f.user_id) || [])];
      const tenantIds = [...new Set(favoritesData?.map(f => f.tenant_id) || [])];

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Fetch tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name, logo_url')
        .in('id', tenantIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const tenantMap = new Map(tenants?.map(t => [t.id, t]) || []);

      // Combine data
      const enrichedFavorites: FavoriteWithDetails[] = (favoritesData || []).map(f => {
        const profile = profileMap.get(f.user_id);
        const tenant = tenantMap.get(f.tenant_id);
        return {
          id: f.id,
          created_at: f.created_at,
          user_email: profile?.email || 'Usuario desconocido',
          user_name: profile?.full_name || null,
          tenant_name: tenant?.name || 'Negocio desconocido',
          tenant_logo: tenant?.logo_url || null
        };
      });

      setFavorites(enrichedFavorites);
      setTotalFavorites(enrichedFavorites.length);
      setUniqueUsers(userIds.length);

      // Calculate top followed tenants
      const tenantFollowerCounts: Record<string, { count: number; name: string; logo: string | null }> = {};
      favoritesData?.forEach(f => {
        const tenant = tenantMap.get(f.tenant_id);
        if (!tenantFollowerCounts[f.tenant_id]) {
          tenantFollowerCounts[f.tenant_id] = { 
            count: 0, 
            name: tenant?.name || 'Desconocido',
            logo: tenant?.logo_url || null
          };
        }
        tenantFollowerCounts[f.tenant_id].count++;
      });

      const topFollowed = Object.entries(tenantFollowerCounts)
        .map(([id, data]) => ({
          tenant_id: id,
          tenant_name: data.name,
          tenant_logo: data.logo,
          followers_count: data.count
        }))
        .sort((a, b) => b.followers_count - a.followers_count)
        .slice(0, 10);

      setTopTenants(topFollowed);

    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter(f => 
    f.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.user_name && f.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-pink-500/10">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Favoritos</p>
                <p className="text-2xl font-bold">{totalFavorites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Únicos</p>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Media por Usuario</p>
                <p className="text-2xl font-bold">
                  {uniqueUsers > 0 ? (totalFavorites / uniqueUsers).toFixed(1) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Followed Tenants */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Más Seguidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTenants.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay favoritos aún
                </p>
              ) : (
                topTenants.map((tenant, index) => (
                  <div 
                    key={tenant.tenant_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {index + 1}
                    </div>
                    {tenant.tenant_logo ? (
                      <img 
                        src={tenant.tenant_logo} 
                        alt={tenant.tenant_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                        {tenant.tenant_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{tenant.tenant_name}</p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {tenant.followers_count}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Favorites List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Historial de Favoritos
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredFavorites.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No se encontraron resultados' : 'No hay favoritos aún'}
                </p>
              ) : (
                filteredFavorites.map((favorite) => (
                  <div 
                    key={favorite.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {favorite.user_name || favorite.user_email}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {favorite.user_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      {favorite.tenant_logo ? (
                        <img 
                          src={favorite.tenant_logo} 
                          alt={favorite.tenant_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
                          {favorite.tenant_name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-sm">{favorite.tenant_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(favorite.created_at), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
