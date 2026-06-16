import { useEffect, useRef, useState } from "react";
import { Play, Pause, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SPEEDS = [200, 300, 400] as const;
type Speed = typeof SPEEDS[number];
const STORAGE_KEY = "autoscroll_speed_v1";

export function AutoScrollPresenter() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(() => {
    if (typeof window === "undefined") return 40;
    const s = Number(localStorage.getItem(STORAGE_KEY));
    return (SPEEDS as readonly number[]).includes(s) ? (s as Speed) : 40;
  });
  const speedRef = useRef(speed);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => { speedRef.current = speed; localStorage.setItem(STORAGE_KEY, String(speed)); }, [speed]);

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
    const next = Math.min(window.scrollY + speedRef.current * dt, maxScroll);
    window.scrollTo(0, next);
    if (next >= maxScroll - 1) { stop(); return; }
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (playing) return;
    setPlaying(true);
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  if (!isSuperAdmin) return null;

  return (
    <div
      className="fixed z-[9999] right-4 flex flex-col items-end gap-2"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      {/* Speed selector */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg text-xs">
        <Gauge className="h-3.5 w-3.5 opacity-70" />
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded-full transition ${
              speed === s ? "bg-white text-black font-semibold" : "text-white/80 hover:text-white"
            }`}
            aria-label={`Velocidad ${s} px/s`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Play/Pause */}
      <button
        onClick={playing ? stop : start}
        aria-label={playing ? "Pausar autoscroll" : "Iniciar autoscroll"}
        className="h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 hover:opacity-90 transition text-sm font-medium"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {playing ? "Pausar" : "Autoscroll"}
      </button>
    </div>
  );
}
