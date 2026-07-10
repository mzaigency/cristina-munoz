import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DEMO_PROSPECTS, type DemoProspect } from "@/constants/demoProspects";
import {
  Wand2, Loader2, ExternalLink, LayoutDashboard, CheckCircle2, Star, Users, Scissors, Clock,
} from "lucide-react";

interface CreatedDemo {
  slug: string;
  expiresAt: string | null;
}

/**
 * Fábrica de demos para las visitas de venta en Manresa.
 * Un clic por prospecto: crea el tenant completo (web pública en catalán, panel,
 * servicios, equipo, horarios, clientas y una agenda con reservas de ejemplo)
 * con el superadmin como dueño del panel. Caducan a los 14 días.
 */
export function DemoFactory() {
  const [created, setCreated] = useState<Map<string, CreatedDemo>>(new Map());
  const [creating, setCreating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExisting = useCallback(async () => {
    try {
      const slugs = DEMO_PROSPECTS.map((p) => p.slug);
      const { data } = await supabase
        .from("tenants")
        .select("slug, subscription_expires_at")
        .in("slug", slugs);
      const map = new Map<string, CreatedDemo>();
      (data || []).forEach((t) => map.set(t.slug, { slug: t.slug, expiresAt: t.subscription_expires_at }));
      setCreated(map);
    } catch (error) {
      console.error("Error fetching existing demos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExisting();
  }, [fetchExisting]);

  const handleCreate = async (prospect: DemoProspect) => {
    setCreating(prospect.slug);
    try {
      const { data, error } = await supabase.functions.invoke("create-demo-tenant", {
        body: prospect,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.already_exists) {
        toast({ title: "Ya existía", description: `${prospect.name} ya tiene demo creada` });
      } else {
        toast({
          title: "✨ Demo lista",
          description: `${prospect.name}: web, panel, servicios, equipo y agenda con reservas`,
        });
      }
      await fetchExisting();
    } catch (error) {
      console.error("Error creating demo:", error);
      const msg = error instanceof Error ? error.message : "No se pudo crear la demo";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCreating(null);
    }
  };

  const formatExpiry = (iso: string | null) => {
    if (!iso) return null;
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return days > 0 ? `caduca en ${days} d` : "caducada";
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Wand2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Demos para visitas de venta</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Un clic crea el negocio completo: web pública en catalán, panel de gestión (tú eres el admin),
              servicios con precios, equipo, horarios, clientas y una agenda con reservas de ejemplo.
              Plan Pro · caducan a los 14 días. En la visita: los precios se presentan siempre como ajustables.
            </p>
          </div>
        </div>
      </div>

      {/* Preview del asistente de alta (crea un "Salón Demo" desechable) */}
      <a
        href="/onboarding/setup?demo=true"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors"
      >
        <Wand2 className="h-4 w-4" />
        Ver el asistente de onboarding
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {DEMO_PROSPECTS.map((p) => {
            const demo = created.get(p.slug);
            const isCreating = creating === p.slug;
            return (
              <div key={p.slug} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground truncate">{p.name}</h3>
                      {demo && (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Creada
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.typeLabel} · {p.address}, {p.city}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 whitespace-nowrap shrink-0">
                    <Star className="h-3 w-3 fill-current" /> {p.reviews}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {p.team.join(", ")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Scissors className="h-3 w-3" /> {p.services.length} servicios
                  </span>
                  {demo?.expiresAt && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatExpiry(demo.expiresAt)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground/90 italic leading-snug">"{p.hook}"</p>

                <div className="mt-auto flex gap-2 pt-1">
                  {demo ? (
                    <>
                      <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs">
                        <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Ver web
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs">
                        <a href={`/admin/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <LayoutDashboard className="h-3.5 w-3.5" /> Panel
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCreate(p)}
                      disabled={isCreating || creating !== null}
                      className="flex-1 gap-1.5 h-8 text-xs"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creando todo...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5" /> Crear demo
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Para borrar una demo usa la pestaña Tenants. Si un negocio firma, no borres su demo: conviértela en
        su cuenta real (ya tiene todo montado).
      </p>
    </div>
  );
}
