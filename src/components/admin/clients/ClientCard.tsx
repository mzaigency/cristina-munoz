import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronRight, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import type { Client } from "./types";
import { TAG_COLORS } from "./types";

interface ClientCardProps {
  client: Client;
  index: number;
  onClick: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-rose-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function ClientCard({ client, index, onClick }: ClientCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`h-10 w-10 rounded-full ${getAvatarColor(client.name)} flex items-center justify-center`}>
              <span className="text-white text-sm font-bold">{getInitials(client.name)}</span>
            </div>
            {client.user_id && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                <UserCheck className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{client.name}</h4>
              {client.tags?.slice(0, 2).map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${TAG_COLORS[tag] || ""}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {client.phone && <span>{client.phone}</span>}
              <span>{client.total_visits} visitas</span>
              <span className="font-medium text-green-600">{(client.total_spent || 0).toFixed(0)}€</span>
              {client.last_visit_at && (
                <span>Últ: {format(new Date(client.last_visit_at), "d MMM", { locale: es })}</span>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </motion.div>
  );
}
