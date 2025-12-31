import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, Calendar, User, Star, MessageSquare, 
  Heart, Image, RefreshCw, Filter
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityItem {
  id: string;
  type: 'booking' | 'user' | 'review' | 'message' | 'favorite' | 'story';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const ActivityCenter = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const allActivities: ActivityItem[] = [];

      // Fetch recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, customer_name, Fecha, Hora, stylist, tenant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get tenant names for bookings
      const tenantIds = [...new Set(bookings?.map(b => b.tenant_id).filter(Boolean) || [])];
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);
      const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);

      bookings?.forEach(b => {
        allActivities.push({
          id: `booking-${b.id}`,
          type: 'booking',
          title: 'Nueva reserva',
          description: `${b.customer_name} reservó con ${b.stylist} en ${tenantMap.get(b.tenant_id!) || 'un salón'}`,
          timestamp: b.created_at || new Date().toISOString(),
          metadata: { date: b.Fecha, time: b.Hora }
        });
      });

      // Fetch recent users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      profiles?.forEach(p => {
        allActivities.push({
          id: `user-${p.id}`,
          type: 'user',
          title: 'Nuevo usuario',
          description: `${p.full_name || p.email} se registró en la plataforma`,
          timestamp: p.created_at || new Date().toISOString()
        });
      });

      // Fetch recent reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, tenant_id, user_id')
        .order('created_at', { ascending: false })
        .limit(20);

      const reviewUserIds = [...new Set(reviews?.map(r => r.user_id) || [])];
      const { data: reviewProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', reviewUserIds);
      const profileMap = new Map(reviewProfiles?.map(p => [p.id, p]) || []);

      reviews?.forEach(r => {
        const user = profileMap.get(r.user_id);
        allActivities.push({
          id: `review-${r.id}`,
          type: 'review',
          title: 'Nueva reseña',
          description: `${user?.full_name || user?.email || 'Un usuario'} dejó ${r.rating}⭐`,
          timestamp: r.created_at,
          metadata: { rating: r.rating, comment: r.comment }
        });
      });

      // Fetch recent favorites
      const { data: favorites } = await supabase
        .from('favorites')
        .select('id, user_id, tenant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      favorites?.forEach(f => {
        allActivities.push({
          id: `favorite-${f.id}`,
          type: 'favorite',
          title: 'Nuevo favorito',
          description: `Un usuario guardó un salón como favorito`,
          timestamp: f.created_at
        });
      });

      // Fetch recent stories
      const { data: stories } = await supabase
        .from('salon_stories')
        .select('id, caption, tenant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      stories?.forEach(s => {
        allActivities.push({
          id: `story-${s.id}`,
          type: 'story',
          title: 'Nueva story',
          description: s.caption || 'Se publicó una nueva story',
          timestamp: s.created_at,
          metadata: { tenant_id: s.tenant_id }
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities);

    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'review': return <Star className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'favorite': return <Heart className="h-4 w-4" />;
      case 'story': return <Image className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking': return 'bg-blue-500/10 text-blue-500';
      case 'user': return 'bg-green-500/10 text-green-500';
      case 'review': return 'bg-yellow-500/10 text-yellow-500';
      case 'message': return 'bg-purple-500/10 text-purple-500';
      case 'favorite': return 'bg-pink-500/10 text-pink-500';
      case 'story': return 'bg-orange-500/10 text-orange-500';
    }
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Centro de Actividad
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="booking">Reservas</SelectItem>
                <SelectItem value="user">Usuarios</SelectItem>
                <SelectItem value="review">Reseñas</SelectItem>
                <SelectItem value="favorite">Favoritos</SelectItem>
                <SelectItem value="story">Stories</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {filteredActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay actividad reciente
              </p>
            ) : (
              filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{activity.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.type === 'booking' ? 'Reserva' :
                         activity.type === 'user' ? 'Usuario' :
                         activity.type === 'review' ? 'Reseña' :
                         activity.type === 'favorite' ? 'Favorito' :
                         activity.type === 'story' ? 'Story' : activity.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    {activity.metadata?.rating && (
                      <div className="mt-1">
                        <Badge variant="secondary">
                          {activity.metadata.rating} ⭐
                        </Badge>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
