import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  User, Phone, Mail, Calendar, StickyNote, History,
  Trash2, Edit, MessageSquare, Gift, UserCheck, UserX
} from "lucide-react";
import type { Client, Booking } from "./types";
import { TAG_COLORS } from "./types";

interface LinkedProfile {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string;
}

interface ClientDetailProps {
  client: Client;
  tenantId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientDetail({ client, tenantId, onEdit, onDelete }: ClientDetailProps) {
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [topServices, setTopServices] = useState<string[]>([]);
  const [linkedProfile, setLinkedProfile] = useState<LinkedProfile | null>(null);

  useEffect(() => {
    if (client.phone) fetchHistory(client.phone);
  }, [client.phone]);

  useEffect(() => {
    if (client.user_id) {
      supabase.from("profiles").select("full_name, username, avatar_url, email").eq("id", client.user_id).single()
        .then(({ data }) => { if (data) setLinkedProfile(data as LinkedProfile); });
    } else {
      setLinkedProfile(null);
    }
  }, [client.user_id]);

  const fetchHistory = async (phone: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("bookings")
        .select("id, Fecha, Hora, services, stylist, status, compound_part")
        .eq("tenant_id", tenantId)
        .eq("Telefono", phone)
        .order("Fecha", { ascending: false })
        .limit(40);

      // Filter out part2 compound bookings so compound services count as 1 visit
      const filteredData = (data || []).filter((b: any) => b.compound_part !== "part2").slice(0, 20);

      const bookings = (filteredData as Booking[]) || [];
      setHistory(bookings);

      const serviceCount: Record<string, number> = {};
      bookings.forEach(b => {
        if (Array.isArray(b.services)) {
          (b.services as any[]).forEach(s => {
            const name = s.name || s;
            if (typeof name === "string") serviceCount[name] = (serviceCount[name] || 0) + 1;
          });
        }
      });
      setTopServices(
        Object.entries(serviceCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name)
      );
    } catch (e) {
      console.error("Error fetching history:", e);
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = client.phone
    ? `https://wa.me/${client.phone.replace(/\s+/g, "").replace(/^\+/, "")}`
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{client.name}</h3>
            {client.phone && (
              <a href={`tel:${client.phone}`} className="text-sm text-outline flex items-center gap-1">
                <Phone className="h-3 w-3" /> {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="text-sm text-outline flex items-center gap-1">
                <Mail className="h-3 w-3" /> {client.email}
              </a>
            )}
            {client.birthday && (
              <p className="text-sm text-outline flex items-center gap-1">
                <Gift className="h-3 w-3 text-glow-accent-ink" />
                {format(new Date(client.birthday + "T00:00:00"), "d MMMM", { locale: es })}
              </p>
            )}
          </div>
        </div>

        {/* Linked profile badge */}
        <div className="mt-3">
          {linkedProfile ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-glow-ok/10 border border-glow-ok/20">
              <Avatar className="h-6 w-6">
                {linkedProfile.avatar_url && <AvatarImage src={linkedProfile.avatar_url} />}
                <AvatarFallback className="text-[10px] bg-glow-ok/20 text-glow-ok-ink">
                  {(linkedProfile.full_name || linkedProfile.email)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-glow-ok-ink">
                  {linkedProfile.username ? `@${linkedProfile.username}` : linkedProfile.full_name || linkedProfile.email}
                </span>
              </div>
              <UserCheck className="h-3.5 w-3.5 text-glow-ok-ink shrink-0" />
              <span className="text-[10px] text-glow-ok-ink font-medium">Vinculado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
              <UserX className="h-3.5 w-3.5 text-outline" />
              <span className="text-[10px] text-outline">Sin cuenta vinculada</span>
            </div>
          )}
        </div>

        {client.tags && client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {client.tags.map(tag => (
              <Badge key={tag} variant="outline" className={TAG_COLORS[tag] || ""}>{tag}</Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-background/60">
            <p className="text-lg font-bold text-primary">{client.total_visits}</p>
            <p className="text-[10px] text-outline">Visitas</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/60">
            <p className="text-lg font-bold text-glow-ok-ink">{(client.total_spent || 0).toFixed(0)}€</p>
            <p className="text-[10px] text-outline">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/60">
            <p className="text-lg font-bold text-outline">
              {client.last_visit_at
                ? format(new Date(client.last_visit_at), "dd/MM", { locale: es })
                : "-"}
            </p>
            <p className="text-[10px] text-outline">Última</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          {client.phone && (
            <a className="glow-btn glow-btn--sm glow-btn--grow text-xs" href={`tel:${client.phone}`}><Phone className="h-3.5 w-3.5 mr-1" />Llamar</a>
          )}
          {whatsappUrl && (
            <a className="glow-btn glow-btn--sm glow-btn--grow text-xs" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />WhatsApp
              </a>
          )}
        </div>
      </div>

      {/* Top services */}
      {topServices.length > 0 && (
        <div className="p-4 border-b">
          <p className="text-xs font-medium text-outline mb-1.5">Servicios frecuentes</p>
          <div className="flex flex-wrap gap-1.5">
            {topServices.map(s => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {client.notes && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="h-4 w-4 text-glow-warn-ink" />
            <span className="text-sm font-medium">Notas</span>
          </div>
          <p className="text-sm text-outline whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* History */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Historial de citas</span>
          </div>
        </div>
        <ScrollArea className="flex-1 px-4 pb-4" style={{ height: 'calc(100% - 48px)' }}>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-outline">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin historial de citas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(booking => {
                const services = Array.isArray(booking.services)
                  ? booking.services.map((s: any) => s.name || s).join(", ")
                  : "";
                return (
                  <div key={booking.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {format(new Date(booking.Fecha), "d MMM yyyy", { locale: es })}
                      </span>
                      <Badge
                        variant={booking.status === "confirmed" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {booking.status === "confirmed" ? "Confirmada" : booking.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-outline mt-1">{booking.Hora} - {booking.stylist}</p>
                    {services && <p className="text-xs text-outline truncate mt-0.5">{services}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t flex gap-2">
        <button className="glow-btn glow-btn--sm glow-btn--grow" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" /> Editar
        </button>
        <button className="glow-btn glow-btn--sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
