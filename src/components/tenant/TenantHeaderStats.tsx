import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Star, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TenantHeaderStatsProps {
  tenantId: string;
  isScrolled: boolean;
}

interface QuickStats {
  todayBookings: number;
  previousBookings: number;
  totalClients: number;
  averageRating: number;
}

export const TenantHeaderStats = ({ tenantId, isScrolled }: TenantHeaderStatsProps) => {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickStats();
    
    const interval = setInterval(fetchQuickStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tenantId]);

  const fetchQuickStats = async () => {
    try {
      const [bookingsResult, clientsResult, reviewsResult] = await Promise.all([
        // Fetch today's bookings
        supabase.functions.invoke("get-bookings-stats", {
          body: { tenantId },
        }),
        // Fetch total clients
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        // Fetch average rating
        supabase
          .from("reviews")
          .select("rating")
          .eq("tenant_id", tenantId)
          .eq("approved", true),
      ]);

      const averageRating = reviewsResult.data && reviewsResult.data.length > 0
        ? reviewsResult.data.reduce((sum, r) => sum + r.rating, 0) / reviewsResult.data.length
        : 0;

      setStats({
        todayBookings: bookingsResult.data?.daily?.total || 0,
        previousBookings: bookingsResult.data?.daily?.previous || 0,
        totalClients: clientsResult.count || 0,
        averageRating,
      });
    } catch (error) {
      console.error("Error fetching quick stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return null;

  const bookingsChange = stats.previousBookings > 0 
    ? Math.round(((stats.todayBookings - stats.previousBookings) / stats.previousBookings) * 100)
    : stats.todayBookings > 0 ? 100 : 0;

  const baseClasses = cn(
    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
    isScrolled 
      ? "bg-muted/80 text-foreground" 
      : "bg-white/20 backdrop-blur-sm text-white"
  );

  return (
    <div className="hidden lg:flex items-center gap-2">
      {/* Today's Bookings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={baseClasses}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{stats.todayBookings}</span>
            {bookingsChange !== 0 && (
              <span className={cn(
                "flex items-center",
                bookingsChange > 0 ? "text-green-500" : "text-red-500"
              )}>
                {bookingsChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reservas hoy: {stats.todayBookings}</p>
          {bookingsChange !== 0 && (
            <p className="text-xs text-muted-foreground">
              {bookingsChange > 0 ? "+" : ""}{bookingsChange}% vs ayer
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Total Clients */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={baseClasses}>
            <Users className="h-3.5 w-3.5" />
            <span>{stats.totalClients}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total clientes: {stats.totalClients}</p>
        </TooltipContent>
      </Tooltip>

      {/* Average Rating */}
      {stats.averageRating > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={baseClasses}>
              <Star className="h-3.5 w-3.5 text-amber-500" />
              <span>{stats.averageRating.toFixed(1)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Valoración media: {stats.averageRating.toFixed(1)}/5</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default TenantHeaderStats;
