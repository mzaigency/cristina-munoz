import { useEffect, useMemo, useRef } from "react";
import { Lock, LockOpen, Plus, X } from "lucide-react";
import { NO_SELECT, useTimelineDrag } from "@/hooks/useTimelineDrag";
import type { TimelineBooking } from "./AgendaDayTimeline";

export interface WeekBooking extends TimelineBooking {
  Fecha: string;
}

export interface WeekDay {
  /** yyyy-MM-dd */
  key: string;
  /** LUN, MAR… */
  label: string;
  dayNum: string;
  isToday: boolean;
  closed: boolean;
  /** horario del día en minutos absolutos */
  startMin: number;
  endMin: number;
  breakStart: number | null;
  breakEnd: number | null;
}

interface AgendaWeekBoardProps {
  bookings: WeekBooking[];
  days: WeekDay[];
  /** profesionales en orden; se usa para el color y para partir en calles */
  stylists: Array<{ slug: string; name: string; color: string }>;
  /** con el filtro en "Todas": una calle por profesional dentro de cada día */
  splitByStylist?: boolean;
  /** rango común de la semana */
  startHour: number;
  endHour: number;
  nowMinutes: number;
  onSelect: (booking: WeekBooking) => void;
  isBlocked: (b: WeekBooking) => boolean;
  isFullDayBlocked?: (b: WeekBooking) => boolean;
  /** Tocar un hueco libre → cita rápida ese día a esa hora */
  onQuickCreate?: (dateKey: string, time: string, stylistSlug?: string) => void;
  /** Arrastrar una cita → otro día, hora y (si hay calles) profesional */
  onMove?: (
    booking: WeekBooking,
    dateKey: string,
    newTime: string,
    stylistSlug?: string,
  ) => void;
  /** Estirar el borde inferior → nueva duración en minutos */
  onResize?: (booking: WeekBooking, newDuration: number) => void;
  /** Quitar un bloqueo */
  onUnblock?: (booking: WeekBooking) => void;
}

/** 1 hora = 56px: más denso que la vista de día, aún legible */
const HOUR_PX = 56;
const PPM = HOUR_PX / 60;
/** Cabecera del día */
const HEAD_PX = 52;
/** A partir de aquí la tarjeta enseña también la hora */
const H_TIME = 34;
/** Ancho de una calle en móvil (una por día, o una por profesional si se parte) */
const LANE_W = 118;
const LANE_W_SPLIT = 96;

const toMinutes = (hhmm: string): number => {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const fromMinutes = (mins: number): string =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(Math.round(mins) % 60).padStart(2, "0")}`;

const STATUS_DOT: Record<string, string> = {
  arrived: "#16A249",
  confirmed: "#2E7FD4",
  pending: "#F59E0B",
};

const COMPLETED_BG = "#F1FAF4";
const COMPLETED_COLOR = "#16A249";
const CARD_SHADOW = "0 1px 2px rgba(20,22,40,.05), 0 6px 16px -12px rgba(20,22,40,.3)";
const SHADOW_DRAG = "0 2px 6px rgba(20,22,40,.10), 0 22px 44px -18px rgba(20,22,40,.55)";
const STRIPES = "repeating-linear-gradient(45deg,#F4F5F9,#F4F5F9 6px,#fff 6px,#fff 12px)";

const isCompleted = (b: WeekBooking) => !!b.notes?.includes("[✓ COMPLETADA]");

type Placed = { b: WeekBooking; start: number; end: number; col: number; cols: number };

/** Reparte en columnas las citas que se solapan (estilo Google Calendar) */
function layout(items: Array<{ b: WeekBooking; start: number; end: number }>): Placed[] {
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

/** Contenido de la tarjeta (compartido por la real y el holograma) */
function CardBody({
  b,
  color,
  height,
  startMin,
}: {
  b: WeekBooking;
  color: string;
  height: number;
  startMin: number;
}) {
  const done = isCompleted(b);
  const strike = done ? "line-through decoration-[1.5px] decoration-success/70" : "";

  return (
    <>
      <span
        className="my-0.5 ml-0.5 w-1.5 rounded-full flex-none"
        style={{ background: done ? COMPLETED_COLOR : color }}
      />
      <span
        className="relative flex-1 min-w-0 flex flex-col justify-center gap-px"
        style={{ padding: height < 26 ? "0 4px 0 5px" : "2px 5px 2px 5px" }}
      >
        <span
          className={`block text-[11px] font-semibold truncate leading-tight tracking-[-0.01em] ${
            done ? "text-success" : "text-ink-2"
          } ${strike}`}
        >
          {b.customer_name}
        </span>
        {height >= H_TIME && (
          <span className={`block text-[11px] text-outline tabular-nums leading-none ${strike}`}>
            {fromMinutes(startMin)}
          </span>
        )}
        {height < H_TIME && (
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: done ? COMPLETED_COLOR : STATUS_DOT[b.status] || "#2E7FD4" }}
          />
        )}
      </span>
    </>
  );
}

export function AgendaWeekBoard({
  bookings,
  days,
  stylists,
  splitByStylist = false,
  startHour,
  endHour,
  nowMinutes,
  onSelect,
  isBlocked,
  isFullDayBlocked,
  onQuickCreate,
  onMove,
  onResize,
  onUnblock,
}: AgendaWeekBoardProps) {
  const dayStart = startHour * 60;
  const dayEnd = endHour * 60;
  const workMinutes = Math.max(1, dayEnd - dayStart);
  const railHeight = workMinutes * PPM;

  const railRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);

  const stylistColors = useMemo(() => {
    const map: Record<string, string> = {};
    stylists.forEach((s) => (map[s.slug] = s.color));
    return map;
  }, [stylists]);

  /** calles de cada día: una sola, o una por profesional si se parte */
  const laneStylists = splitByStylist && stylists.length > 1 ? stylists : [];
  const laneCount = Math.max(1, laneStylists.length);
  /** alto de la etiqueta de profesional sobre cada calle */
  const LANE_HEAD = laneStylists.length > 0 ? 20 : 0;

  const columnIds = useMemo(
    () =>
      days
        .filter((d) => !d.closed)
        .flatMap((d) =>
          laneStylists.length > 0
            ? laneStylists.map((s) => `${d.key}|${s.slug}`)
            : [d.key],
        ),
    [days, laneStylists],
  );

  const { drag, dragActive, beginDrag, suppressClick } = useTimelineDrag<WeekBooking>({
    dayStart,
    dayEnd,
    ppm: PPM,
    columnIds,
    railRefs,
    onMove: onMove
      ? (b, id, startMin) => {
          const [dateKey, slug] = id.split("|");
          onMove(b, dateKey, fromMinutes(startMin), slug);
        }
      : undefined,
    onResize,
  });

  const hourCells = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  // En móvil la semana no cabe: al abrir, deja hoy a la vista
  const todayKey = days.find((d) => d.isToday)?.key;
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !todayKey) return;
    // con calles, el raíl está indexado como `fecha|profesional`
    const rail =
      railRefs.current[todayKey] ||
      (laneStylists.length > 0 ? railRefs.current[`${todayKey}|${laneStylists[0].slug}`] : null);
    if (!rail) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    const railRect = rail.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const left =
      scroller.scrollLeft +
      (railRect.left - scrollerRect.left) -
      scroller.clientWidth / 2 +
      railRect.width / 2;
    scroller.scrollTo({ left: Math.max(0, left) });
  }, [todayKey, laneStylists.length]);

  const sections = useMemo(() => {
    return days.map((day) => {
      const raw = bookings
        .filter((b) => b.Fecha === day.key)
        .map((b) => {
          const start = toMinutes(b.Hora);
          const end = b.end_time ? toMinutes(b.end_time) : start + (b.total_duration || 30);
          return { b, start, end: Math.max(end, start + 15) };
        });

      // Solo el bloqueo de DÍA COMPLETO va de fondo; los de horas concretas
      // entran en el reparto y comparten el hueco con las citas.
      const isFull = (b: WeekBooking) => isBlocked(b) && !!isFullDayBlocked?.(b);
      const build = (rows: typeof raw) => ({
        fullBlocks: rows.filter((it) => isFull(it.b)),
        items: layout(rows.filter((it) => !isFull(it.b))),
      });

      const lanes =
        laneStylists.length > 0
          ? laneStylists.map((st) => ({
              id: `${day.key}|${st.slug}`,
              stylist: st,
              ...build(raw.filter((it) => it.b.stylist === st.slug)),
            }))
          : [{ id: day.key, stylist: null, ...build(raw) }];

      const count = lanes.reduce((n, l) => n + l.items.filter((it) => !isBlocked(it.b)).length, 0);
      return { day, lanes, count };
    });
  }, [bookings, days, isBlocked, isFullDayBlocked, laneStylists]);

  const summary = useMemo(() => {
    const open = sections.filter((s) => !s.day.closed);
    const total = open.reduce((n, s) => n + s.count, 0);
    const busy = open.reduce(
      (n, s) =>
        n +
        s.lanes.reduce(
          (m, l) =>
            m +
            l.items
              .filter((it) => !isBlocked(it.b))
              .reduce((k, it) => k + (it.end - it.start), 0),
          0,
        ),
      0,
    );
    const capacity = Math.max(
      1,
      open.reduce((n, s) => n + Math.max(0, s.day.endMin - s.day.startMin) * laneCount, 0),
    );
    return { total, occ: Math.min(100, Math.round((busy / capacity) * 100)) };
  }, [sections, isBlocked, laneCount]);

  if (days.length === 0) return null;

  return (
    <div className="font-body">
      <p className="text-xs font-medium text-outline tracking-wide text-center">
        {summary.total} {summary.total === 1 ? "CITA" : "CITAS"} · {summary.occ}% OCUPACIÓN
      </p>

      <div ref={scrollerRef} className="overflow-x-auto no-scrollbar pt-4">
        {/* select-none: mantener pulsado levanta la cita, nunca selecciona texto */}
        <div
          className="flex min-w-max min-[920px]:min-w-0 px-3 gap-1.5 pb-10 relative select-none"
          style={NO_SELECT}
        >
          {/* Raíl de horas, fijo a la izquierda */}
          <div
            className="w-9 flex-shrink-0 sticky left-0 z-30 bg-background/80 backdrop-blur-sm"
            style={{ paddingTop: HEAD_PX + LANE_HEAD }}
          >
            {hourCells.map((h) => (
              <div key={h} className="flex items-start justify-end pr-1.5" style={{ height: HOUR_PX }}>
                <span className="text-[11px] font-bold text-outline/70 tabular-nums -mt-1.5">
                  {String(h).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {sections.map(({ day, lanes, count }) => {
            // franjas fuera del horario del día (la semana usa un rango común)
            const preH = Math.max(0, (day.startMin - dayStart) * PPM);
            const postTop = Math.max(0, (day.endMin - dayStart) * PPM);
            const postH = Math.max(0, railHeight - postTop);
            const hasBreak =
              day.breakStart != null && day.breakEnd != null && day.breakEnd > day.breakStart;

            return (
              <div
                key={day.key}
                className={
                  laneCount > 1
                    ? "flex-shrink-0"
                    : "w-[118px] flex-shrink-0 min-[920px]:flex-1 min-[920px]:w-auto min-[920px]:min-w-0"
                }
                style={laneCount > 1 ? { width: laneCount * LANE_W_SPLIT } : undefined}
              >
                {/* Cabecera del día */}
                <div
                  className="flex flex-col items-center justify-center gap-0.5 rounded-t-xl"
                  style={{
                    height: HEAD_PX,
                    background: day.isToday
                      ? "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))"
                      : undefined,
                    color: day.isToday ? "#fff" : undefined,
                  }}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[.06em] ${
                      day.isToday ? "opacity-80" : "text-outline"
                    }`}
                  >
                    {day.label}
                  </span>
                  <span
                    className={`text-[17px] font-bold leading-none ${
                      day.isToday ? "" : day.closed ? "text-outline/60" : "text-ink-2"
                    }`}
                  >
                    {day.dayNum}
                  </span>
                  {day.closed ? (
                    <Lock className="w-2.5 h-2.5 text-outline/60" />
                  ) : (
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${
                        day.isToday ? "opacity-85" : "text-outline"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>

                {/* Una calle por profesional cuando el filtro está en "Todas" */}
                <div className="flex">
                  {lanes.map((lane, li) => {
                    const ghost = drag?.active && drag.colId === lane.id ? drag : null;
                    const isDropTarget =
                      !!ghost && drag!.mode === "move" && drag!.originColId !== lane.id;
                    const first = li === 0;
                    const last = li === lanes.length - 1;

                    return (
                      <div key={lane.id} className="flex-1 min-w-0">
                        {lane.stylist && (
                          <div
                            className={`flex items-center justify-center gap-1 px-1 border-b border-line ${
                              first ? "border-l" : "border-l border-outline/25"
                            } ${last ? "border-r" : ""}`}
                            style={{ height: LANE_HEAD }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-none"
                              style={{ background: lane.stylist.color }}
                            />
                            <span className="text-[10px] font-semibold text-outline truncate">
                              {lane.stylist.name.split(" ")[0]}
                            </span>
                          </div>
                        )}

                        <div
                          ref={(el) => {
                            railRefs.current[lane.id] = el;
                          }}
                          className={`relative overflow-hidden transition-colors border-line ${
                            first ? "border-l rounded-bl-xl" : "border-l border-outline/25"
                          } ${last ? "border-r rounded-br-xl" : ""}`}
                          style={{
                            height: railHeight,
                            background: isDropTarget
                              ? "hsl(var(--primary) / 0.05)"
                              : day.isToday
                                ? "hsl(var(--primary) / 0.03)"
                                : "rgba(255,255,255,.3)",
                            boxShadow: isDropTarget
                              ? "inset 0 0 0 2px hsl(var(--primary) / 0.4)"
                              : undefined,
                          }}
                        >
                          {/* Líneas de hora */}
                          <div className="absolute inset-0 pointer-events-none">
                            {hourCells.map((h) => (
                              <div key={h} className="border-b border-line" style={{ height: HOUR_PX }} />
                            ))}
                          </div>

                          {day.closed ? (
                            <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ background: STRIPES }}
                            >
                              {first && (
                                <span className="text-[11px] font-semibold text-outline/70">
                                  Cerrado
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              {/* Fuera del horario de ese día */}
                              {preH > 0 && (
                                <div
                                  className="absolute left-0 right-0 pointer-events-none bg-surface-container-low/70"
                                  style={{ top: 0, height: preH }}
                                />
                              )}
                              {postH > 0 && (
                                <div
                                  className="absolute left-0 right-0 pointer-events-none bg-surface-container-low/70"
                                  style={{ top: postTop, height: postH }}
                                />
                              )}

                              {/* Descanso */}
                              {hasBreak && (
                                <div
                                  className="absolute left-0 right-0 pointer-events-none"
                                  style={{
                                    top: Math.max(0, (day.breakStart! - dayStart) * PPM),
                                    height: Math.max(0, (day.breakEnd! - day.breakStart!) * PPM),
                                    background: "rgba(245,158,11,.06)",
                                  }}
                                />
                              )}

                              {/* Huecos tocables cada 30 min → cita rápida */}
                              {onQuickCreate &&
                                Array.from({ length: Math.floor(workMinutes / 30) }, (_, i) => {
                                  const mins = dayStart + i * 30;
                                  if (mins < day.startMin || mins >= day.endMin) return null;
                                  const time = fromMinutes(mins);
                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      aria-label={`Nueva cita el ${day.key} a las ${time}`}
                                      onClick={() => {
                                        if (suppressClick.current) return;
                                        onQuickCreate(day.key, time, lane.stylist?.slug);
                                      }}
                                      className="absolute left-0 right-0 group flex items-center justify-center"
                                      style={{
                                        top: i * 30 * PPM,
                                        height: 30 * PPM,
                                        pointerEvents: dragActive ? "none" : undefined,
                                      }}
                                    >
                                      <span className="pointer-events-none absolute inset-x-0.5 inset-y-[1px] rounded-lg border border-dashed border-primary/45 bg-primary/[0.06] flex items-center justify-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-active:opacity-100">
                                        <Plus className="w-2.5 h-2.5 text-primary" strokeWidth={2.5} />
                                        <span className="text-[11px] font-semibold text-primary tabular-nums">
                                          {time}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}

                              {/* Bloqueo de DÍA COMPLETO: fondo de la calle entera */}
                              {lane.fullBlocks.map(({ b }) => {
                                const label = b.title || "Bloqueado";
                                return (
                                  <div
                                    key={b.id}
                                    className="absolute left-0 right-0 z-[1] overflow-hidden rounded-lg border border-line pointer-events-none"
                                     style={{ top: 0, height: railHeight, background: STRIPES }}
                                   >
                                     <span className="pointer-events-auto absolute top-0.5 left-1 inline-flex items-center gap-0.5 rounded-full bg-slate-200 pl-1.5 pr-0.5 py-0.5 text-[10px] font-bold text-outline max-w-[calc(100%-8px)]">
                                      <Lock className="w-2 h-2 flex-none" />
                                      <span className="truncate">{label}</span>
                                      {onUnblock && (
                                        <button
                                          type="button"
                                          aria-label={`Quitar bloqueo del ${day.key}`}
                                          title="Quitar bloqueo"
                                          onClick={() => onUnblock(b)}
                                          className="flex-none w-3.5 h-3.5 rounded-full flex items-center justify-center bg-white/70 text-outline active:scale-90 transition-transform min-[920px]:hover:bg-white min-[920px]:hover:text-destructive"
                                        >
                                          <X className="w-2 h-2" strokeWidth={3} />
                                        </button>
                                      )}
                                    </span>
                                    {railHeight > 90 && onUnblock && (
                                      <button
                                        type="button"
                                        onClick={() => onUnblock(b)}
                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-white border border-line px-2 py-1 text-[11px] font-semibold text-ink-2 shadow-sm active:scale-95 transition-transform min-[920px]:hover:border-primary/40 min-[920px]:hover:text-primary"
                                      >
                                        <LockOpen className="w-3 h-3" />
                                        Quitar
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Citas */}
                              {lane.items.map(({ b, start, end, col, cols }) => {
                                const dragged = drag?.active && drag.b.id === b.id;
                                const top = Math.max(0, (start - dayStart) * PPM);
                                const bottom = Math.min(railHeight, (end - dayStart) * PPM);
                                if (bottom <= 0) return null;
                                const height = Math.max(18, bottom - top);
                                const left = `calc(2px + (100% - 4px) * ${col / cols})`;
                                const width = `calc((100% - 4px) / ${cols} - ${cols > 1 ? 2 : 0}px)`;

                                // Al mover, en su sitio original queda el hueco marcado
                                if (dragged && drag!.mode === "move") {
                                  return (
                                    <div
                                      key={b.id}
                                      className="absolute z-[5] rounded-lg border-2 border-dashed pointer-events-none"
                                      style={{
                                        left,
                                        width,
                                        top,
                                        height,
                                        borderColor: "hsl(var(--primary) / 0.35)",
                                        background: "hsl(var(--primary) / 0.05)",
                                      }}
                                    />
                                  );
                                }
                                if (dragged) return null;

                                // ── Bloqueo de horas: ocupa su hueco como una cita más
                                if (isBlocked(b)) {
                                  return (
                                    <div
                                      key={b.id}
                                      className="absolute z-[6] overflow-hidden rounded-lg border border-line"
                                      style={{ left, width, top, height, background: STRIPES }}
                                    >
                                      {onMove && (
                                        <span
                                          role="separator"
                                          aria-label={`Mover el bloqueo de ${fromMinutes(start)} a ${fromMinutes(end)}`}
                                          onPointerDown={(e) => {
                                            e.stopPropagation();
                                            beginDrag(e, b, "move", {
                                              start,
                                              dur: end - start,
                                              col,
                                              cols,
                                              colId: lane.id,
                                            });
                                          }}
                                          className="absolute left-0 top-0 bottom-0 w-3.5 flex items-center justify-center z-[2] cursor-grab active:cursor-grabbing"
                                          style={{ touchAction: "none", ...NO_SELECT }}
                                        >
                                          <span
                                            className="flex flex-col gap-[2px] rounded-full bg-white px-[2px] py-0.5"
                                            style={{ boxShadow: "0 0 0 1px rgba(20,22,40,.06)" }}
                                          >
                                            {[0, 1, 2].map((i) => (
                                              <span
                                                key={i}
                                                className="w-[3px] h-[3px] rounded-full bg-outline/70"
                                              />
                                            ))}
                                          </span>
                                        </span>
                                      )}

                                      <span
                                        className="absolute top-0.5 inline-flex items-center gap-0.5 rounded-full bg-slate-200 pl-1.5 pr-0.5 py-0.5 text-[10px] font-bold text-outline"
                                        style={{
                                          left: onMove ? 15 : 4,
                                          maxWidth: `calc(100% - ${onMove ? 19 : 8}px)`,
                                        }}
                                      >
                                        <Lock className="w-2 h-2 flex-none" />
                                        <span className="truncate tabular-nums">
                                          {fromMinutes(start)}
                                        </span>
                                        {onUnblock && (
                                          <button
                                            type="button"
                                            aria-label="Quitar bloqueo"
                                            title="Quitar bloqueo"
                                            onClick={() => onUnblock(b)}
                                            className="flex-none w-3.5 h-3.5 rounded-full flex items-center justify-center bg-white/70 text-outline active:scale-90 transition-transform min-[920px]:hover:bg-white min-[920px]:hover:text-destructive"
                                          >
                                            <X className="w-2 h-2" strokeWidth={3} />
                                          </button>
                                        )}
                                      </span>

                                      {height >= 40 && cols === 1 && (
                                        <span
                                          className="absolute left-0 right-0 text-center text-[10px] font-bold text-outline/80 tabular-nums"
                                          style={{ top: 20 }}
                                        >
                                          {fromMinutes(start)} – {fromMinutes(end)}
                                        </span>
                                      )}

                                      {onResize && (
                                        <span
                                          role="separator"
                                          aria-label="Cambiar las horas bloqueadas"
                                          onPointerDown={(e) => {
                                            e.stopPropagation();
                                            beginDrag(e, b, "resize", {
                                              start,
                                              dur: end - start,
                                              col,
                                              cols,
                                              colId: lane.id,
                                            });
                                          }}
                                          className="absolute bottom-0 left-0 right-0 h-2.5 flex items-end justify-center z-[2] cursor-ns-resize"
                                          style={{ touchAction: "none", ...NO_SELECT }}
                                        >
                                          <span className="h-[3px] w-4 rounded-full bg-outline/45" />
                                        </span>
                                      )}
                                    </div>
                                  );
                                }

                                const done = isCompleted(b);
                                const color = stylistColors[b.stylist] || "#22408C";

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
                                    onPointerDown={(e) => {
                                      // Con el dedo solo se arrastra desde el tirador
                                      if (e.pointerType !== "mouse") return;
                                      beginDrag(e, b, "move", {
                                        start,
                                        dur: end - start,
                                        col,
                                        cols,
                                        colId: lane.id,
                                      });
                                    }}
                                    className={`absolute z-10 text-left rounded-lg flex overflow-hidden select-none active:scale-[.98] transition-transform ease-brand group/card min-[920px]:hover:-translate-y-px min-[920px]:hover:outline min-[920px]:hover:outline-1 min-[920px]:hover:outline-primary/25 ${
                                      onMove ? "cursor-grab active:cursor-grabbing" : ""
                                    }`}
                                    style={{
                                      left,
                                      width,
                                      top,
                                      height,
                                      background: done ? COMPLETED_BG : "#fff",
                                      boxShadow: CARD_SHADOW,
                                      opacity: done ? 0.9 : 1,
                                      ...NO_SELECT,
                                    }}
                                  >
                                    <CardBody b={b} color={color} height={height} startMin={start} />

                                    {/* Tirador de MOVER: los puntos sobre la barra de color.
                                        En táctil es el único sitio desde el que se arrastra. */}
                                    {onMove && (
                                      <span
                                        role="separator"
                                        aria-label={`Mover la cita de ${b.customer_name}`}
                                        onPointerDown={(e) => {
                                          e.stopPropagation();
                                          beginDrag(e, b, "move", {
                                            start,
                                            dur: end - start,
                                            col,
                                            cols,
                                            colId: lane.id,
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute left-0 top-0 bottom-0 w-4 flex items-center cursor-grab active:cursor-grabbing"
                                        style={{ touchAction: "none", paddingLeft: 4, ...NO_SELECT }}
                                      >
                                        <span className="flex flex-col gap-[2px]">
                                          {[0, 1, 2].map((i) => (
                                            <span
                                              key={i}
                                              className="w-[3px] h-[3px] rounded-full bg-white/75"
                                            />
                                          ))}
                                        </span>
                                      </span>
                                    )}

                                    {onResize && (
                                      <span
                                        role="separator"
                                        aria-label={`Cambiar duración de la cita de ${b.customer_name}`}
                                        onPointerDown={(e) => {
                                          e.stopPropagation();
                                          beginDrag(e, b, "resize", {
                                            start,
                                            dur: end - start,
                                            col,
                                            cols,
                                            colId: lane.id,
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute bottom-0 left-0 right-0 h-2.5 flex items-end justify-center cursor-ns-resize opacity-45 min-[920px]:opacity-0 min-[920px]:group-hover/card:opacity-100 transition-opacity"
                                        style={{ touchAction: "none", ...NO_SELECT }}
                                      >
                                        <span className="h-[3px] w-4 rounded-full bg-outline/40" />
                                      </span>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Guía de encaje + holograma */}
                              {ghost &&
                                (() => {
                                  const ghostBlock = isBlocked(ghost.b);
                                  const gCols = ghost.mode === "resize" ? ghost.cols : 1;
                                  const gCol = ghost.mode === "resize" ? ghost.col : 0;
                                  const gLeft = `calc(2px + (100% - 4px) * ${gCol / gCols})`;
                                  const gWidth = `calc((100% - 4px) / ${gCols} - ${gCols > 1 ? 2 : 0}px)`;
                                  const snapTop = Math.max(0, (ghost.start - dayStart) * PPM);
                                  const snapH = Math.max(
                                    18,
                                    Math.min(ghost.dur, dayEnd - ghost.start) * PPM,
                                  );
                                  const rawTop =
                                    ghost.mode === "resize"
                                      ? snapTop
                                      : (ghost.rawStart - dayStart) * PPM;
                                  const rawH =
                                    ghost.mode === "resize" ? Math.max(18, ghost.rawDur * PPM) : snapH;
                                  const done = isCompleted(ghost.b);

                                  return (
                                    <>
                                      <div
                                        className="absolute z-[15] rounded-lg border-2 border-dashed pointer-events-none transition-all duration-100 ease-out"
                                        style={{
                                          left: gLeft,
                                          width: gWidth,
                                          top: snapTop,
                                          height: snapH,
                                          borderColor: "hsl(var(--primary) / 0.5)",
                                          background: "hsl(var(--primary) / 0.06)",
                                        }}
                                      />
                                      <div
                                        className="absolute z-20 rounded-lg flex overflow-hidden pointer-events-none"
                                        style={{
                                          left: gLeft,
                                          width: gWidth,
                                          top: 0,
                                          height: rawH,
                                          transform: `translate3d(0, ${rawTop}px, 0) scale(1.04)`,
                                          willChange: "transform",
                                          background: done
                                            ? "rgba(241,250,244,.82)"
                                            : "rgba(255,255,255,.82)",
                                          backdropFilter: "blur(8px)",
                                          WebkitBackdropFilter: "blur(8px)",
                                          boxShadow: `${SHADOW_DRAG}, 0 0 0 1.5px hsl(var(--primary) / 0.35)`,
                                        }}
                                      >
                                        {ghostBlock ? (
                                          <span className="relative flex-1 flex items-center justify-center overflow-hidden">
                                            <span
                                              className="absolute inset-0"
                                              style={{ background: STRIPES }}
                                            />
                                            <span className="relative inline-flex items-center gap-1 text-[10px] font-bold text-outline tabular-nums">
                                              <Lock className="w-2.5 h-2.5" />
                                              {fromMinutes(ghost.start)}
                                            </span>
                                          </span>
                                        ) : (
                                          <CardBody
                                            b={ghost.b}
                                            color={stylistColors[ghost.b.stylist] || "#22408C"}
                                            height={rawH}
                                            startMin={ghost.start}
                                          />
                                        )}
                                      </div>
                                      <span
                                        className="absolute z-30 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums shadow-fab pointer-events-none whitespace-nowrap"
                                        style={{
                                          top: Math.max(
                                            2,
                                            Math.min(
                                              railHeight - 18,
                                              ghost.mode === "resize"
                                                ? rawTop + rawH + 2
                                                : rawTop - 19,
                                            ),
                                          ),
                                        }}
                                      >
                                        {fromMinutes(ghost.start)}
                                        {ghost.mode === "resize" &&
                                          ` – ${fromMinutes(ghost.start + ghost.dur)}`}
                                      </span>
                                    </>
                                  );
                                })()}

                              {/* Línea AHORA, solo en el día de hoy */}
                              {day.isToday && nowMinutes >= dayStart && nowMinutes <= dayEnd && (
                                <div
                                  className="absolute left-0 right-0 z-40 pointer-events-none flex items-center"
                                  style={{ top: (nowMinutes - dayStart) * PPM }}
                                >
                                  {first && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-none -ml-px" />
                                  )}
                                  <span className="flex-1 h-0.5 bg-gradient-brand" />
                                </div>
                              )}

                              {lane.items.length === 0 && lane.fullBlocks.length === 0 && (
                                <p className="absolute inset-x-1 top-3 text-[11px] text-outline/70 text-center pointer-events-none">
                                  Libre
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
