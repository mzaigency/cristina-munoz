import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import {
  Loader2,
  Hourglass,
  Sparkles,
  Calendar as CalIcon,
  Clock,
  X,
  CheckCircle2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

interface UserWaitlistEntry {
  id: string;
  tenant_id: string;
  status: string;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_stylist_id: string | null;
  services: any[];
  created_at: string;
  proposed_date: string | null;
  proposed_time: string | null;
  proposed_stylist_id: string | null;
  proposed_at: string | null;
  proposed_expires_at: string | null;
  tenant?: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
  stylist_name?: string | null;
}

export function MyWaitlistList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<UserWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    load();

    // Realtime updates
    const channel = supabase
      .channel(`waitlist-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waitlist",
          filter: `user_id=eq.${user.id}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("waitlist" as any)
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["waiting", "notified", "proposed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data || []) as unknown as UserWaitlistEntry[];

      // Hydrate tenant + stylist names
      if (list.length > 0) {
        const tenantIds = [...new Set(list.map((e) => e.tenant_id))];
        const stylistIds = [
          ...new Set(
            list
              .map((e) => e.proposed_stylist_id || e.preferred_stylist_id)
              .filter(Boolean) as string[]
          ),
        ];

        const [tenantsRes, stylistsRes] = await Promise.all([
          supabase
            .from("tenants")
            .select("id, name, slug, logo_url")
            .in("id", tenantIds),
          stylistIds.length > 0
            ? supabase
                .from("tenant_stylists")
                .select("id, name")
                .in("id", stylistIds)
            : Promise.resolve({ data: [] }),
        ]);

        const tenantMap = new Map(
          (tenantsRes.data || []).map((t: any) => [t.id, t])
        );
        const stylistMap = new Map(
          (stylistsRes.data || []).map((s: any) => [s.id, s.name])
        );

        list.forEach((e) => {
          e.tenant = tenantMap.get(e.tenant_id) as any;
          const sid = e.proposed_stylist_id || e.preferred_stylist_id;
          e.stylist_name = sid ? (stylistMap.get(sid) as string) || null : null;
        });
      }

      setEntries(list);
    } catch (err) {
      console.error("Error loading user waitlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (entry: UserWaitlistEntry) => {
    setActionLoading(entry.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "accept-waitlist-proposal",
        { body: { waitlist_id: entry.id, action: "accept" } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "¡Cita confirmada! 🎉",
        description: "Ya está en tu agenda",
      });
      load();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo confirmar",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    setRejectId(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "accept-waitlist-proposal",
        { body: { waitlist_id: id, action: "reject" } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Hueco rechazado",
        description: "Sigues en lista de espera",
      });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    setCancelId(null);
    try {
      const { error } = await supabase
        .from("waitlist" as any)
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Te has salido de la lista de espera" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6"
      >
        <div className="w-24 h-24 rounded-[28px] liquid-glass-card flex items-center justify-center mb-6">
          <Hourglass className="h-11 w-11 text-muted-foreground/60" />
        </div>
        <h3 className="text-xl font-bold mb-2 tracking-tight">
          No estás en ninguna lista
        </h3>
        <p className="text-sm text-muted-foreground max-w-[280px] text-center leading-relaxed">
          Cuando un salón no tenga huecos podrás apuntarte y te avisaremos en
          cuanto se libere uno.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const isProposed = entry.status === "proposed";
        const isExpired =
          isProposed &&
          entry.proposed_expires_at &&
          new Date(entry.proposed_expires_at) < new Date();

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`liquid-glass-card !rounded-2xl p-4 ${isProposed && !isExpired ? "ring-2 ring-primary/40" : ""}`}
          >
            <div className="flex items-start gap-3">
              {entry.tenant?.logo_url ? (
                <img
                  src={entry.tenant.logo_url}
                  alt={entry.tenant.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border/50 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                  <Hourglass className="h-6 w-6 text-primary" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base truncate">
                    {entry.tenant?.name || "Salón"}
                  </h3>
                  {isProposed && !isExpired && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Hueco para ti
                    </span>
                  )}
                  {!isProposed && entry.status === "notified" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 font-medium">
                      Avisado
                    </span>
                  )}
                  {!isProposed && entry.status === "waiting" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      Esperando
                    </span>
                  )}
                </div>

                {Array.isArray(entry.services) && entry.services.length > 0 && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                    {entry.services.map((s: any) => s.name).join(" · ")}
                  </p>
                )}

                {/* Proposed slot highlight */}
                {isProposed && entry.proposed_date && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl ${isExpired ? "bg-muted/50 border border-border" : "bg-primary/10 border border-primary/30"}`}
                  >
                    {isExpired ? (
                      <p className="text-xs text-muted-foreground">
                        Esta propuesta ha caducado. Sigues en lista de espera.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                          <span className="flex items-center gap-1">
                            <CalIcon className="h-3.5 w-3.5 text-primary" />
                            {format(
                              parseISO(entry.proposed_date),
                              "EEE d MMM",
                              { locale: es }
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {String(entry.proposed_time).slice(0, 5)}
                          </span>
                        </div>
                        {entry.stylist_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            con {entry.stylist_name}
                          </p>
                        )}
                        {entry.proposed_expires_at && (
                          <p className="text-[11px] text-primary/80 mt-1 font-medium">
                            Confirma antes del{" "}
                            {format(
                              new Date(entry.proposed_expires_at),
                              "d MMM HH:mm",
                              { locale: es }
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Preferred (only when not proposed) */}
                {!isProposed && entry.preferred_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <CalIcon className="h-3.5 w-3.5" />
                    Preferida:{" "}
                    {format(parseISO(entry.preferred_date), "d MMM", {
                      locale: es,
                    })}
                    {entry.preferred_time_start &&
                      ` · ${entry.preferred_time_start.slice(0, 5)}`}
                    {entry.stylist_name && ` · ${entry.stylist_name}`}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
              {isProposed && !isExpired ? (
                <>
                  <Button
                    onClick={() => handleAccept(entry)}
                    disabled={actionLoading === entry.id}
                    className="flex-1 h-10 rounded-xl gap-1.5"
                  >
                    {actionLoading === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirmar cita
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectId(entry.id)}
                    disabled={actionLoading === entry.id}
                    className="h-10 rounded-xl px-3"
                  >
                    Rechazar
                  </Button>
                </>
              ) : (
                <>
                  {entry.tenant?.slug && (
                    <button
                      onClick={() => navigate(`/${entry.tenant!.slug}`)}
                      className="flex-1 h-10 rounded-xl liquid-glass-pill !rounded-xl text-sm font-medium text-foreground active:bg-secondary/80 transition-colors"
                    >
                      Ver salón
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/mensajes?tenant=${entry.tenant_id}`)}
                    className="flex-1 h-10 rounded-xl bg-primary/10 text-sm font-medium text-primary active:bg-primary/20 transition-colors"
                  >
                    Mensaje
                  </button>
                  <button
                    onClick={() => setCancelId(entry.id)}
                    className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center active:bg-destructive/20 transition-colors"
                    aria-label="Salir de lista"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent className="rounded-3xl max-w-[340px]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de la lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya no recibirás avisos cuando haya hueco. Puedes volver a apuntarte
              en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelId && handleCancel(cancelId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Salir de la lista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject confirmation */}
      <AlertDialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <AlertDialogContent className="rounded-3xl max-w-[340px]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar este hueco?</AlertDialogTitle>
            <AlertDialogDescription>
              Seguirás en la lista de espera y te avisaremos si surge otro hueco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectId && handleReject(rejectId)}
            >
              Rechazar hueco
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
