import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Eye, TrendingUp, Clock, Image as ImageIcon, 
  BarChart3, Users, Calendar, Sparkles,
  Trash2, MoreVertical
} from "lucide-react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface StoriesAnalyticsProps {
  tenantId: string;
}

interface StoryWithViews {
  id: string;
  image_url: string;
  caption: string | null;
  story_type: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
}

interface DailyStats {
  date: string;
  stories: number;
  views: number;
}

export function StoriesAnalytics({ tenantId }: StoriesAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "all">("7d");

  // Fetch all stories with views
  const { data: stories, isLoading, refetch } = useQuery({
    queryKey: ["stories-analytics", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salon_stories")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StoryWithViews[];
    },
  });

  // Fetch story views for detailed analytics
  const { data: storyViews } = useQuery({
    queryKey: ["story-views-analytics", tenantId],
    queryFn: async () => {
      if (!stories?.length) return [];
      
      const storyIds = stories.map(s => s.id);
      const { data, error } = await supabase
        .from("story_views")
        .select("*")
        .in("story_id", storyIds);

      if (error) throw error;
      return data;
    },
    enabled: !!stories?.length,
  });

  // Calculate stats
  const totalStories = stories?.length || 0;
  const activeStories = stories?.filter(s => s.is_active && new Date(s.expires_at) > new Date()).length || 0;
  const totalViews = stories?.reduce((sum, s) => sum + (s.views_count || 0), 0) || 0;
  const avgViewsPerStory = totalStories > 0 ? Math.round(totalViews / totalStories) : 0;

  // Filter stories by period
  const getFilteredStories = () => {
    if (!stories) return [];
    const now = new Date();
    let cutoff: Date;
    
    switch (selectedPeriod) {
      case "7d":
        cutoff = subDays(now, 7);
        break;
      case "30d":
        cutoff = subDays(now, 30);
        break;
      default:
        return stories;
    }
    
    return stories.filter(s => new Date(s.created_at) >= cutoff);
  };

  const filteredStories = getFilteredStories();

  // Generate daily stats for chart
  const generateDailyStats = (): DailyStats[] => {
    const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 60;
    const stats: DailyStats[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayStories = stories?.filter(s => 
        format(new Date(s.created_at), "yyyy-MM-dd") === dateStr
      ) || [];
      
      stats.push({
        date: format(date, "dd/MM"),
        stories: dayStories.length,
        views: dayStories.reduce((sum, s) => sum + (s.views_count || 0), 0),
      });
    }
    
    return stats;
  };

  const dailyStats = generateDailyStats();

  // Story type distribution
  const storyTypeDistribution = {
    work: filteredStories.filter(s => s.story_type === "work").length,
    promo: filteredStories.filter(s => s.story_type === "promo").length,
    behind_scenes: filteredStories.filter(s => s.story_type === "behind_scenes").length,
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from("salon_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;
      toast.success("Story eliminada");
      refetch();
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Error al eliminar la story");
    }
  };

  const getStoryTypeLabel = (type: string) => {
    switch (type) {
      case "work": return "Trabajo";
      case "promo": return "Promoción";
      case "behind_scenes": return "Detrás de escenas";
      default: return type;
    }
  };

  const getStoryTypeColor = (type: string) => {
    switch (type) {
      case "work": return "bg-purple-500/20 text-purple-400";
      case "promo": return "bg-rose-500/20 text-rose-400";
      case "behind_scenes": return "bg-blue-500/20 text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics de Stories</h2>
          <p className="text-muted-foreground">Rendimiento y estadísticas de tus stories</p>
        </div>
        
        {/* Period selector */}
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === "7d" ? "7 días" : period === "30d" ? "30 días" : "Todo"}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <ImageIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stories</p>
                <p className="text-2xl font-bold">{totalStories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold">{activeStories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vistas</p>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio/Story</p>
                <p className="text-2xl font-bold">{avgViewsPerStory}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Views over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vistas por día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Story type distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Distribución por tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Trabajo", value: storyTypeDistribution.work, fill: "hsl(var(--primary))" },
                  { name: "Promo", value: storyTypeDistribution.promo, fill: "#f43f5e" },
                  { name: "Detrás", value: storyTypeDistribution.behind_scenes, fill: "#3b82f6" },
                ]}>
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent stories list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Stories recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStories.length === 0 ? (
            <div className="gp-empty">
              <div className="gp-empty-ic"><ImageIcon style={{ width: 24, height: 24 }} /></div>
              <h4>Sin stories</h4>
              <p>No hay stories en este período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStories.slice(0, 10).map((story) => {
                const isExpired = new Date(story.expires_at) <= new Date();
                
                return (
                  <div
                    key={story.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                      isExpired ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={story.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          getStoryTypeColor(story.story_type)
                        )}>
                          {getStoryTypeLabel(story.story_type)}
                        </span>
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Expirada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {story.caption || "Sin descripción"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(story.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{story.views_count || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteStory(story.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}