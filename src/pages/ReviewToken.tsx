import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Loader2, CheckCircle2, LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

/**
 * Valoración con enlace de un solo uso (sin cuenta).
 * El permiso lo da el token del ticket, no una sesión: por eso todo pasa por la
 * edge function `review-token`, que valida contra la transacción real.
 */

interface InviteInfo {
  customerName: string | null;
  tenant: { name: string; slug: string; logoUrl: string | null };
}

type Phase = "loading" | "ready" | "sending" | "done" | "error";

const ReviewToken = () => {
  const { token = "" } = useParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [pendingModeration, setPendingModeration] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.functions.invoke("review-token", {
        body: { action: "get", token },
      });
      if (cancelled) return;
      if (error || data?.error) {
        setErrorMsg(data?.error || "No hemos podido abrir este enlace");
        setPhase("error");
        return;
      }
      setInvite(data as InviteInfo);
      setPhase("ready");
    };
    if (token) load();
    else {
      setErrorMsg("Enlace no válido");
      setPhase("error");
    }
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    if (rating === 0) return;
    setPhase("sending");
    const { data, error } = await supabase.functions.invoke("review-token", {
      body: { action: "submit", token, rating, comment: comment.trim() || undefined },
    });
    if (error || data?.error) {
      setErrorMsg(data?.error || "No se pudo enviar la valoración");
      setPhase("error");
      return;
    }
    setPendingModeration(!!data?.pendingModeration);
    setPhase("done");
  };

  const salon = invite?.tenant.name ?? "el salón";

  return (
    <>
      <SEO title="Deja tu valoración" description="Cuéntanos qué tal fue tu visita" noindex />
      <main className="min-h-screen bg-background flex items-start justify-center px-5 py-10 font-body">
        <div className="w-full max-w-md">
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-3 py-24 text-outline">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-[14px]">Abriendo tu valoración…</p>
            </div>
          )}

          {phase === "error" && (
            <div className="rounded-3xl bg-surface border border-line p-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-chip flex items-center justify-center mb-3">
                <LinkIcon className="w-6 h-6 text-outline" />
              </div>
              <h1 className="text-[20px] font-bold text-ink-2">{errorMsg}</h1>
              <p className="text-[14px] text-outline mt-2">
                Si crees que es un fallo, pídele al salón que te reenvíe el ticket.
              </p>
            </div>
          )}

          {phase === "done" && (
            <div className="rounded-3xl bg-surface border border-line p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-[22px] font-bold text-ink-2">¡Gracias!</h1>
              <p className="text-[14px] text-outline mt-2">
                {pendingModeration
                  ? "Tu valoración se revisará antes de publicarse."
                  : `Tu valoración ya está en el perfil de ${salon}.`}
              </p>
              {invite?.tenant.slug && (
                <a
                  href={`/${invite.tenant.slug}`}
                  className="inline-flex items-center justify-center h-11 px-5 mt-5 rounded-full bg-gradient-brand text-white text-[15px] font-semibold"
                >
                  Ver {salon}
                </a>
              )}
            </div>
          )}

          {(phase === "ready" || phase === "sending") && invite && (
            <div className="rounded-3xl bg-surface border border-line p-6">
              <div className="text-center">
                {invite.tenant.logoUrl ? (
                  <img
                    src={invite.tenant.logoUrl}
                    alt={salon}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-brand text-white flex items-center justify-center mx-auto mb-3 text-[24px] font-bold">
                    {salon.charAt(0).toUpperCase()}
                  </div>
                )}
                <h1 className="text-[22px] font-bold text-ink-2 tracking-[-0.01em]">
                  {invite.customerName ? `${invite.customerName}, ¿qué tal fue?` : "¿Qué tal fue?"}
                </h1>
                <p className="text-[14px] text-outline mt-1">
                  Tu opinión ayuda a {salon} y a quien busca sitio
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 my-6">
                {[1, 2, 3, 4, 5].map((star) => {
                  const on = star <= (hovered || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="p-1 active:scale-90 transition-transform"
                    >
                      <Star
                        className={`w-9 h-9 ${on ? "text-warning" : "text-outline/30"}`}
                        fill={on ? "currentColor" : "none"}
                      />
                    </button>
                  );
                })}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="¿Qué te llevaste? (opcional)"
                className="w-full rounded-2xl bg-chip px-4 py-3 text-[15px] outline-none text-ink-2 placeholder:text-outline/70 resize-none"
              />

              <button
                onClick={submit}
                disabled={rating === 0 || phase === "sending"}
                className="w-full h-12 mt-4 rounded-full bg-gradient-brand text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[.99] transition-transform"
              >
                {phase === "sending" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Enviar valoración"
                )}
              </button>
              {rating === 0 && (
                <p className="text-center text-[12px] text-outline mt-2">
                  Toca las estrellas para puntuar
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ReviewToken;
