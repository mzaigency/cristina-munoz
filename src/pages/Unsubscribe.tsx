import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"loading" | "confirm" | "done" | "already" | "invalid" | "error">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_KEY },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) { setState(json?.status === "already_unsubscribed" ? "already" : "invalid"); return; }
        setEmail(json?.email ?? null);
        setState(json?.status === "already_unsubscribed" ? "already" : "confirm");
      } catch { setState("error"); }
    })();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setSubmitting(false);
    setState(error ? "error" : "done");
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f7f8fb", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", border: "1px solid #eceef3", borderRadius: 16, padding: 32, boxShadow: "0 4px 20px -8px rgba(34,64,139,0.08)" }}>
        <div style={{ display: "inline-block", background: "linear-gradient(100deg,#22408B,#98329A)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 999, marginBottom: 16 }}>Glowapp</div>

        {state === "loading" && <p>Comprobando…</p>}

        {state === "invalid" && (
          <>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>Enlace no válido</h1>
            <p style={{ color: "#676B7E" }}>Este enlace ha caducado o no es correcto. Puedes gestionar tus preferencias desde tu cuenta.</p>
          </>
        )}

        {state === "already" && (
          <>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>Ya estás dado de baja</h1>
            <p style={{ color: "#676B7E" }}>{email ?? "Tu dirección"} ya no recibe emails automáticos de Glowapp.</p>
          </>
        )}

        {state === "confirm" && (
          <>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>¿Darte de baja?</h1>
            <p style={{ color: "#676B7E", marginBottom: 20 }}>
              Dejarás de recibir emails de Glowapp{email ? ` en ${email}` : ""}. Podrás seguir usando la app y recibirás notificaciones push si las tienes activadas.
            </p>
            <button
              onClick={confirm}
              disabled={submitting}
              style={{ background: "linear-gradient(100deg,#22408B,#98329A)", color: "#fff", border: 0, borderRadius: 12, padding: "12px 24px", fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Procesando…" : "Confirmar baja"}
            </button>
          </>
        )}

        {state === "done" && (
          <>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>Listo ✅</h1>
            <p style={{ color: "#676B7E" }}>Te hemos dado de baja. No recibirás más emails de este tipo.</p>
          </>
        )}

        {state === "error" && (
          <>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>Algo ha fallado</h1>
            <p style={{ color: "#676B7E" }}>Inténtalo de nuevo en unos minutos.</p>
          </>
        )}
      </div>
    </div>
  );
}
