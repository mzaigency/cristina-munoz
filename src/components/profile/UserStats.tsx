import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Star, Heart, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserStatsData {
  totalBookings: number;
  completedBookings: number;
  favoriteSalon: { name: string; count: number } | null;
  averageRating: number | null;
  memberSince: string;
}

interface UserStatsProps {
  userId: string;
}

export function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, status, tenant_id, created_at')
          .eq('user_id', userId);

        if (bookingsError) throw bookingsError;

        // Fetch user profile for member since
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .single();

        // Fetch reviews by user
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('user_id', userId);

        // Fetch favorites
        const { data: favorites } = await supabase
          .from('favorites')
          .select('tenant_id')
          .eq('user_id', userId);

        // Calculate stats
        const totalBookings = bookings?.length || 0;
        const completedBookings = bookings?.filter(b => 
          b.status === 'completed' || b.status === 'confirmed'
        ).length || 0;

        // Find most visited salon
        let favoriteSalon: { name: string; count: number } | null = null;
        if (bookings && bookings.length > 0) {
          const tenantCounts: Record<string, number> = {};
          bookings.forEach(b => {
            if (b.tenant_id) {
              tenantCounts[b.tenant_id] = (tenantCounts[b.tenant_id] || 0) + 1;
            }
          });

          const topTenantId = Object.entries(tenantCounts)
            .sort((a, b) => b[1] - a[1])[0];

          if (topTenantId) {
            const { data: tenant } = await supabase
              .rpc('get_public_tenants')
              .eq('id', topTenantId[0])
              .single();

            if (tenant) {
              favoriteSalon = {
                name: tenant.name,
                count: topTenantId[1],
              };
            }
          }
        }

        // Calculate average rating given
        const averageRating = reviews && reviews.length > 0
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          : null;

        setStats({
          totalBookings,
          completedBookings,
          favoriteSalon,
          averageRating,
          memberSince: profile?.created_at || new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: Calendar,
      label: 'Citas realizadas',
      value: stats.completedBookings.toString(),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Heart,
      label: 'Salón favorito',
      value: stats.favoriteSalon?.name || 'Ninguno aún',
      subValue: stats.favoriteSalon ? `${stats.favoriteSalon.count} visitas` : undefined,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      icon: Star,
      label: 'Rating promedio',
      value: stats.averageRating ? stats.averageRating.toFixed(1) : '-',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Miembro desde',
      value: new Date(stats.memberSince).toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
      }),
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="ios-card p-4"
        >
          <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center mb-3`}>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <p className="text-lg font-bold text-foreground line-clamp-1">
            {item.value}
          </p>
          {item.subValue && (
            <p className="text-xs text-muted-foreground">{item.subValue}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
