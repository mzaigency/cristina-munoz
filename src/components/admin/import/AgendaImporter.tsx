import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Camera, Image as ImageIcon, X, Check, AlertTriangle, Sparkles, Crown, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";

type Mode = "bookings" | "services";

interface BookingRow {
  date: string | null;
  time: string | null;
  duration_minutes: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string | null;
  stylist_name: string | null;
  notes: string | null;
  raw_text: string | null;
  confidence: number;
}

interface ServiceRow {
  name: string;
  price: number | null;
  duration_minutes: number | null;
  category: string | null;
  description: string | null;
  notes: string | null;
  confidence: number;
}

type Row = (BookingRow | ServiceRow) & { _id: string; _discarded?: boolean };

const MAX_IMAGES = 10;
const MAX_FILE_MB = 5;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

interface Props {
  tenantId: string;
  defaultMode?: Mode;
  onComplete?: () => void;
}

export const AgendaImporter = ({ tenantId, defaultMode, onComplete }: Props) => {
  const { toast } = useToast();
  const { planSlug } = usePlanLimits(tenantId);
  const isBusiness = planSlug === "business";

  const [mode, setMode] = useState<Mode | null>(defaultMode ?? null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "processing" | "review" | "done">("upload");
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<{ created: number; clients?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const tooBig = incoming.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast({ title: "Imagen demasiado grande", description: `Máx ${MAX_FILE_MB}MB por foto.`, variant: "destructive" });
      return;
    }
    const next = [...files, ...incoming].slice(0, MAX_IMAGES);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const startProcessing = async () => {
    if (!mode || files.length === 0) return;
    setStep("processing");
    try {
      const images = await Promise.all(files.map(fileToDataUrl));
      const { data, error } = await supabase.functions.invoke("extract-from-photos", {
        body: { tenant_id: tenantId, mode, images },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const extracted: Row[] = (data?.rows ?? []).map((r: any, idx: number) => ({
        ...r,
        _id: `r${idx}-${Date.now()}`,
      }));
      if (extracted.length === 0) {
        toast({
          title: "No detectamos datos",
          description: data?.reason === "not_an_agenda" || data?.reason === "not_a_service_list"
            ? "La IA no reconoció una agenda/carta en las fotos. Prueba con fotos más claras."
            : "Inténtalo con fotos con mejor luz y enfoque.",
          variant: "destructive",
        });
        setStep("upload");
        return;
      }
      setRows(extracted);
      setStep("review");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error procesando", description: e?.message ?? "Inténtalo de nuevo", variant: "destructive" });
      setStep("upload");
    }
  };

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...patch } : r)));
  };

  const commit = async () => {
    if (!mode) return;
    const toSend = rows.filter((r) => !r._discarded).map(({ _id, _discarded, ...rest }) => rest);
    setStep("processing");
    try {
      const fnName = mode === "bookings" ? "commit-imported-bookings" : "commit-imported-services";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { tenant_id: tenantId, rows: toSend },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const created = mode === "bookings" ? data.created_bookings : data.created_services;
      setResult({ created, clients: data.created_clients });
      setStep("done");
      toast({
        title: "¡Importación completada!",
        description: `${created} ${mode === "bookings" ? "citas" : "servicios"} creados${
          data.created_clients ? ` y ${data.created_clients} clientes` : ""
        }.`,
      });
    } catch (e: any) {
      toast({ title: "Error guardando", description: e?.message, variant: "destructive" });
      setStep("review");
    }
  };

  // ---------- Render ----------

  if (!mode) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h3 className="text-xl font-bold mb-2">Importa tus datos en 2 minutos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sube fotos de tu agenda o tu carta de servicios y la IA los digitaliza por ti.
          </p>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card
            onClick={() => setMode("bookings")}
            className="p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">📅</div>
            <h4 className="font-semibold mb-1">Citas existentes</h4>
            <p className="text-xs text-muted-foreground">
              Sube fotos de tu agenda física u otra app y migramos las citas.
            </p>
          </Card>
          <Card
            onClick={() => setMode("services")}
            className="p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">💈</div>
            <h4 className="font-semibold mb-1">Servicios y precios</h4>
            <p className="text-xs text-muted-foreground">
              Foto de tu carta de servicios → catálogo digital al instante.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "upload") {
    const guidelines = mode === "bookings"
      ? ["Fecha visible (día/mes)", "Hora de cada cita", "Nombre del cliente", "Servicio (si lo apuntas)"]
      : ["Nombre del servicio", "Precio en €", "Duración (si la tienes)", "Categoría/sección"];

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Cambiar
        </Button>

        <Card className="p-5 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold mb-2">
                En la foto debe aparecer:
              </p>
              <ul className="space-y-1 mb-3">
                {guidelines.map((g) => (
                  <li key={g} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[var(--gp-ok-ink)] flex-shrink-0" /> {g}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                💡 Buena luz, sin reflejos, una página por foto. Hasta {MAX_IMAGES} fotos.
              </p>
            </div>
          </div>
        </Card>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= MAX_IMAGES}
            className="h-12"
          >
            <ImageIcon className="h-4 w-4 mr-2" /> Galería
          </Button>
          <label className={cn(
            "inline-flex items-center justify-center gap-2 h-12 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium",
            files.length >= MAX_IMAGES && "opacity-50 pointer-events-none"
          )}>
            <Camera className="h-4 w-4" /> Cámara
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <Button onClick={startProcessing} disabled={files.length === 0} className="w-full h-12 text-base">
          <Sparkles className="h-4 w-4 mr-2" />
          Procesar {files.length > 0 ? `${files.length} foto${files.length > 1 ? "s" : ""}` : "fotos"}
        </Button>

        {isBusiness && (
          <Card className="p-4 bg-gradient-to-br from-[var(--gp-warn-soft)] to-amber-100/50 border-[var(--gp-warn)]">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-[var(--gp-warn-ink)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Servicio Guante Blanco (gratis con tu plan Business)</p>
                <p className="text-xs text-muted-foreground mb-3">
                  ¿Prefieres que lo hagamos por ti? Sube las fotos y nuestro equipo migra todo manualmente en 24h.
                </p>
                <Button size="sm" variant="outline" onClick={() => {
                  toast({ title: "Función próximamente", description: "Contacta con soporte por ahora." });
                }}>
                  Solicitar
                </Button>
              </div>
            </div>
          </Card>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          🔒 Las fotos se procesan de forma segura y se eliminan tras 7 días.
        </p>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <Card className="p-10 text-center">
        <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
        <h3 className="font-semibold mb-1">La IA está leyendo tus fotos…</h3>
        <p className="text-sm text-muted-foreground">Esto puede tardar 20-40 segundos.</p>
      </Card>
    );
  }

  if (step === "done" && result) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gp-ok-soft)] flex items-center justify-center">
          <Check className="h-8 w-8 text-[var(--gp-ok-ink)]" />
        </div>
        <h3 className="text-xl font-bold mb-2">¡Listo!</h3>
        <p className="text-muted-foreground mb-6">
          Hemos creado <strong>{result.created}</strong> {mode === "bookings" ? "citas" : "servicios"}
          {result.clients ? <> y <strong>{result.clients}</strong> clientes nuevos</> : null}.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => {
            setMode(null); setFiles([]); setPreviews([]); setRows([]); setResult(null); setStep("upload");
          }} variant="outline">
            Importar más
          </Button>
          {onComplete && <Button onClick={onComplete}>Continuar</Button>}
        </div>
      </Card>
    );
  }

  // step === "review"
  const active = rows.filter((r) => !r._discarded);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Revisa antes de guardar</h3>
        <Badge variant="secondary">{active.length} {mode === "bookings" ? "citas" : "servicios"}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Edita lo que necesites. Los campos vacíos se quedan en blanco — la IA no inventa datos.
      </p>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {rows.map((r) => {
          const lowConf = r.confidence < 0.5;
          const isBooking = mode === "bookings";
          const b = r as BookingRow & Row;
          const s = r as ServiceRow & Row;
          return (
            <Card
              key={r._id}
              className={cn(
                "p-3 transition-opacity",
                r._discarded && "opacity-40",
                lowConf && !r._discarded && "border-[var(--gp-warn)] bg-amber-50/30",
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {lowConf ? (
                    <Badge variant="outline" className="text-[10px] border-[var(--gp-warn)] text-[var(--gp-warn-ink)]">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Revisar
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-[var(--gp-ok)] text-[var(--gp-ok-ink)]">
                      <Check className="h-3 w-3 mr-1" /> OK
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateRow(r._id, { _discarded: !r._discarded } as any)}
                  className="h-7 px-2 text-xs"
                >
                  {r._discarded ? "Recuperar" : "Descartar"}
                </Button>
              </div>

              {isBooking ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={b.date ?? ""} onChange={(e) => updateRow(r._id, { date: e.target.value || null } as any)} className="h-8 text-xs" />
                  <Input type="time" value={b.time ?? ""} onChange={(e) => updateRow(r._id, { time: e.target.value || null } as any)} className="h-8 text-xs" />
                  <Input placeholder="Cliente" value={b.customer_name ?? ""} onChange={(e) => updateRow(r._id, { customer_name: e.target.value || null } as any)} className="h-8 text-xs col-span-2" />
                  <Input placeholder="Teléfono" value={b.customer_phone ?? ""} onChange={(e) => updateRow(r._id, { customer_phone: e.target.value || null } as any)} className="h-8 text-xs" />
                  <Input placeholder="Servicio" value={b.service_name ?? ""} onChange={(e) => updateRow(r._id, { service_name: e.target.value || null } as any)} className="h-8 text-xs" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Servicio" value={s.name ?? ""} onChange={(e) => updateRow(r._id, { name: e.target.value } as any)} className="h-8 text-xs col-span-2" />
                  <Input type="number" placeholder="Precio €" value={s.price ?? ""} onChange={(e) => updateRow(r._id, { price: e.target.value === "" ? null : Number(e.target.value) } as any)} className="h-8 text-xs" />
                  <Input type="number" placeholder="Duración min" value={s.duration_minutes ?? ""} onChange={(e) => updateRow(r._id, { duration_minutes: e.target.value === "" ? null : Number(e.target.value) } as any)} className="h-8 text-xs" />
                  <Input placeholder="Categoría" value={s.category ?? ""} onChange={(e) => updateRow(r._id, { category: e.target.value || null } as any)} className="h-8 text-xs col-span-2" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2 sticky bottom-0 bg-background pt-3 border-t">
        <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
          Volver
        </Button>
        <Button onClick={commit} disabled={active.length === 0} className="flex-1">
          Guardar {active.length}
        </Button>
      </div>
    </div>
  );
};

export default AgendaImporter;
