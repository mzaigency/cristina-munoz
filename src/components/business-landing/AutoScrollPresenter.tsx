import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SPEED_PX_PER_SEC = 40;

export function AutoScrollPresenter() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "superadmin")
        .maybeSingle();
      if (active && data) setIsSuperAdmin(true);
    })();
    return () => { active = false; };
  }, []);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    setPlaying(false);
  };

  const tick = (ts: number) => {
    if (lastTsRef.current == null) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const next = window.scrollY + SPEED_PX_PER_SEC * dt;
    window.scrollTo(0, next);
    if (next >= maxScroll - 1) {
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    setHidden(true);
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  // Stop on user interaction
  useEffect(() => {
    if (!playing) return;
    const onInteract = (e: Event) => {
      if (e.type === "wheel" || e.type === "touchstart" || e.type === "keydown") {
        stop();
      }
    };
    window.addEventListener("wheel", onInteract, { passive: true });
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("keydown", onInteract);
    return () => {
      window.removeEventListener("wheel", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [playing]);

  useEffect(() => () => stop(), []);

  if (!isSuperAdmin) return null;

  if (playing) {
    return (
      <button
        onClick={stop}
        aria-label="Detener autoscroll"
        className="fixed z-[9999] bottom-6 right-6 h-12 w-12 rounded-full bg-black/70 text-white backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-black/85 transition"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <Pause className="h-5 w-5" />
      </button>
    );
  }

  if (hidden) return null;

  return (
    <button
      onClick={start}
      aria-label="Iniciar autoscroll de presentación"
      className="fixed z-[9999] bottom-6 right-6 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 hover:opacity-90 transition text-sm font-medium"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      <Play className="h-4 w-4" />
      Autoscroll
    </button>
  );
}
