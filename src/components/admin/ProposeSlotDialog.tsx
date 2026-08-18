import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Calendar as CalIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface Stylist {
  id: string;
  name: string;
  slug: string;
}

interface ProposeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waitlistEntry: {
    id: string;
    client_name: string;
    user_id: string | null;
    client_phone: string | null;
    preferred_date: string | null;
    preferred_time_start: string | null;
    preferred_stylist_id: string | null;
    services: any[];
  };
  stylists: Stylist[];
  tenantSlug: string;
  onProposed: () => void;
}

export function ProposeSlotDialog({
  open,
  onOpenChange,
  waitlistEntry,
  stylists,
  tenantSlug,
  onProposed,
}: ProposeSlotDialogProps) {
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [stylistId, setStylistId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [conflictWarn, setConflictWarn] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(waitlistEntry.preferred_date || format(new Date(), "yyyy-MM-dd"));
      setTime(
        waitlistEntry.preferred_time_start
          ? waitlistEntry.preferred_time_start.slice(0, 5)
          : ""
      );
      setStylistId(waitlistEntry.preferred_stylist_id || "");
      setConflictWarn(null);
    }
  }, [open, waitlistEntry]);

  // Validate slot availability when fields change
  useEffect(() => {
    if (!open || !date || !time) {
      setConflictWarn(null);
      return;
    }

    const checkConflict = async () => {
      const services = Array.isArray(waitlistEntry.services)
        ? waitlistEntry.services
        : [];
      const duration = services.reduce(
        (sum: number, s: any) =>
          sum +
          (s.duration ||
            s.total_duration ||
            s.duration_part1_active ||
            30),
        0
      ) || 60;

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .maybeSingle();

      if (!tenantData) return;

      const stylistRow = stylistId
        ? stylists.find((s) => s.id === stylistId)
        : null;

      let query = supabase
        .from("bookings")
        .select("Hora, total_duration, stylist")
        .eq("tenant_id", tenantData.id)
        .eq("Fecha", date)
        .eq("status", "confirmed");

      if (stylistRow?.slug) {
        query = query.eq("stylist", stylistRow.slug);
      }

      const { data: bookings } = await query;

      const [h, m] = time.split(":").map(Number);
      const proposedStart = h * 60 + (m || 0);
      const proposedEnd = proposedStart + duration;

      const conflict = (bookings || []).some((b: any) => {
        const [bh, bm] = b.Hora.slice(0, 5).split(":").map(Number);
        const bStart = bh * 60 + (bm || 0);
        const bEnd = bStart + (b.total_duration || 60);
        return proposedStart < bEnd && proposedEnd > bStart;
      });

      setConflictWarn(
        conflict
          ? `Atención: hay otra cita en ese tramo${stylistRow ? ` con ${stylistRow.name}` : ""}.`
          : null
      );
    };

    checkConflict();
  }, [date, time, stylistId, open, waitlistEntry, stylists, tenantSlug]);

  const handlePropose = async () => {
    if (!date || !time) {
      toast({
        title: "Faltan datos",
        description: "Selecciona fecha y hora",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "propose-waitlist-slot",
        {
          body: {
            waitlist_id: waitlistEntry.id,
            proposed_date: date,
            proposed_time: time,
            proposed_stylist_id: stylistId || null,
          },
        }
      );

      if (error) throw error;

      // If client has no app account but has phone → open WhatsApp
      if (!data?.has_user && waitlistEntry.client_phone) {
        const phone = waitlistEntry.client_phone.replace(/\D/g, "");
        const msg = encodeURIComponent(
          `¡Hola ${waitlistEntry.client_name}! Te escribo desde el salón. Tenemos un hueco para ti el ${data.formatted_date} a las ${data.formatted_time}. ¿Te viene bien? 💜`
        );
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
      }

      toast({
        title: "Hueco propuesto",
        description: data?.has_user
          ? `Avisado a ${waitlistEntry.client_name} por la app`
          : "Mensaje preparado para WhatsApp",
      });

      onProposed();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo proponer el hueco",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom),1rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Proponer hueco
          </DialogTitle>
          <DialogDescription>
            A {waitlistEntry.client_name}
            {waitlistEntry.user_id
              ? " (recibirá aviso en la app)"
              : waitlistEntry.client_phone
                ? " (te abriremos WhatsApp)"
                : " (sin contacto digital)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs flex items-center gap-1.5">
              <CalIcon className="h-3.5 w-3.5" /> Fecha
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Hora
            </Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Profesional</Label>
            <Select
              value={stylistId || "none"}
              onValueChange={(v) => setStylistId(v === "none" ? "" : v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {stylists.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {conflictWarn && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ {conflictWarn}
            </div>
          )}

          <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            La clienta tiene 24h para confirmar. Si acepta, la cita se crea
            automáticamente en tu agenda.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePropose}
            disabled={submitting || !date || !time}
            className="flex-1 sm:flex-none"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Proponer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
