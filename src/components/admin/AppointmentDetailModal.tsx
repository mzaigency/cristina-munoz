import React, { useState, useEffect } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import {
  X,
  Clock,
  Phone,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Pencil,
  Wallet,
  Trash2,
  ShieldAlert,
  Globe,
  Scissors,
  Store,
  PhoneCall,
  Lock,
  Calendar,
  Sparkles,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AppointmentDetailBooking {
  id: string;
  customer_name: string;
  Telefono: string;
  Fecha: string;
  Hora: string;
  end_time: string | null;
  stylist: string;
  services: any;
  total_duration: number;
  status: string;
  title: string | null;
  notes: string | null;
  color: string | null;
  tenant_id: string | null;
  recurrence_group_id: string | null;
  recurrence_pattern: any | null;
  skip_availability_check: boolean;
  reminder_sent: string | null;
  canal: string | null;
}

interface StylistOption {
  id?: string;
  slug: string;
  name: string;
  color: string;
}

interface ClientCRMData {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  tags?: string[] | null;
  total_visits?: number | null;
  total_spent?: number | null;
  notes?: string | null;
}

interface AppointmentDetailModalProps {
  booking: AppointmentDetailBooking | null;
  stylists: StylistOption[];
  tenantId: string;
  onClose: () => void;
  onEdit: (booking: AppointmentDetailBooking) => void;
  onMarkCompleted: (booking: AppointmentDetailBooking) => void;
  onQuickCharge: (booking: AppointmentDetailBooking) => void;
  onDelete: (booking: AppointmentDetailBooking) => void;
  onSelectClient?: (clientId: string) => void;
  isBlockedBooking?: (booking: AppointmentDetailBooking) => boolean;
  getStylistColor?: (stylistSlug: string) => string;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  booking,
  stylists,
  tenantId,
  onClose,
  onEdit,
  onMarkCompleted,
  onQuickCharge,
  onDelete,
  onSelectClient,
  isBlockedBooking,
  getStylistColor,
}) => {
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientCRMData | null>(null);
  const [, setLoadingClient] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lookup client in CRM when booking changes
  useEffect(() => {
    if (!booking) {
      setClientData(null);
      return;
    }

    const isBlocked = isBlockedBooking ? isBlockedBooking(booking) : false;
    if (isBlocked) {
      setClientData(null);
      return;
    }

    let isMounted = true;
    const lookupClient = async () => {
      setLoadingClient(true);
      const phone = (booking.Telefono || "").trim();
      const name = (booking.customer_name || "").trim();

      try {
        if (phone) {
          const { data: byPhone } = await supabase
            .from("clients" as any)
            .select("id, name, phone, email, tags, total_visits, total_spent, notes")
            .eq("tenant_id", tenantId)
            .eq("phone", phone)
            .limit(1);

          if (isMounted && byPhone && byPhone.length > 0) {
            setClientData(byPhone[0] as any);
            setLoadingClient(false);
            return;
          }
        }

        if (name) {
          const { data: byName } = await supabase
            .from("clients" as any)
            .select("id, name, phone, email, tags, total_visits, total_spent, notes")
            .eq("tenant_id", tenantId)
            .ilike("name", name)
            .limit(1);

          if (isMounted && byName && byName.length > 0) {
            setClientData(byName[0] as any);
          } else if (isMounted) {
            setClientData(null);
          }
        }
      } catch (err) {
        console.warn("Error looking up client CRM:", err);
      } finally {
        if (isMounted) setLoadingClient(false);
      }
    };

    lookupClient();
    return () => {
      isMounted = false;
    };
  }, [booking?.id, tenantId, isBlockedBooking]);

  if (!booking) return null;

  const isBlocked = isBlockedBooking ? isBlockedBooking(booking) : false;

  const rawNotes = booking.notes || "";
  const isPaid = rawNotes.includes("[💳 COBRADA]") || booking.status === "paid";
  const isCompleted = rawNotes.includes("[✓ COMPLETADA]") || isPaid;
  const cleanNotes = rawNotes
    .replace(/\[✓ COMPLETADA\]\s*/g, "")
    .replace(/\[💳 COBRADA\]\s*/g, "")
    .trim();

  const fallbackColor = "#6366f1";
  const stylistObj = stylists.find((s) => s.slug === booking.stylist);
  const stylistColor = stylistObj?.color || (getStylistColor ? getStylistColor(booking.stylist) : fallbackColor);
  const stylistName = stylistObj?.name || booking.stylist || "Profesional";

  const phone = (booking.Telefono || "").trim();
  const phoneClean = phone.replace(/[^0-9+]/g, "");
  const initial = (booking.customer_name || "?").trim().charAt(0).toUpperCase();

  // Date calculations
  let displayDate = "";
  let isTodayDate = false;
  let isTomorrowDate = false;
  try {
    const dateObj = parseISO(booking.Fecha);
    const rawFormatted = format(dateObj, "EEEE, d 'de' MMMM", { locale: es });
    displayDate = rawFormatted.charAt(0).toUpperCase() + rawFormatted.slice(1);
    isTodayDate = isToday(dateObj);
    isTomorrowDate = isTomorrow(dateObj);
  } catch {
    displayDate = booking.Fecha;
  }

  // Calculate services & total
  const servicesList: any[] = Array.isArray(booking.services) ? booking.services : [];
  const calculatedTotal = servicesList.reduce((acc, s) => {
    const p = Number(s?.price) || 0;
    const q = Number(s?.quantity) || 1;
    return acc + p * q;
  }, 0);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast({
      title: "Teléfono copiado",
      description: `${phone} se ha copiado al portapapeles.`,
    });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Helper for origin channel badge
  const renderCanalBadge = () => {
    if (!booking.canal) return null;
    const c = booking.canal.toLowerCase();
    if (c.includes("web") || c.includes("online")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
          <Globe className="w-3 h-3 text-sky-600" />
          Reserva Web
        </span>
      );
    }
    if (c.includes("tel") || c.includes("llamada")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
          <PhoneCall className="w-3 h-3 text-indigo-600" />
          Teléfono
        </span>
      );
    }
    if (c.includes("manual") || c.includes("mostrador") || c.includes("salon")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Store className="w-3 h-3 text-slate-500" />
          Mostrador
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
        {booking.canal}
      </span>
    );
  };

  return (
    <div className="ag-detail-wrap" onClick={onClose}>
      <div className="ag-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ag-detail-grip" aria-hidden />

        {/* Close Button */}
        <button
          className="ag-detail-close"
          onClick={onClose}
          aria-label="Cerrar modal"
          title="Cerrar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── CASE 1: BLOCKED TIME PERIOD ── */}
        {isBlocked ? (
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Periodo Bloqueado
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {booking.title || "Horario Bloqueado"}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                {displayDate} · {booking.Hora?.slice(0, 5)} {booking.end_time ? `– ${booking.end_time.slice(0, 5)}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: stylistColor }}
              >
                {stylistName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Profesional asignado</span>
                <span className="text-sm font-bold text-slate-800">{stylistName}</span>
              </div>
            </div>

            {cleanNotes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 leading-relaxed font-medium">
                {cleanNotes}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                className="ag-detail-action"
                onClick={() => {
                  onClose();
                  onEdit(booking);
                }}
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
              <button
                className="ag-detail-action danger"
                onClick={() => {
                  onClose();
                  onDelete(booking);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Desbloquear
              </button>
            </div>
          </div>
        ) : (
          /* ── CASE 2: REGULAR APPOINTMENT ── */
          <div className="flex flex-col gap-4">
            {/* Top Status & Tags Row */}
            <div className="flex flex-wrap items-center gap-2 pr-10">
              {/* Primary Appointment Status */}
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Cobrada
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  Completada · Pendiente cobro
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Confirmada
                </span>
              )}

              {/* Origin Canal */}
              {renderCanalBadge()}

              {/* Skip check warning */}
              {booking.skip_availability_check && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  Hueco forzado
                </span>
              )}
            </div>

            {/* Time Hero & Date */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 tabular-nums">
                  {booking.Hora?.slice(0, 5)}
                </span>
                {booking.end_time && (
                  <span className="text-xl sm:text-2xl font-bold text-slate-400 tabular-nums">
                    – {booking.end_time.slice(0, 5)}
                  </span>
                )}
                {booking.total_duration > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ml-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {booking.total_duration} min
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{displayDate}</span>
                {isTodayDate && (
                  <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-300/60">
                    Hoy
                  </span>
                )}
                {isTomorrowDate && (
                  <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-sky-100/70 text-sky-800 border border-sky-300/60">
                    Mañana
                  </span>
                )}
              </div>
            </div>

            {/* Stylist Banner */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                  style={{ background: stylistColor }}
                >
                  {stylistName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    Profesional asignado
                  </span>
                  <span className="text-sm font-bold text-slate-900 leading-tight">
                    {stylistName}
                  </span>
                </div>
              </div>
              <span
                className="w-2.5 h-2.5 rounded-full ring-4 ring-white"
                style={{ background: stylistColor }}
                title={`Color: ${stylistName}`}
              />
            </div>

            {/* ── Client Card with CRM Integration ── */}
            <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${stylistColor}, color-mix(in srgb, ${stylistColor}, #1e293b 35%))`,
                    }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-extrabold text-slate-900 truncate tracking-tight">
                      {booking.customer_name}
                    </h4>
                    {phone && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 tabular-nums">
                        <span>{phone}</span>
                        <button
                          type="button"
                          onClick={handleCopyPhone}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                          title="Copiar teléfono"
                        >
                          {copiedPhone ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Contact Buttons */}
                {phone && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <a
                      href={`tel:${phoneClean}`}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition shadow-sm"
                      title="Llamar al cliente"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/${phoneClean.replace(/^\+/, "")}?text=${encodeURIComponent(
                        `Hola ${booking.customer_name}, te contactamos de Cristina Muñoz referente a tu cita.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white transition shadow-sm"
                      title="Enviar WhatsApp"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* CRM Client Badges & History */}
              {clientData && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {typeof clientData.total_visits === "number" && clientData.total_visits > 1 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        <BadgeCheck className="w-3 h-3 text-slate-500" />
                        {clientData.total_visits} visitas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/60">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Primera visita
                      </span>
                    )}

                    {Array.isArray(clientData.tags) &&
                      clientData.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-200/60"
                        >
                          {t}
                        </span>
                      ))}

                    {typeof clientData.total_spent === "number" && clientData.total_spent > 0 ? (
                      <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                        {clientData.total_spent.toFixed(2)}€ total
                      </span>
                    ) : null}
                  </div>

                  {onSelectClient && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectClient(clientData.id);
                      }}
                      className="inline-flex items-center gap-1 font-bold text-xs text-indigo-600 hover:text-indigo-800 transition ml-auto"
                    >
                      Ver ficha <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Client CRM Internal Note */}
              {clientData?.notes && (
                <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 font-medium leading-relaxed">
                  <span className="font-bold text-amber-950">Nota cliente:</span> {clientData.notes}
                </div>
              )}
            </div>

            {/* ── Services Breakdown ── */}
            <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Scissors className="w-3 h-3" /> Servicios ({servicesList.length})
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {booking.total_duration > 0 ? `${booking.total_duration} min duración` : ""}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {servicesList.length > 0 ? (
                  servicesList.map((svc: any, idx: number) => {
                    const sName = svc.name || svc.title || (typeof svc === "string" ? svc : "Servicio");
                    const sDuration = svc.duration || svc.duration_minutes;
                    const sPrice = Number(svc.price) || 0;
                    return (
                      <div key={idx} className="flex items-center justify-between px-3.5 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{sName}</span>
                          {sDuration && (
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {sDuration} min
                            </span>
                          )}
                        </div>
                        {sPrice > 0 && (
                          <span className="text-sm font-extrabold text-slate-800 tabular-nums">
                            {sPrice.toFixed(2)}€
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3.5 py-3 text-xs text-slate-400 italic">
                    Sin servicios especificados
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="px-3.5 py-3 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {isPaid ? "Importe cobrado" : "Pendiente de cobrar"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900 tabular-nums">
                    {calculatedTotal.toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>

            {/* ── Appointment Notes (if any) ── */}
            {cleanNotes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Notas de la cita
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {cleanNotes}
                </p>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex flex-col gap-2 pt-1">
              {/* Primary Action Button: COBRAR */}
              {!isPaid ? (
                <button
                  type="button"
                  className="w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(135deg, #1e293b, #0f172a)",
                  }}
                  onClick={() => {
                    onClose();
                    onQuickCharge(booking);
                  }}
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Cobrar cita</span>
                  {calculatedTotal > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-white/15 text-xs font-bold tabular-nums ml-1">
                      {calculatedTotal.toFixed(2)}€
                    </span>
                  )}
                </button>
              ) : (
                <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Esta cita ya ha sido cobrada y registrada en caja</span>
                </div>
              )}

              {/* Secondary Actions: Completar, Editar, Eliminar */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className={`ag-detail-action ${isCompleted ? "" : "border-slate-300"}`}
                  onClick={() => {
                    onClose();
                    onMarkCompleted(booking);
                  }}
                  title={isCompleted ? "Desmarcar completada" : "Marcar como realizada"}
                >
                  <Check className={`w-4 h-4 ${isCompleted ? "text-emerald-600" : "text-slate-500"}`} />
                  <span>{isCompleted ? "Desmarcar" : "Completar"}</span>
                </button>

                <button
                  type="button"
                  className="ag-detail-action"
                  onClick={() => {
                    onClose();
                    onEdit(booking);
                  }}
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  className="ag-detail-action danger"
                  onClick={() => {
                    onClose();
                    onDelete(booking);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
