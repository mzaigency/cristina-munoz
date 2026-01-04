import { motion } from "framer-motion";
import { Users, Star } from "lucide-react";
import { useFollows } from "@/hooks/useFollows";
import { Skeleton } from "@/components/ui/skeleton";

interface FollowerStatsProps {
  tenantId: string;
  rating?: number;
  reviewCount?: number;
  primaryColor?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function FollowerStats({ tenantId, rating, reviewCount, primaryColor }: FollowerStatsProps) {
  const { useFollowerCount } = useFollows();
  const { data: followerCount, isLoading } = useFollowerCount(tenantId);

  const stats = [
    {
      icon: Users,
      value: isLoading ? null : formatNumber(followerCount || 0),
      label: "Seguidores",
    },
    {
      icon: Star,
      value: rating ? rating.toFixed(1) : "Nuevo",
      label: reviewCount ? `${reviewCount} reseñas` : "Sin reseñas",
    },
  ];

  return (
    <div className="flex justify-center gap-8 py-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <stat.icon className="w-4 h-4 opacity-70" />
            {stat.value === null ? (
              <Skeleton className="w-8 h-5" />
            ) : (
              <span className="text-lg font-bold">{stat.value}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
