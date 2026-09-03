import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, ExternalLink, Send, LogIn, MessageCircle } from "lucide-react";
import { SectionHeader } from "./_shared/SectionHeader";
import { useT } from "@/lib/tenantI18n";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateConversation } from "@/hooks/useConversations";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface TenantLocationSectionProps {
  tenantId: string;
  tenantName: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  googleMapsUrl?: string | null;
  primaryColor?: string;
}

const formatMinutesToTime = (minutes: number) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

export const TenantLocationSection = ({
  tenantId,
  tenantName,
  address,
  city,
  postalCode,
  phone,
  email,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  googleMapsUrl,
  primaryColor,
}: TenantLocationSectionProps) => {
  const t = useT();
  const { businessHours, loading: loadingHours, getBusinessHoursForDay } = useTenantBusinessHours(tenantId);
  const fullAddress = [address, city, postalCode].filter(Boolean).join(", ");
  const mapsSearchUrl =
    googleMapsUrl ||
    (fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null);

  const accent = primaryColor || "hsl(var(--primary))";

  // Real-time open status
  const now = new Date();
  const today = getBusinessHoursForDay(now.getDay(), now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const openNow =
    !today.isClosed &&
    ((today.morningEnd > 0 && minutes >= today.morningStart && minutes < today.morningEnd) ||
      (today.afternoonEnd > 0 && minutes >= today.afternoonStart && minutes < today.afternoonEnd));

  const daysShort = t("footer.daysShort").split(",");
  const closedLabel = t("location.closed");

  // Grouped business hours for clean display
  const getGroupedHours = () => {
    if (!businessHours) return [];

    const groups: { days: number[]; hours: string; isClosed: boolean }[] = [];
    const orderedDays = [1, 2, 3, 4, 5, 6, 0];

    orderedDays.forEach((day) => {
      const hours = businessHours[day];
      if (!hours) return;

      let hoursStr: string;
      if (hours.isClosed) {
        hoursStr = closedLabel;
      } else {
        const morning =
          hours.morningStart && hours.morningEnd
            ? `${formatMinutesToTime(hours.morningStart)} - ${formatMinutesToTime(hours.morningEnd)}`
            : null;
        const afternoon =
          hours.afternoonStart && hours.afternoonEnd
            ? `${formatMinutesToTime(hours.afternoonStart)} - ${formatMinutesToTime(hours.afternoonEnd)}`
            : null;

        if (morning && afternoon) {
          hoursStr = `${morning}, ${afternoon}`;
        } else if (morning) {
          hoursStr = morning;
        } else if (afternoon) {
          hoursStr = afternoon;
        } else {
          hoursStr = closedLabel;
        }
      }

      const existingGroup = groups.find((g) => g.hours === hoursStr);
      if (existingGroup) {
        existingGroup.days.push(day);
      } else {
        groups.push({ days: [day], hours: hoursStr, isClosed: hours.isClosed });
      }
    });

    return groups;
  };

  const formatDaysRange = (days: number[]) => {
    if (days.length === 1) {
      return daysShort[days[0] === 0 ? 6 : days[0] - 1];
    }

    const sortedDays = [...days].sort((a, b) => {
      const orderA = a === 0 ? 7 : a;
      const orderB = b === 0 ? 7 : b;
      return orderA - orderB;
    });

    const isConsecutive = sortedDays.every((day, i) => {
      if (i === 0) return true;
      const prevOrder = sortedDays[i - 1] === 0 ? 7 : sortedDays[i - 1];
      const currOrder = day === 0 ? 7 : day;
      return currOrder - prevOrder === 1;
    });

    if (isConsecutive && days.length > 2) {
      const first = sortedDays[0];
      const last = sortedDays[sortedDays.length - 1];
      return `${daysShort[first === 0 ? 6 : first - 1]} - ${daysShort[last === 0 ? 6 : last - 1]}`;
    }

    return days.map((d) => daysShort[d === 0 ? 6 : d - 1]).join(", ");
  };

  const groupedHours = getGroupedHours();

  // Contact form state
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({ title: "Mensaje vacío", description: "Por favor escribe un mensaje antes de enviar.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Inicia sesión", description: "Necesitas iniciar sesión para enviar mensajes.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const conversationId = await getOrCreateConversation(tenantId, user.id);
      if (!conversationId) throw new Error("No se pudo crear la conversación");
      const { error } = await supabase
        .from("direct_messages")
        .insert({ conversation_id: conversationId, sender_id: user.id, sender_type: "user", content: message.trim(), message_type: "text" });
      if (error) throw error;
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString(), unread_count_salon: 1 }).eq("id", conversationId);
      setSent(true);
      setMessage("");
      toast({ title: "¡Mensaje enviado!", description: `Tu mensaje ha sido enviado a ${tenantName}.` });
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "No se pudo enviar el mensaje. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contacto" className="tv-section tv-section--white relative scroll-mt-20">
      {/* Anchor for both #ubicacion and #contacto */}
      <span id="ubicacion" className="absolute -top-24 left-0 pointer-events-none" />

      <div className="container mx-auto px-5 md:px-8 max-w-6xl">
        <SectionHeader
          title={
            <>
              {t("location.titlePre")}<span className="font-editorial-italic">{t("location.titleAccent")}</span>
            </>
          }
          description="Visítanos en nuestro salón, consulta los horarios de apertura o ponte en contacto directo."
          accentColor={primaryColor}
        />

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Details (Hours, Contact info, Direct message) */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Business Hours Card */}
            <div className="rounded-[22px] border border-neutral-200/80 bg-neutral-50/60 p-6 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-200/70">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                  >
                    <Clock className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-editorial text-xl text-neutral-900 leading-tight">
                      {t("location.hours")}
                    </h3>
                    <p className="text-xs text-neutral-500 font-body mt-0.5">
                      Horario de atención al público
                    </p>
                  </div>
                </div>

                {/* Real-time Open/Closed badge */}
                {!loadingHours && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      openNow
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-neutral-100 text-neutral-600 border border-neutral-200/60"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        openNow ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                      }`}
                    />
                    {openNow ? t("trust.openNow") : today.isClosed ? t("trust.closedToday") : t("trust.closedNow")}
                  </span>
                )}
              </div>

              {/* Hours table */}
              <div className="space-y-2.5">
                {loadingHours ? (
                  <p className="text-sm text-neutral-400 font-body py-2">{t("location.loadingHours")}</p>
                ) : groupedHours.length > 0 ? (
                  groupedHours.map((group, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[13.5px] font-body py-1.5 border-b border-neutral-200/40 last:border-b-0"
                    >
                      <span className="font-semibold text-neutral-800">{formatDaysRange(group.days)}</span>
                      <span
                        className={`tabular-nums ${
                          group.isClosed ? "text-neutral-400 font-medium" : "text-neutral-700 font-medium"
                        }`}
                      >
                        {group.hours}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-400 font-body">{t("services.priceOnRequest")}</p>
                )}
              </div>
            </div>

            {/* Address & Contact Details Card */}
            <div className="rounded-[22px] border border-neutral-200/80 bg-white p-6 shadow-sm">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400 font-body mb-4">
                Información de contacto
              </h4>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Address */}
                {fullAddress && (
                  <div className="flex items-start gap-3 sm:col-span-2 pb-4 border-b border-neutral-100">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                    >
                      <MapPin className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-body mb-0.5">
                        {t("location.address")}
                      </p>
                      <p className="text-[14.5px] font-medium text-neutral-900 leading-snug">{fullAddress}</p>
                      {mapsSearchUrl && (
                        <a
                          href={mapsSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:underline"
                          style={{ color: accent }}
                        >
                          {t("location.viewOnMaps")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone */}
                {phone && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                    >
                      <Phone className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-body">
                        Teléfono
                      </p>
                      <a
                        href={`tel:${phone}`}
                        className="text-[14px] font-semibold text-neutral-900 hover:opacity-75 transition-opacity truncate block"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {email && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                    >
                      <Mail className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-body">
                        Email
                      </p>
                      <a
                        href={`mailto:${email}`}
                        className="text-[14px] font-semibold text-neutral-900 hover:opacity-75 transition-opacity truncate block"
                      >
                        {email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Social links row */}
              {(instagramUrl || facebookUrl || tiktokUrl) && (
                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-semibold text-neutral-500 font-body">
                    {t("location.follow")}:
                  </span>
                  <div className="flex gap-2">
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-neutral-200 text-neutral-700 flex items-center justify-center transition-all duration-200 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {facebookUrl && (
                      <a
                        href={facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-neutral-200 text-neutral-700 flex items-center justify-center transition-all duration-200 hover:bg-blue-600 hover:text-white hover:border-transparent"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {tiktokUrl && (
                      <a
                        href={tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-neutral-200 text-neutral-700 flex items-center justify-center transition-all duration-200 hover:bg-black hover:text-white hover:border-transparent"
                        aria-label="TikTok"
                      >
                        <TikTokIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Direct message card */}
            <div className="rounded-[22px] border border-neutral-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-editorial text-lg text-neutral-900 leading-tight">
                    ¿Tienes alguna duda?
                  </h4>
                  <p className="text-xs text-neutral-500 font-body mt-0.5">
                    Envíanos un mensaje y te responderemos lo antes posible
                  </p>
                </div>
              </div>

              {user ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Escribe tu consulta aquí..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[90px] resize-none text-sm border-neutral-200 focus:border-neutral-400 bg-neutral-50/50 rounded-[16px]"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                    className="tv-cta w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm py-3"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : sent ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ¡Mensaje enviado!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-3.5 h-3.5" />
                        Enviar mensaje directo
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="tv-cta w-full text-sm py-3"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Iniciar sesión para enviar mensaje
                </button>
              )}
            </div>

          </div>

          {/* Right Column: Google Maps */}
          <div className="lg:col-span-5 h-full">
            <div className="sticky top-24 rounded-[24px] overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-[0_12px_36px_-16px_rgba(20,22,40,0.14)] h-[460px] lg:h-[680px] relative">
              {mapsSearchUrl ? (
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress || tenantName)}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "460px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Ubicación de ${tenantName}`}
                  className="w-full h-full filter contrast-[1.02]"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                  <MapPin className="h-12 w-12 opacity-30 mb-3" strokeWidth={1.5} />
                  <p className="font-body text-sm">{t("location.comingSoon")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TenantLocationSection;
