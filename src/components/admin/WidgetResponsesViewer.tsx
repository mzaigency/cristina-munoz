import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, MessageCircle, Smile, Users, 
  TrendingUp, Clock, RefreshCw, Eye 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface WidgetResponsesViewerProps {
  tenantId: string;
}

interface Widget {
  id: string;
  story_id: string;
  widget_type: string;
  config: any;
  position_x: number;
  position_y: number;
  created_at: string;
}

interface WidgetResponse {
  id: string;
  widget_id: string;
  user_id: string;
  response: any;
  created_at: string;
}

interface WidgetWithResponses extends Widget {
  responses: WidgetResponse[];
  story?: {
    image_url: string;
    caption: string | null;
  };
}

export function WidgetResponsesViewer({ tenantId }: WidgetResponsesViewerProps) {
  const queryClient = useQueryClient();
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);

  // Fetch all widgets for tenant's stories
  const { data: widgets, isLoading } = useQuery({
    queryKey: ["widget-responses", tenantId],
    queryFn: async () => {
      // First get all stories for this tenant
      const { data: stories, error: storiesError } = await supabase
        .from("salon_stories")
        .select("id, image_url, caption")
        .eq("tenant_id", tenantId);

      if (storiesError) throw storiesError;
      if (!stories?.length) return [];

      const storyIds = stories.map(s => s.id);

      // Then get all widgets for those stories
      const { data: widgetsData, error: widgetsError } = await supabase
        .from("story_widgets")
        .select("*")
        .in("story_id", storyIds)
        .order("created_at", { ascending: false });

      if (widgetsError) throw widgetsError;
      if (!widgetsData?.length) return [];

      // Get responses for all widgets
      const widgetIds = widgetsData.map(w => w.id);
      const { data: responses, error: responsesError } = await supabase
        .from("story_widget_responses")
        .select("*")
        .in("widget_id", widgetIds)
        .order("created_at", { ascending: false });

      if (responsesError) throw responsesError;

      // Combine data
      const widgetsWithResponses: WidgetWithResponses[] = widgetsData.map(widget => ({
        ...widget,
        responses: responses?.filter(r => r.widget_id === widget.id) || [],
        story: stories.find(s => s.id === widget.story_id),
      }));

      return widgetsWithResponses;
    },
  });

  // Realtime subscription for new responses
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel("widget-responses-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "story_widget_responses",
        },
        (payload) => {
          console.log("New widget response:", payload);
          // Invalidate query to refresh data
          queryClient.invalidateQueries({ queryKey: ["widget-responses", tenantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient, isLive]);

  const getWidgetTypeIcon = (type: string) => {
    switch (type) {
      case "poll": return BarChart3;
      case "question": return MessageCircle;
      case "emoji_slider": return Smile;
      default: return BarChart3;
    }
  };

  const getWidgetTypeLabel = (type: string) => {
    switch (type) {
      case "poll": return "Encuesta";
      case "question": return "Pregunta";
      case "emoji_slider": return "Slider Emoji";
      default: return type;
    }
  };

  const getWidgetTypeColor = (type: string) => {
    switch (type) {
      case "poll": return "bg-violet-500/20 text-violet-400 border-violet-500/30";
      case "question": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "emoji_slider": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Stats
  const totalWidgets = widgets?.length || 0;
  const totalResponses = widgets?.reduce((sum, w) => sum + w.responses.length, 0) || 0;
  const avgResponsesPerWidget = totalWidgets > 0 ? (totalResponses / totalWidgets).toFixed(1) : "0";

  // Render poll results
  const renderPollResults = (widget: WidgetWithResponses) => {
    const config = widget.config as { question: string; options: string[] };
    const voteCounts: Record<number, number> = {};
    
    widget.responses.forEach(r => {
      const vote = r.response?.vote as number;
      if (vote !== undefined) {
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
      }
    });

    const totalVotes = widget.responses.length;

    return (
      <div className="space-y-3">
        <p className="font-medium text-foreground">{config.question || "Sin pregunta"}</p>
        <div className="space-y-2">
          {config.options?.map((option, index) => {
            const votes = voteCounts[index] || 0;
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

            return (
              <div key={index} className="relative">
                <div
                  className="absolute inset-0 bg-primary/20 rounded-lg transition-all"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between px-3 py-2 rounded-lg border border-border/50">
                  <span className="text-sm font-medium">{option}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{votes} votos</span>
                    <Badge variant="secondary" className="text-xs">
                      {percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render question responses
  const renderQuestionResponses = (widget: WidgetWithResponses) => {
    const config = widget.config as { prompt: string; placeholder: string };

    return (
      <div className="space-y-3">
        <p className="font-medium text-foreground">{config.prompt || "Sin pregunta"}</p>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-4">
            <AnimatePresence>
              {widget.responses.map((response, index) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <p className="text-sm text-foreground">{response.response?.text || "Sin respuesta"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(response.created_at), { addSuffix: true, locale: es })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            {widget.responses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aún no hay respuestas
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Render emoji slider results
  const renderEmojiSliderResults = (widget: WidgetWithResponses) => {
    const config = widget.config as { question: string; emoji: string };
    
    const values = widget.responses.map(r => r.response?.value as number || 0);
    const average = values.length > 0 
      ? values.reduce((a, b) => a + b, 0) / values.length 
      : 0;

    // Distribution for histogram
    const distribution: number[] = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
    values.forEach(v => {
      const bucket = Math.min(4, Math.floor(v / 20));
      distribution[bucket]++;
    });
    const maxDistribution = Math.max(...distribution, 1);

    return (
      <div className="space-y-4">
        <p className="font-medium text-foreground">{config.question || "Sin pregunta"}</p>
        
        {/* Average indicator */}
        <div className="flex items-center gap-4">
          <span className="text-4xl">{config.emoji || "❤️"}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Promedio</span>
              <span className="text-lg font-bold text-foreground">{average.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${average}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Distribution histogram */}
        <div className="flex items-end gap-1 h-16">
          {distribution.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/30 rounded-t transition-all"
                style={{ height: `${(count / maxDistribution) * 100}%`, minHeight: count > 0 ? 8 : 0 }}
              />
              <span className="text-[10px] text-muted-foreground">
                {i * 20}-{(i + 1) * 20}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
          <h2 className="text-2xl font-bold text-foreground">Respuestas de Widgets</h2>
          <p className="text-muted-foreground">Visualiza las interacciones en tiempo real</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={isLive ? "default" : "secondary"}
            className={cn(
              "cursor-pointer transition-all",
              isLive && "animate-pulse"
            )}
            onClick={() => setIsLive(!isLive)}
          >
            <RefreshCw className={cn("w-3 h-3 mr-1", isLive && "animate-spin")} />
            {isLive ? "En vivo" : "Pausado"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Widgets</p>
                <p className="text-2xl font-bold">{totalWidgets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Users className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Respuestas</p>
                <p className="text-2xl font-bold">{totalResponses}</p>
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
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold">{avgResponsesPerWidget}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets list */}
      {(!widgets || widgets.length === 0) ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No hay widgets en tus historias</p>
            <p className="text-sm text-muted-foreground mt-1">
              Añade encuestas, preguntas o sliders a tus stories
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={widgets[0]?.id} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {widgets.map((widget) => {
              const Icon = getWidgetTypeIcon(widget.widget_type);
              return (
                <TabsTrigger
                  key={widget.id}
                  value={widget.id}
                  className={cn(
                    "data-[state=active]:shadow-none border",
                    getWidgetTypeColor(widget.widget_type)
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {getWidgetTypeLabel(widget.widget_type)}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {widget.responses.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {widgets.map((widget) => (
            <TabsContent key={widget.id} value={widget.id}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {widget.story?.image_url && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={widget.story.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getWidgetTypeLabel(widget.widget_type)}
                          <Badge className={getWidgetTypeColor(widget.widget_type)}>
                            {widget.responses.length} respuestas
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(widget.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {widget.widget_type === "poll" && renderPollResults(widget)}
                  {widget.widget_type === "question" && renderQuestionResponses(widget)}
                  {widget.widget_type === "emoji_slider" && renderEmojiSliderResults(widget)}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
