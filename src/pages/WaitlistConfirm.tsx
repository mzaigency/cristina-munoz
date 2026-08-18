import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  LinkIcon,
  MapPin,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

/**
 * Confirmar el hueco de lista de espera desde el email, sin cuenta.
 * El permiso lo da el token del enlace: la edge function `waitlist-token`
 * valida, bloquea el hueco y crea la cita real.
 */

type State =
  | "loading"
  | "ready"
  | "sending"
  | "accepted"
  | "rejected"
  | "expired"
  | "booked"
  | "taken"
  | "unavailable"
  | "error";

interface Proposal {
  customerName: string | null;
  date: string | null;
  time: string | null;
  services: string[];
  expiresAt: string | null;
  tenant: { name: string; slug: string; logoUrl: string | null; address: string | null };
}

const formatDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
};

const WaitlistConfirm = () => {
  const { token = "" } = useParams();
  const [state, setState] = useState<State>("loading");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.functions.invoke("waitlist-token", {
        body: { action: "get", token },
      });
      if (cancelled) return;
      if (error || data?.error) {
        setErrorMsg(data?.error || "No hemos podido abrir este enlace");
        setState("error");
        return;
      }
      setProposal(data as Proposal);
      setState((data?.state as State) ?? "ready");
    };
    if (token) load();
    else {
      setErrorMsg("Enlace no válido");
      setState("error");
    }
    return () => {
      cancelled = true;
    };
  }, [token]);

  const respond = async (action: "accept" | "reject") => {
    setState("sending");
    const { data, error } = await supabase.functions.invoke("waitlist-token", {
      body: { action, token },
    });
    if (error || data?.error) {
      const next = (data?.state as State) ?? "error";
      setErrorMsg(data?.error || "No se ha podido completar");
      setState(["expired", "taken", "booked", "unavailable"].includes(next) ? next : "error");
      return;
    }
    setState(action === "accept" ? "accepted" : "rejected");
  };

  const salon = proposal?.tenant.name ?? "el salón";
  const slug = proposal?.tenant.slug;

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-3xl bg-surface border border-line p-6 sm:p-8">{children}</div>
  );

  const SalonLink = ({ label }: { label: string }) =>
    slug ? (
      <a
        href={`/${slug}`}
        className="inline-flex items-center justify-center h-12 px-6 mt-6 rounded-full bg-gradient-brand text-white text-[15px] font-semibold w-full"
      >
        {label}
      </a>
    ) : null;

  return (
    <>
      <SEO title="Tu hueco en lista de espera" description="Confirma el hueco que se ha liberado" noindex />
      <main
        className="min-h-screen bg-background flex items-start justify-center px-4 font-body"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 32px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 40px)",
        }}
      >
        <div className="w-full max-w-md">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-3 py-24 text-outline">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-[14px]">Abriendo tu hueco…</p>
            </div>
          )}

          {(state === "ready" || state === "sending") && proposal && (
            <Card>
              <div className="text-center">
                {proposal.tenant.logoUrl && (
                  <img
                    src={proposal.tenant.logoUrl}
                    alt={salon}
                    loading="lazy"
                    className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4"
                  />
                )}
                <span className="inline-block text-[12px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-3 py-1">
                  Hueco disponible
                </span>
                <h1 className="text-[22px] font-bold text-ink-2 mt-3">
                  {proposal.customerName ? `${proposal.customerName}, ` : ""}se ha liberado tu hora
                </h1>
                <p className="text-[14px] text-outline mt-2">
                  En <strong className="text-ink-2">{salon}</strong>. Si te va bien, confírmalo y
                  la cita queda hecha.
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-chip p-5 text-center">
                <div className="flex items-center justify-center gap-2 text-outline text-[13px]">
                  <CalendarClock className="w-4 h-4" />
                  <span className="capitalize">{formatDate(proposal.date)}</span>
                </div>
                <p className="text-[34px] font-bold text-ink-2 leading-tight mt-1">{proposal.time}</p>
                {proposal.services.length > 0 && (
                  <p className="text-[14px] text-outline mt-2">{proposal.services.join(", ")}</p>
                )}
                {proposal.tenant.address && (
                  <p className="flex items-center justify-center gap-1.5 text-[13px] text-outline mt-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {proposal.tenant.address}
                  </p>
                )}
              </div>

              {proposal.expiresAt && (
                <p className="flex items-center justify-center gap-1.5 text-[13px] text-outline mt-4">
                  <Clock className="w-3.5 h-3.5" />
                  Guardado para ti hasta las{" "}
                  {new Date(proposal.expiresAt).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              <button
                type="button"
                onClick={() => respond("accept")}
                disabled={state === "sending"}
                className="w-full h-14 mt-5 rounded-full bg-gradient-brand text-white text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {state === "sending" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar mi cita
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => respond("reject")}
                disabled={state === "sending"}
                className="w-full h-12 mt-2 rounded-full text-[15px] font-medium text-outline disabled:opacity-60"
              >
                No me va bien, seguir esperando
              </button>
            </Card>
          )}

          {state === "accepted" && (
            <Card>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-[22px] font-bold text-ink-2">¡Cita confirmada!</h1>
                <p className="text-[14px] text-outline mt-2">
                  Te esperamos en {salon}{" "}
                  <span className="capitalize">{formatDate(proposal?.date ?? null)}</span> a las{" "}
                  {proposal?.time}. Te hemos enviado el detalle por email.
                </p>
                <SalonLink label={`Ver ${salon}`} />
              </div>
            </Card>
          )}

          {state === "rejected" && (
            <Card>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-chip flex items-center justify-center mb-3">
                  <X className="w-6 h-6 text-outline" />
                </div>
                <h1 className="text-[20px] font-bold text-ink-2">Hueco liberado</h1>
                <p className="text-[14px] text-outline mt-2">
                  Sin problema: sigues en la lista de espera de {salon} y te avisamos con el próximo
                  hueco.
                </p>
                <SalonLink label={`Ver ${salon}`} />
              </div>
            </Card>
          )}

          {(state === "expired" || state === "taken" || state === "booked" || state === "unavailable") && (
            <Card>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-chip flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-outline" />
                </div>
                <h1 className="text-[20px] font-bold text-ink-2">
                  {state === "booked"
                    ? "Esta cita ya está confirmada"
                    : state === "taken"
                      ? "El hueco ya está ocupado"
                      : state === "expired"
                        ? "El hueco ha caducado"
                        : "Este hueco ya no está disponible"}
                </h1>
                <p className="text-[14px] text-outline mt-2">
                  {state === "booked"
                    ? "Puedes verla en Mis citas."
                    : "Sigues en la lista de espera y te avisaremos en cuanto se libere otro."}
                </p>
                <SalonLink label={`Reservar en ${salon}`} />
              </div>
            </Card>
          )}

          {state === "error" && (
            <Card>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-chip flex items-center justify-center mb-3">
                  <LinkIcon className="w-6 h-6 text-outline" />
                </div>
                <h1 className="text-[20px] font-bold text-ink-2">{errorMsg}</h1>
                <p className="text-[14px] text-outline mt-2">
                  Si crees que es un fallo, pide al salón que te reenvíe el aviso.
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  );
};

export default WaitlistConfirm;
