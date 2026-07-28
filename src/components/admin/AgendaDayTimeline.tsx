import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, LockOpen, Check, Plus, X } from "lucide-react";

export interface TimelineBooking {
  id: string;
  customer_name: string;
  Hora: string;
  end_time: string | null;
  total_duration: number;
  stylist: string;
  services: any;
  status: string;
  notes: string | null;
  title: string | null;
}

interface AgendaDayTimelineProps {
  bookings: TimelineBooking[];
  stylists: Array<{ slug: string; name: string; color: string }>;
  startHour: number;
  endHour: number;
  isToday: boolean;
  nowMinutes: number;
  onSelect: (booking: TimelineBooking) => void;
  isBlocked: (b: TimelineBooking) => boolean;
  /** Bloqueo de día completo (00:00–23:59): cubre el raíl entero del profesional */
  isFullDayBlocked?: (b: TimelineBooking) => boolean;
  /** Franja de descanso del horario (minutos absolutos), como en desktop */
  breakStart?: number | null;
  breakEnd?: number | null;
  /** Tocar un hueco libre → cita rápida a esa hora con ese profesional */
  onQuickCreate?: (stylistSlug: string, time: string) => void;
  /** Arrastrar una cita → nueva hora y/o profesional (móvil: mantener pulsado) */
  onMove?: (booking: TimelineBooking, stylistSlug: string, newTime: string) => void;
  /** Estirar el borde inferior → nueva duración en minutos */
  onResize?: (booking: TimelineBooking, newDuration: number) => void;
  /** Quitar un bloqueo (día completo o franja de horas) */
  onUnblock?: (booking: TimelineBooking) => void;
}

/** 1 hora = 110px */
const HOUR_PX = 110;
const PPM = HOUR_PX / 60;
/** Cabecera del profesional */
const HEAD_PX = 56;
/** Los arrastres encajan en pasos de 15 min */
const SNAP = 15;
/** Pulsación larga (táctil) antes de levantar la tarjeta */
const LONG_PRESS_MS = 320;

const toMinutes = (hhmm: string): number => {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const hhmm = (t: string | null): string => (t ? t.slice(0, 5) : "");

const fromMinutes = (mins: number): string =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(Math.round(mins) % 60).padStart(2, "0")}`;

const firstServiceName = (services: unknown): string | null => {
  if (!Array.isArray(services) || services.length === 0) return null;
  const s = services[0] as { name?: string } | string;
  if (typeof s === "string") return s;
  return s?.name ?? null;
};

const STATUS_TONE: Record<string, { label: string; short: string; cls: string; dot: string }> = {
  arrived: { label: "Llegada", short: "LLEG", cls: "bg-success-soft text-success", dot: "#16A249" },
  confirmed: { label: "Confirmada", short: "CONF", cls: "bg-info-soft text-info", dot: "#2E7FD4" },
  pending: { label: "Pendiente", short: "PEND", cls: "bg-warning-soft text-warning", dot: "#F59E0B" },
  completed: {
    label: "Completada",
    short: "HECHA",
    cls: "bg-success-soft text-success",
    dot: "#16A249",
  },
};

/** Umbrales de tamaño de tarjeta */
const H_SM = 44; // 1 línea: nombre · servicio
const H_LG = 78; // completa: + hora inicio–fin

/** Sombra iOS: contacto fino + halo difuso */
const IOS_SHADOW = "0 1px 2px rgba(20,22,40,.05), 0 10px 24px -14px rgba(20,22,40,.35)";
/** Citas cortas: sombra mínima para que apiladas no se emborronen */
const SHADOW_SM = "0 1px 2px rgba(20,22,40,.06), 0 1px 0 rgba(20,22,40,.03)";
/** Tarjeta levantada mientras se arrastra */
const SHADOW_DRAG = "0 2px 6px rgba(20,22,40,.10), 0 22px 44px -18px rgba(20,22,40,.55)";

const COMPLETED_BG = "#F1FAF4";
const COMPLETED_COLOR = "#16A249";

type Placed = { b: TimelineBooking; start: number; end: number; col: number; cols: number };

/** Reparte en columnas las citas que se solapan (estilo Google Calendar) */
function layout(items: Array<{ b: TimelineBooking; start: number; end: number }>): Placed[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const cols = cluster.reduce((max, c) => Math.max(max, c.col + 1), 1);
    cluster.forEach((c) => (c.cols = cols));
    placed.push(...cluster);
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.start >= clusterEnd) flush();
    const taken = new Set(cluster.filter((c) => c.end > item.start).map((c) => c.col));
    let col = 0;
    while (taken.has(col)) col++;
    cluster.push({ ...item, col, cols: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length > 0) flush();
  return placed;
}

const isCompleted = (b: TimelineBooking) => !!b.notes?.includes("[✓ COMPLETADA]");

/** Contenido de la tarjeta de cita (compartido por la real y el fantasma de arrastre) */
function CardBody({
  b,
  color,
  height,
  narrow,
  startMin,
  endMin,
}: {
  b: TimelineBooking;
  color: string;
  height: number;
  narrow: boolean;
  startMin: number;
  endMin: number;
}) {
  const service = firstServiceName(b.services) || b.title || "";
  const done = isCompleted(b);
  const tone = done ? STATUS_TONE.completed : STATUS_TONE[b.status] || STATUS_TONE.confirmed;
  const size: "sm" | "md" | "lg" = height < H_SM ? "sm" : height < H_LG ? "md" : "lg";
  const strike = done ? "line-through decoration-[1.5px] decoration-success/70" : "";
  const nameColor = done ? "text-success" : "text-ink-2";

  return (
    <>
      {/* barra de color redondeada (iOS) */}
      <span
        className="my-1 ml-1 w-1 rounded-full flex-none"
        style={{ background: done ? COMPLETED_COLOR : color }}
      />
      <span
        className="relative flex-1 min-w-0 flex flex-col justify-center"
        style={{ padding: size === "sm" ? "0 8px 0 7px" : "7px 9px 7px 8px" }}
      >
        {size === "sm" ? (
          /* Corta: nombre · servicio en una línea + punto de estado */
          <span className="flex items-center gap-1.5 w-full min-w-0">
            <span
              className={`text-[12px] font-semibold truncate flex-none max-w-[55%] ${nameColor} ${strike}`}
            >
              {b.customer_name}
            </span>
            {service && (
              <span className={`text-[11px] text-outline truncate min-w-0 ${strike}`}>
                · {service}
              </span>
            )}
            <span
              className="w-1.5 h-1.5 rounded-full flex-none ml-auto"
              style={{ background: tone.dot }}
            />
          </span>
        ) : (
          <>
            <span className="block min-w-0">
              <span className="flex items-start justify-between gap-1.5">
                <span
                  className={`text-[14px] font-semibold leading-tight truncate tracking-[-0.01em] min-w-0 ${nameColor} ${strike}`}
                >
                  {b.customer_name}
                </span>
                {size === "lg" && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full flex-none whitespace-nowrap ${tone.cls}`}
                  >
                    {done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    {narrow ? tone.short : tone.label}
                  </span>
                )}
              </span>
              {service && (
                <span className={`block text-[12px] text-outline truncate mt-0.5 ${strike}`}>
                  {service}
                </span>
              )}
            </span>
            {size === "lg" ? (
              /* Grande: hora inicio–fin abajo */
              <span
                className={`mt-auto text-[11px] font-medium text-outline tabular-nums ${strike}`}
              >
                {fromMinutes(startMin)} – {fromMinutes(endMin)}
              </span>
            ) : (
              /* Media: solo un punto de estado discreto */
              <span
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                style={{ background: tone.dot }}
              />
            )}
          </>
        )}
      </span>
    </>
  );
}

type DragState = {
  b: TimelineBooking;
  mode: "move" | "resize";
  pointerType: string;
  startX: number;
  startY: number;
  originStart: number;
  originDur: number;
  originStylist: string;
  col: number;
  cols: number;
  /** true cuando el gesto ya cuenta como arrastre (umbral o pulsación larga) */
  active: boolean;
  /** destino que se guardará: encajado a 15 min */
  start: number;
  dur: number;
  stylist: string;
  /** posición libre bajo el dedo/ratón: el holograma va aquí (movimiento suave) */
  rawStart: number;
  rawDur: number;
};

export function AgendaDayTimeline({
  bookings,
  stylists,
  startHour,
  endHour,
  isToday,
  nowMinutes,
  onSelect,
  isBlocked,
  isFullDayBlocked,
  breakStart,
  breakEnd,
  onQuickCreate,
  onMove,
  onResize,
  onUnblock,
}: AgendaDayTimelineProps) {
  const dayStart = startHour * 60;
  const dayEnd = endHour * 60;
  const workMinutes = Math.max(1, dayEnd - dayStart);
  const railHeight = workMinutes * PPM;

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const railRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const longPress = useRef<number | null>(null);
  /** tras un arrastre, ignora el click sintético que dispara el navegador */
  const suppressClick = useRef(false);
  const rafId = useRef<number | null>(null);
  const pendingPoint = useRef<{ x: number; y: number } | null>(null);

  const setDragState = useCallback((d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  }, []);

  const clearLongPress = () => {
    if (longPress.current != null) {
      window.clearTimeout(longPress.current);
      longPress.current = null;
    }
  };

  const beginDrag = useCallback(
    (
      e: React.PointerEvent,
      b: TimelineBooking,
      mode: "move" | "resize",
      meta: { start: number; dur: number; col: number; cols: number },
    ) => {
      if (mode === "move" && !onMove) return;
      if (mode === "resize" && !onResize) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (mode === "resize") e.preventDefault();

      const next: DragState = {
        b,
        mode,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
        originStart: meta.start,
        originDur: meta.dur,
        originStylist: b.stylist,
        col: meta.col,
        cols: meta.cols,
        // resize arranca al instante; mover espera umbral (ratón) o pulsación larga (táctil)
        active: mode === "resize",
        start: meta.start,
        dur: meta.dur,
        stylist: b.stylist,
        rawStart: meta.start,
        rawDur: meta.dur,
      };
      setDragState(next);

      if (mode === "move" && e.pointerType !== "mouse") {
        clearLongPress();
        longPress.current = window.setTimeout(() => {
          const cur = dragRef.current;
          if (!cur || cur.active) return;
          setDragState({ ...cur, active: true });
          navigator.vibrate?.(8);
        }, LONG_PRESS_MS);
      }
    },
    [onMove, onResize, setDragState],
  );

  // Gesto en curso: seguimiento global para no perderlo al salir de la tarjeta
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;

    const finish = (commit: boolean) => {
      clearLongPress();
      const cur = dragRef.current;
      setDragState(null);
      if (!cur || !cur.active) return;
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 250);
      if (!commit) return;
      if (cur.mode === "resize") {
        if (cur.dur !== cur.originDur) onResize?.(cur.b, cur.dur);
      } else if (cur.start !== cur.originStart || cur.stylist !== cur.originStylist) {
        onMove?.(cur.b, cur.stylist, fromMinutes(cur.start));
      }
    };

    // El holograma va en la posición LIBRE (rawStart/rawDur) y la guía punteada
    // en la encajada (start/dur): así el arrastre se siente suave pero se ve
    // exactamente dónde va a caer.
    const apply = (clientX: number, clientY: number) => {
      const cur = dragRef.current;
      if (!cur) return;
      const dx = clientX - cur.startX;
      const dy = clientY - cur.startY;

      let active = cur.active;
      if (!active) {
        if (cur.pointerType !== "mouse") {
          // aún no es pulsación larga: si se mueve, el usuario está haciendo scroll
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            clearLongPress();
            setDragState(null);
          }
          return;
        }
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        active = true;
      }

      if (cur.mode === "resize") {
        const maxDur = dayEnd - cur.originStart;
        const raw = cur.originDur + dy / PPM;
        const rawDur = Math.max(SNAP, Math.min(raw, maxDur));
        const dur = Math.max(SNAP, Math.min(Math.round(raw / SNAP) * SNAP, maxDur));
        setDragState({ ...cur, active, dur, rawDur });
        return;
      }

      const raw = cur.originStart + dy / PPM;
      const maxStart = dayEnd - cur.dur;
      const rawStart = Math.max(dayStart, Math.min(raw, maxStart));
      const start = Math.max(dayStart, Math.min(Math.round(raw / SNAP) * SNAP, maxStart));

      let stylist = cur.stylist;
      for (const s of stylists) {
        const el = railRefs.current[s.slug];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right) {
          stylist = s.slug;
          break;
        }
      }
      setDragState({ ...cur, active, start, rawStart, stylist });
    };

    // Un repintado por frame como mucho: el gesto no va a tirones
    const onPointerMove = (e: PointerEvent) => {
      pendingPoint.current = { x: e.clientX, y: e.clientY };
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const p = pendingPoint.current;
        if (p) apply(p.x, p.y);
      });
    };

    const flushPending = () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
        const p = pendingPoint.current;
        if (p) apply(p.x, p.y);
      }
      pendingPoint.current = null;
    };

    const onUp = () => {
      flushPending();
      finish(true);
    };
    const onCancel = () => {
      flushPending();
      finish(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      pendingPoint.current = null;
    };
  }, [dragging, dayStart, dayEnd, stylists, onMove, onResize, setDragState]);

  // Mientras se arrastra: bloquea el scroll táctil y la selección de texto
  const dragActive = !!drag?.active;
  useEffect(() => {
    if (!dragActive) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", stop, { passive: false });
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = drag?.mode === "resize" ? "ns-resize" : "grabbing";
    return () => {
      document.removeEventListener("touchmove", stop);
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [dragActive, drag?.mode]);

  useEffect(() => () => clearLongPress(), []);

  const hourCells = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  const sections = useMemo(() => {
    return stylists.map((s) => {
      const raw = bookings
        .filter((b) => b.stylist === s.slug)
        .map((b) => {
          const start = toMinutes(b.Hora);
          const end = b.end_time ? toMinutes(b.end_time) : start + (b.total_duration || 30);
          return { b, start, end: Math.max(end, start + 15) };
        });
      // Los bloqueos son fondo (ancho completo, como en desktop): NO entran en el
      // reparto de solapes, así que nunca parten una cita por la mitad.
      const blocks = raw.filter((it) => isBlocked(it.b));
      const items = layout(raw.filter((it) => !isBlocked(it.b)));
      const busy = items.reduce((sum, it) => sum + (it.end - it.start), 0);
      const occupancy = Math.min(100, Math.round((busy / workMinutes) * 100));
      return { stylist: s, blocks, items, realCount: items.length, occupancy, busy };
    });
  }, [bookings, stylists, workMinutes, isBlocked]);

  const summary = useMemo(() => {
    const totalCitas = sections.reduce((n, s) => n + s.realCount, 0);
    const totalBusy = sections.reduce((n, s) => n + s.busy, 0);
    const capacity = workMinutes * Math.max(1, sections.length);
    const libres = Math.max(0, Math.round((capacity - totalBusy) / 30));
    const occ = Math.min(100, Math.round((totalBusy / capacity) * 100));
    return { totalCitas, libres, occ };
  }, [sections, workMinutes]);

  if (stylists.length === 0) return null;

  const showNow = isToday && nowMinutes >= dayStart && nowMinutes <= dayEnd;
  const nowTop = HEAD_PX + (nowMinutes - dayStart) * PPM;

  // Franja de descanso (del horario del negocio)
  const hasBreak =
    breakStart != null && breakEnd != null && breakEnd > breakStart && breakEnd > dayStart;
  const breakTop = hasBreak ? Math.max(0, (breakStart! - dayStart) * PPM) : 0;
  const breakH = hasBreak ? Math.min(railHeight, (breakEnd! - dayStart) * PPM) - breakTop : 0;

  return (
    <div className="font-body">
      <div className="flex items-center justify-center">
        <p className="text-xs font-medium text-outline tracking-wide">
          {summary.totalCitas} {summary.totalCitas === 1 ? "CITA" : "CITAS"} · {summary.libres} LIBRES ·{" "}
          {summary.occ}% OCUPACIÓN
        </p>
      </div>

      <div className="overflow-x-auto no-scrollbar pt-6">
        <div className="flex min-w-max min-[920px]:min-w-0 px-5 gap-6 pb-12 relative">
          {/* Etiquetas de hora, fijas a la izquierda */}
          <div
            className="w-11 flex-shrink-0 sticky left-0 z-30 bg-background/80 backdrop-blur-sm"
            style={{ paddingTop: HEAD_PX }}
          >
            {hourCells.map((h) => (
              <div key={h} className="flex items-start justify-end pr-2" style={{ height: HOUR_PX }}>
                <span className="text-[11px] font-bold text-outline/70 tabular-nums -mt-1.5">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Un raíl por profesional */}
          {sections.map(({ stylist, blocks, items, realCount, occupancy }) => {
            const ghost = drag?.active && drag.stylist === stylist.slug ? drag : null;
            const isDropTarget = !!ghost && drag!.mode === "move" && drag!.originStylist !== stylist.slug;

            return (
            <div key={stylist.slug} className="w-64 flex-shrink-0 min-[920px]:flex-1 min-[920px]:w-auto min-[920px]:min-w-[210px]">
              {/* Cabecera */}
              <div className="mb-4 flex items-center gap-3" style={{ height: HEAD_PX - 16 }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-none"
                  style={{
                    background: stylist.color,
                    boxShadow: `0 0 0 1px #fff, 0 0 0 3px ${stylist.color}33`,
                  }}
                >
                  {stylist.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[15px] text-ink-2 truncate flex items-center gap-1.5">
                    <span className="truncate">{stylist.name}</span>
                    {blocks.length > 0 && (
                      <span
                        title={`${blocks.length} bloqueo${blocks.length > 1 ? "s" : ""}`}
                        className="inline-flex items-center gap-0.5 flex-none rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-outline"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        {blocks.length > 1 ? blocks.length : ""}
                      </span>
                    )}
                  </h4>
                  <div className="flex gap-1 mt-0.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                      style={{ background: `${stylist.color}1a`, color: stylist.color }}
                    >
                      {realCount} {realCount === 1 ? "CITA" : "CITAS"}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-outline px-1.5 py-0.5 rounded whitespace-nowrap">
                      {occupancy}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Raíl */}
              <div
                ref={(el) => {
                  railRefs.current[stylist.slug] = el;
                }}
                className="relative border-x border-line bg-white/30 rounded-xl overflow-hidden transition-colors"
                style={{
                  height: railHeight,
                  boxShadow: isDropTarget ? `inset 0 0 0 2px ${stylist.color}66` : undefined,
                  background: isDropTarget ? `${stylist.color}0d` : undefined,
                }}
              >
                {/* Líneas de hora */}
                <div className="absolute inset-0 pointer-events-none">
                  {hourCells.map((h) => (
                    <div key={h} className="border-b border-line" style={{ height: HOUR_PX }} />
                  ))}
                </div>

                {/* Franja de descanso del horario */}
                {hasBreak && breakH > 0 && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none flex items-center justify-center"
                    style={{ top: breakTop, height: breakH, background: "rgba(245,158,11,.06)" }}
                  >
                    <span className="ag-break-pill">Descanso</span>
                  </div>
                )}

                {/* Capa 0 — huecos tocables cada 30 min → cita rápida.
                    Va debajo de bloqueos (z-[1]) y citas (z-10), así solo recibe
                    el toque lo que está realmente libre. */}
                {onQuickCreate &&
                  Array.from({ length: workMinutes / 30 }, (_, i) => {
                    const mins = dayStart + i * 30;
                    const time = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
                    return (
                      <button
                        key={time}
                        type="button"
                        aria-label={`Nueva cita a las ${time} con ${stylist.name}`}
                        onClick={() => {
                          if (suppressClick.current) return;
                          onQuickCreate(stylist.slug, time);
                        }}
                        className="absolute left-0 right-0 group flex items-center justify-center"
                        style={{
                          top: i * 30 * PPM,
                          height: 30 * PPM,
                          pointerEvents: dragActive ? "none" : undefined,
                        }}
                      >
                        {/* Hueco resaltado: ratón (hover) o toque sostenido (active).
                            CSS puro: sin estado, así mover el ratón no repinta la agenda.
                            Durante un arrastre la capa va con pointer-events:none → sin hover. */}
                        <span className="pointer-events-none absolute inset-x-1 inset-y-[2px] rounded-xl border border-dashed border-primary/45 bg-primary/[0.06] flex items-center justify-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-active:opacity-100">
                          <Plus className="w-3 h-3 text-primary" strokeWidth={2.5} />
                          <span className="text-[11px] font-semibold text-primary tabular-nums">
                            {time}
                          </span>
                        </span>
                      </button>
                    );
                  })}

                {items.length === 0 && blocks.length === 0 && (
                  <p className="absolute left-2 right-2 top-4 text-xs text-outline text-center pointer-events-none">
                    Sin citas · día libre
                  </p>
                )}

                {/* Capa 1 — bloqueos: fondo a ancho completo con pestaña arriba (como desktop) */}
                {blocks.map(({ b, start, end }) => {
                  const fullDay = !!isFullDayBlocked?.(b);
                  const topRaw = fullDay ? 0 : Math.max(0, (start - dayStart) * PPM);
                  const bottomRaw = fullDay
                    ? railHeight
                    : Math.min(railHeight, (end - dayStart) * PPM);
                  if (!fullDay && bottomRaw <= 0) return null;
                  const height = fullDay ? railHeight : Math.max(22, bottomRaw - topRaw);
                  const label = b.title || "Bloqueado";

                  if (fullDay) {
                    return (
                      <div
                        key={b.id}
                        className="absolute z-[1] bg-striped-gray border border-line rounded-xl opacity-90 flex flex-col items-center justify-center gap-2 px-3 text-center overflow-hidden"
                        style={{ left: 0, width: "100%", top: 0, height }}
                      >
                        <Lock className="w-5 h-5 text-outline" />
                        <span className="text-[13px] font-semibold text-outline">{label}</span>
                        <span className="text-[11px] text-outline/70">No hay citas este día</span>
                        {onUnblock && (
                          <button
                            type="button"
                            onClick={() => onUnblock(b)}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-2 shadow-sm active:scale-95 transition-transform min-[920px]:hover:border-primary/40 min-[920px]:hover:text-primary"
                          >
                            <LockOpen className="w-3.5 h-3.5" />
                            Quitar bloqueo
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={b.id}
                      className="absolute z-[1] overflow-hidden rounded-lg border border-line"
                      style={{ left: 0, width: "100%", top: topRaw, height }}
                    >
                      <span className="absolute inset-0 bg-striped-gray opacity-60" />
                      {/* pestaña superior */}
                      <span className="absolute top-1 left-1.5 inline-flex items-center gap-1 rounded-full bg-slate-200 pl-2 pr-1 py-0.5 text-[10px] font-bold text-outline max-w-[calc(100%-12px)]">
                        <Lock className="w-2.5 h-2.5 flex-none" />
                        <span className="truncate">{label}</span>
                        {onUnblock && (
                          <button
                            type="button"
                            aria-label={`Quitar bloqueo de ${fromMinutes(start)} a ${fromMinutes(end)}`}
                            title="Quitar bloqueo"
                            onClick={() => onUnblock(b)}
                            className="flex-none w-4 h-4 -mr-0.5 rounded-full flex items-center justify-center bg-white/70 text-outline active:scale-90 transition-transform min-[920px]:hover:bg-white min-[920px]:hover:text-destructive"
                          >
                            <X className="w-2.5 h-2.5" strokeWidth={3} />
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}

                {/* Capa 2 — citas (estilo iOS): reparto de solapes solo entre ellas */}
                {items.map(({ b, start, end, col, cols }) => {
                  const dragged = drag?.active && drag.b.id === b.id;
                  // Al mover, en su sitio original queda el hueco marcado
                  if (dragged && drag!.mode === "move") {
                    const hTop = Math.max(0, (start - dayStart) * PPM);
                    const hH = Math.max(
                      24,
                      Math.min(railHeight, (end - dayStart) * PPM) - hTop,
                    );
                    return (
                      <div
                        key={b.id}
                        className="absolute z-[5] rounded-2xl border-2 border-dashed flex items-center justify-center pointer-events-none"
                        style={{
                          left: `calc(4px + (100% - 8px) * ${col / cols})`,
                          width: `calc((100% - 8px) / ${cols} - ${cols > 1 ? 3 : 0}px)`,
                          top: hTop,
                          height: hH,
                          borderColor: `${stylist.color}4d`,
                          background: `${stylist.color}0a`,
                        }}
                      >
                        {hH >= 34 && (
                          <span className="text-[10px] font-semibold text-outline/70 tabular-nums">
                            {fromMinutes(start)}
                          </span>
                        )}
                      </div>
                    );
                  }
                  // Al estirar, la tarjeta real se sustituye por el holograma
                  if (dragged) return null;
                  const topRaw = Math.max(0, (start - dayStart) * PPM);
                  const bottomRaw = Math.min(railHeight, (end - dayStart) * PPM);
                  if (bottomRaw <= 0) return null;
                  const top = topRaw;
                  const height = Math.max(24, bottomRaw - topRaw);
                  const done = isCompleted(b);
                  const size: "sm" | "md" | "lg" =
                    height < H_SM ? "sm" : height < H_LG ? "md" : "lg";
                  // reparto horizontal cuando hay solapes entre citas
                  const left = `calc(4px + (100% - 8px) * ${col / cols})`;
                  const width = `calc((100% - 8px) / ${cols} - ${cols > 1 ? 3 : 0}px)`;
                  const narrow = cols > 1;
                  const canDrag = !!onMove;

                  return (
                    <div
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (suppressClick.current) return;
                        onSelect(b);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(b);
                        }
                      }}
                      onPointerDown={(e) =>
                        beginDrag(e, b, "move", { start, dur: end - start, col, cols })
                      }
                      className={`absolute z-10 text-left rounded-2xl flex overflow-hidden active:scale-[.98] transition-transform ease-brand group/card min-[920px]:hover:-translate-y-px min-[920px]:hover:outline min-[920px]:hover:outline-1 min-[920px]:hover:outline-primary/25 ${
                        canDrag ? "cursor-grab active:cursor-grabbing" : ""
                      }`}
                      style={{
                        left,
                        width,
                        top,
                        height,
                        background: done ? COMPLETED_BG : "#fff",
                        boxShadow: size === "sm" ? SHADOW_SM : IOS_SHADOW,
                        opacity: done ? 0.9 : 1,
                      }}
                    >
                      <CardBody
                        b={b}
                        color={stylist.color}
                        height={height}
                        narrow={narrow}
                        startMin={start}
                        endMin={end}
                      />

                      {/* Tirador de duración (borde inferior) */}
                      {onResize && height >= H_SM && (
                        <span
                          role="separator"
                          aria-label={`Cambiar duración de la cita de ${b.customer_name}`}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            beginDrag(e, b, "resize", { start, dur: end - start, col, cols });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-0 left-0 right-0 h-3.5 flex items-end justify-center pb-0.5 cursor-ns-resize opacity-45 min-[920px]:opacity-0 min-[920px]:group-hover/card:opacity-100 transition-opacity"
                          style={{ touchAction: "none" }}
                        >
                          <span className="w-7 h-[3px] rounded-full bg-outline/40" />
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Arrastre: guía de encaje (dónde cae) + holograma (dónde está el dedo) */}
                {ghost &&
                  (() => {
                    const gCols = ghost.mode === "resize" ? ghost.cols : 1;
                    const gCol = ghost.mode === "resize" ? ghost.col : 0;
                    const left = `calc(4px + (100% - 8px) * ${gCol / gCols})`;
                    const width = `calc((100% - 8px) / ${gCols} - ${gCols > 1 ? 3 : 0}px)`;

                    const snapTop = Math.max(0, (ghost.start - dayStart) * PPM);
                    const snapH = Math.max(
                      24,
                      Math.min(ghost.dur, dayEnd - ghost.start) * PPM,
                    );
                    // el holograma va en la posición libre: se mueve 1:1 con el puntero
                    const rawTop =
                      ghost.mode === "resize" ? snapTop : (ghost.rawStart - dayStart) * PPM;
                    const rawH =
                      ghost.mode === "resize" ? Math.max(24, ghost.rawDur * PPM) : snapH;
                    const done = isCompleted(ghost.b);
                    const badgeTop = Math.max(
                      2,
                      Math.min(
                        railHeight - 20,
                        ghost.mode === "resize" ? rawTop + rawH + 2 : rawTop - 21,
                      ),
                    );

                    return (
                      <>
                        {/* Guía punteada en la posición encajada (15 min) */}
                        <div
                          className="absolute z-[15] rounded-2xl border-2 border-dashed pointer-events-none transition-all duration-100 ease-out"
                          style={{
                            left,
                            width,
                            top: snapTop,
                            height: snapH,
                            borderColor: "hsl(var(--primary) / 0.5)",
                            background: "hsl(var(--primary) / 0.06)",
                          }}
                        />
                        {/* Holograma translúcido siguiendo al puntero */}
                        <div
                          className="absolute z-20 rounded-2xl flex overflow-hidden pointer-events-none"
                          style={{
                            left,
                            width,
                            top: 0,
                            height: rawH,
                            transform: `translate3d(0, ${rawTop}px, 0) scale(1.03)`,
                            willChange: "transform",
                            background: done ? "rgba(241,250,244,.82)" : "rgba(255,255,255,.82)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            boxShadow: `${SHADOW_DRAG}, 0 0 0 1.5px hsl(var(--primary) / 0.35)`,
                          }}
                        >
                          <CardBody
                            b={ghost.b}
                            color={stylist.color}
                            height={rawH}
                            narrow={ghost.mode === "resize" && ghost.cols > 1}
                            startMin={ghost.start}
                            endMin={ghost.start + ghost.dur}
                          />
                        </div>
                        {/* Hora en vivo: fuera de la tarjeta para que no la recorte */}
                        <span
                          className="absolute z-30 right-2 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold text-white tabular-nums shadow-fab pointer-events-none whitespace-nowrap"
                          style={{ top: badgeTop }}
                        >
                          {fromMinutes(ghost.start)} – {fromMinutes(ghost.start + ghost.dur)}
                        </span>
                      </>
                    );
                  })()}
              </div>
            </div>
            );
          })}

          {/* Línea AHORA sobre todos los raíles */}
          {showNow && (
            <div className="absolute left-0 right-0 z-50 pointer-events-none" style={{ top: nowTop }}>
              <div className="flex items-center">
                <div className="w-11 h-0.5 bg-gradient-brand" />
                <div
                  className="w-2.5 h-2.5 rounded-full bg-accent -ml-1 border-2 border-white flex-none"
                  style={{ boxShadow: "0 0 8px rgba(152,50,154,0.6)" }}
                />
                <div className="flex-1 h-0.5 bg-gradient-brand opacity-40" />
                <div className="bg-gradient-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-l flex-none">
                  AHORA{" "}
                  {`${String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:${String(nowMinutes % 60).padStart(2, "0")}`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
