import { useMemo, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { busyMinutes } from "@/lib/agendaOccupancy";
import { Lock, LockOpen, Check, Plus, X } from "lucide-react";
import { NO_SELECT, useTimelineDrag } from "@/hooks/useTimelineDrag";

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
  arrived: { label: "Llegada", short: "LLEG", cls: "bg-success-soft text-success", dot: "var(--glow-ok)" },
  confirmed: { label: "Confirmada", short: "CONF", cls: "bg-info-soft text-info", dot: "var(--glow-brand)" },
  pending: { label: "Pendiente", short: "PEND", cls: "bg-warning-soft text-warning", dot: "var(--glow-warn)" },
  completed: {
    label: "Completada",
    short: "HECHA",
    cls: "bg-success-soft text-success",
    dot: "var(--glow-ok)",
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

const COMPLETED_BG = "var(--glow-ok-soft)";
const COMPLETED_COLOR = "var(--glow-ok)";

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
        className="my-1 ml-1 w-1.5 rounded-full flex-none"
        style={{ background: done ? COMPLETED_COLOR : color }}
      />
      <span
        className="relative flex-1 min-w-0 flex flex-col justify-center"
        style={{ padding: size === "sm" ? "0 8px 3px 7px" : "7px 9px 7px 8px" }}
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

  const railRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const columnIds = useMemo(() => stylists.map((s) => s.slug), [stylists]);

  const { drag, dragActive, beginDrag, suppressClick } = useTimelineDrag<TimelineBooking>({
    dayStart,
    dayEnd,
    ppm: PPM,
    columnIds,
    railRefs,
    onMove: onMove ? (b, slug, startMin) => onMove(b, slug, fromMinutes(startMin)) : undefined,
    onResize,
  });

  const canDrag = !!onMove;

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
      // El bloqueo de DÍA COMPLETO es fondo y no entra en el reparto (taparía todo).
      // Los de horas concretas SÍ entran: comparten el hueco con las citas.
      const isFull = (b: TimelineBooking) => isBlocked(b) && !!isFullDayBlocked?.(b);
      const fullBlocks = raw.filter((it) => isFull(it.b));
      const items = layout(raw.filter((it) => !isFull(it.b)));
      const appts = items.filter((it) => !isBlocked(it.b));
      const busy = busyMinutes(appts.map((it) => ({ start: it.start, end: it.end })));
      const occupancy = Math.min(100, Math.round((busy / workMinutes) * 100));
      return { stylist: s, fullBlocks, items, realCount: appts.length, occupancy, busy };
    });
  }, [bookings, stylists, workMinutes, isBlocked, isFullDayBlocked]);

  if (stylists.length === 0) return null;

  const showNow = isToday && nowMinutes >= dayStart && nowMinutes <= dayEnd;
  const nowTop = HEAD_PX + (nowMinutes - dayStart) * PPM;

  // Franja de descanso (del horario del negocio)
  const hasBreak =
    breakStart != null && breakEnd != null && breakEnd > breakStart && breakEnd > dayStart;
  const breakTop = hasBreak ? Math.max(0, (breakStart! - dayStart) * PPM) : 0;
  const breakH = hasBreak ? Math.min(railHeight, (breakEnd! - dayStart) * PPM) - breakTop : 0;

  return (
    <div>
      <div className="overflow-x-auto no-scrollbar">
        {/* select-none en todo el lienzo: mantener pulsado nunca selecciona texto
            ni abre el menú contextual de iOS, solo levanta la cita */}
        <div
          className="flex min-w-max min-[920px]:min-w-0 px-5 gap-6 pb-12 relative select-none"
          style={NO_SELECT}
        >
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
          {sections.map(({ stylist, fullBlocks, items, realCount, occupancy }) => {
            const ghost = drag?.active && drag.colId === stylist.slug ? drag : null;
            const blockCount = fullBlocks.length + items.filter((it) => isBlocked(it.b)).length;
            const isDropTarget = !!ghost && drag!.mode === "move" && drag!.originColId !== stylist.slug;

            return (
            <div
              key={stylist.slug}
              className="ag-lane w-64 flex-shrink-0 min-[920px]:flex-1 min-[920px]:w-auto min-[920px]:min-w-[210px]"
              style={{ ["--lane" as string]: stylist.color }}
            >
              {/* Cabecera pegada a la columna */}
              <div className="ag-lane-h flex items-center gap-3">
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
                  <h4 className="glow-row-nm truncate flex items-center gap-1.5" style={{ fontSize: "var(--glow-t-base)" }}>
                    <span className="truncate">{stylist.name}</span>
                    {blockCount > 0 && (
                      /* La gestión de bloqueos vive aquí y no en el raíl: cuando hay
                         varios se apilaban en la misma posición y solo el de encima
                         recibía el clic, así que a los de debajo no había manera de
                         llegar. Desde la lista siempre se alcanzan todos. */
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${blockCount} ${blockCount > 1 ? "bloqueos" : "bloqueo"} de ${stylist.name}`}
                            className="ag-blockchip"
                          >
                            <Lock style={{ width: 11, height: 11 }} />
                            {blockCount}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0 overflow-hidden" style={{ minWidth: 268 }}>
                          <div className="ag-blocks-h">
                            <span className="ag-blocks-ic"><Lock style={{ width: 14, height: 14 }} /></span>
                            <div>
                              <div className="ag-blocks-t">
                                {blockCount} {blockCount > 1 ? "bloqueos" : "bloqueo"}
                              </div>
                              <div className="ag-blocks-s">{stylist.name} · hoy</div>
                            </div>
                          </div>
                          <div className="ag-blocks-list">
                            {[...fullBlocks.map((f) => ({ b: f.b, full: true, start: 0, end: 0 })),
                              ...items.filter((it) => isBlocked(it.b)).map((it) => ({ ...it, full: false }))]
                              .map(({ b, full, start, end }) => (
                                <div key={b.id} className="ag-blocks-row">
                                  <span className={`ag-blocks-dot${full ? " full" : ""}`} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="ag-blocks-when">
                                      {full ? "Todo el día" : `${fromMinutes(start)} – ${fromMinutes(end)}`}
                                    </div>
                                    {b.title && b.title !== "Bloqueado" && (
                                      <div className="ag-blocks-why">{b.title}</div>
                                    )}
                                  </div>
                                  {onUnblock && (
                                    <button
                                      type="button"
                                      className="ag-blocks-del"
                                      aria-label={`Quitar el bloqueo de ${full ? "todo el día" : `${fromMinutes(start)} a ${fromMinutes(end)}`}`}
                                      onClick={() => onUnblock(b)}
                                    >
                                      <LockOpen style={{ width: 12, height: 12 }} />
                                      Quitar
                                    </button>
                                  )}
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </h4>
                  <div className="glow-row-mt" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span>
                      {realCount} {realCount === 1 ? "cita" : "citas"} · {occupancy}%
                    </span>
                    {onUnblock && fullBlocks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onUnblock(fullBlocks[0].b)}
                        className="glow-btn glow-btn--sm glow-btn--ghost"
                        style={{ padding: "2px 8px", minHeight: 0 }}
                      >
                        <LockOpen style={{ width: 12, height: 12 }} />
                        Desbloquear
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Raíl */}
              <div
                ref={(el) => {
                  railRefs.current[stylist.slug] = el;
                }}
                className="ag-lane-rail relative overflow-hidden transition-colors"
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
                        className="absolute left-0 right-0 group flex items-center justify-center z-[7]"
                        style={{
                          top: i * 30 * PPM,
                          height: 30 * PPM,
                          pointerEvents: dragActive ? "none" : undefined,
                        }}
                      >
                        {/* Hueco resaltado: ratón (hover) o toque sostenido (active).
                            CSS puro: sin estado, así mover el ratón no repinta la agenda.
                            Durante un arrastre la capa va con pointer-events:none → sin hover. */}
                        <span className="pointer-events-none absolute inset-x-1 inset-y-[2px] rounded-xl border border-dashed border-primary/45 bg-background/90 flex items-center justify-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-active:opacity-100">
                          <Plus className="w-3 h-3 text-primary" strokeWidth={2.5} />
                          <span className="text-[11px] font-semibold text-primary tabular-nums">
                            {time}
                          </span>
                        </span>
                      </button>
                    );
                  })}

                {items.length === 0 && fullBlocks.length === 0 && (
                  <p className="absolute left-2 right-2 top-4 text-xs text-outline text-center pointer-events-none">
                    Sin citas · día libre
                  </p>
                )}

                {/* Bloqueo de DÍA COMPLETO. Se dibuja UNA vez aunque haya varios:
                    antes cada bloqueo pintaba su propio panel centrado y con dos
                    encima quedaban las etiquetas y los botones superpuestos. La
                    gestión está en la lista del candado, en la cabecera. */}
                {fullBlocks.length > 0 && (() => {
                  const primero = fullBlocks[0].b;
                  const label = primero.title || "Bloqueado";
                  const extra = fullBlocks.length - 1;
                  const conCitas = items.some((it) => !isBlocked(it.b));
                  return (
                    <>
                      <div
                        className="absolute z-[1] bg-striped-gray border border-line rounded-xl opacity-90 overflow-hidden pointer-events-none"
                        style={{ left: 0, width: "100%", top: 0, height: railHeight }}
                      />
                      {conCitas ? (
                        <div
                          className="absolute z-[8] left-1/2 -translate-x-1/2 top-1 flex items-center gap-1.5 rounded-full bg-white border border-line px-2.5 py-1 shadow-sm pointer-events-none"
                          style={{ maxWidth: "94%" }}
                        >
                          <Lock className="w-3 h-3 text-outline shrink-0" />
                          <span className="text-[11px] font-semibold text-outline truncate">
                            {label}{extra > 0 ? ` +${extra}` : ""}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="absolute z-[8] left-0 w-full flex flex-col items-center justify-center gap-2 px-3 text-center pointer-events-none"
                          style={{ top: 0, height: railHeight }}
                        >
                          <Lock className="w-5 h-5 text-outline" />
                          <span className="text-[13px] font-semibold text-outline">{label}</span>
                          <span className="text-[11px] text-outline/70">
                            {extra > 0
                              ? `y ${extra} bloqueo${extra > 1 ? "s" : ""} más · sin citas este día`
                              : "No hay citas este día"}
                          </span>
                          {onUnblock && (
                            <button
                              type="button"
                              onClick={() => onUnblock(primero)}
                              className="pointer-events-auto mt-1 inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-2 shadow-sm"
                            >
                              <LockOpen className="w-3.5 h-3.5" />
                              {extra > 0 ? "Ver bloqueos" : "Quitar bloqueo"}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Capa 2 — citas y bloqueos de horas, repartiéndose el hueco */}
                {items.map(({ b, start, end, col, cols }) => {
                  const dragged = drag?.active && drag.b.id === b.id;
                  const blocked = isBlocked(b);
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
                  const cLeft = `calc(4px + (100% - 8px) * ${col / cols})`;
                  const cWidth = `calc((100% - 8px) / ${cols} - ${cols > 1 ? 3 : 0}px)`;

                  // ── Bloqueo de horas concretas: ocupa su hueco como una cita más
                  if (blocked) {
                    const label = b.title || "Bloqueado";
                    const roomy = cols === 1;
                    return (
                      <div
                        key={b.id}
                        className="absolute z-[6] overflow-hidden rounded-lg border border-line pointer-events-none"
                        style={{ left: cLeft, width: cWidth, top, height }}
                      >
                        <span className="absolute inset-0 bg-striped-gray opacity-60" />

                        {canDrag && (
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
                                colId: stylist.slug,
                              });
                            }}
                            className="pointer-events-auto absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center cursor-grab active:cursor-grabbing"
                            style={{ touchAction: "none", ...NO_SELECT }}
                          >
                            <span
                              className="flex flex-col gap-[3px] rounded-full bg-white px-[3px] py-1"
                              style={{ boxShadow: "0 0 0 1px rgba(20,22,40,.06)" }}
                            >
                              {[0, 1, 2].map((i) => (
                                <span key={i} className="w-[3px] h-[3px] rounded-full bg-outline/70" />
                              ))}
                            </span>
                          </span>
                        )}

                        <span
                          className="pointer-events-auto absolute top-1 inline-flex items-center gap-1 rounded-full bg-surface-container-high pl-2 pr-1 py-0.5 text-[10px] font-bold text-outline"
                          style={{
                            left: canDrag ? 22 : 6,
                            maxWidth: `calc(100% - ${canDrag ? 28 : 12}px)`,
                          }}
                        >
                          <Lock className="w-2.5 h-2.5 flex-none" />
                          <span className="truncate">{roomy ? label : fromMinutes(start)}</span>
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

                        {height >= 40 && (
                          <span
                            className="absolute left-0 right-0 text-center text-[10px] font-bold text-outline/80 tabular-nums"
                            style={{ top: 22 }}
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
                                colId: stylist.slug,
                              });
                            }}
                            className="pointer-events-auto absolute bottom-0 left-0 right-0 h-3 flex items-end justify-center cursor-ns-resize"
                            style={{ touchAction: "none", ...NO_SELECT }}
                          >
                            <span className="h-[3px] w-7 rounded-full bg-outline/45" />
                          </span>
                        )}
                      </div>
                    );
                  }
                  const done = isCompleted(b);
                  const size: "sm" | "md" | "lg" =
                    height < H_SM ? "sm" : height < H_LG ? "md" : "lg";
                  // reparto horizontal cuando hay solapes entre citas
                  const left = `calc(4px + (100% - 8px) * ${col / cols})`;
                  const width = `calc((100% - 8px) / ${cols} - ${cols > 1 ? 3 : 0}px)`;
                  const narrow = cols > 1;

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
                        // Con el dedo solo se arrastra desde el tirador: si no, un
                        // scroll que empieza sobre la tarjeta acabaría moviéndola.
                        if (e.pointerType !== "mouse") return;
                        beginDrag(e, b, "move", {
                          start,
                          dur: end - start,
                          col,
                          cols,
                          colId: stylist.slug,
                        });
                      }}
                      className={`absolute z-10 text-left rounded-2xl flex overflow-hidden select-none active:scale-[.98] transition-all duration-150 ease-out group/card min-[920px]:hover:-translate-y-0.5 min-[920px]:hover:shadow-md min-[920px]:hover:outline min-[920px]:hover:outline-1 min-[920px]:hover:outline-primary/25 ${
                        canDrag ? "cursor-grab active:cursor-grabbing" : ""
                      }`}
                      style={{
                        left,
                        width,
                        top,
                        height,
                        background: done
                          ? COMPLETED_BG
                          : `color-mix(in oklab, ${stylist.color} 7%, #fff)`,
                        border: done
                          ? "1px solid color-mix(in oklab, var(--glow-ok) 30%, #fff)"
                          : b.status === "pending"
                            ? "1.5px dashed color-mix(in oklab, var(--glow-warn) 55%, #fff)"
                            : `1px solid color-mix(in oklab, ${stylist.color} 22%, #fff)`,
                        boxShadow: size === "sm" ? SHADOW_SM : IOS_SHADOW,
                        opacity: done ? 0.9 : 1,
                        ...NO_SELECT,
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

                      {/* Tirador de MOVER: los puntos del borde izquierdo. En táctil
                          es el único sitio desde el que se puede arrastrar. */}
                      {canDrag && (
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
                              colId: stylist.slug,
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-0 bottom-0 w-5 flex items-center cursor-grab active:cursor-grabbing"
                          style={{ touchAction: "none", paddingLeft: 5.5, ...NO_SELECT }}
                        >
                          <span className="flex flex-col gap-[3px]">
                            {[0, 1, 2].map((i) => (
                              <span key={i} className="w-[3px] h-[3px] rounded-full bg-white/75" />
                            ))}
                          </span>
                        </span>
                      )}

                      {/* Tirador de duración (borde inferior). También en las citas
                          cortas: son justo las que más falta hace poder estirar. */}
                      {onResize && (
                        <span
                          role="separator"
                          aria-label={`Cambiar duración de la cita de ${b.customer_name}`}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            beginDrag(e, b, "resize", { start, dur: end - start, col, cols, colId: stylist.slug });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute bottom-0 left-0 right-0 flex items-end justify-center pb-0.5 cursor-ns-resize opacity-45 min-[920px]:opacity-0 min-[920px]:group-hover/card:opacity-100 transition-opacity ${
                            size === "sm" ? "h-2.5" : "h-3.5"
                          }`}
                          style={{ touchAction: "none", ...NO_SELECT }}
                        >
                          <span
                            className={`h-[3px] rounded-full bg-outline/40 ${
                              size === "sm" ? "w-5" : "w-7"
                            }`}
                          />
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Arrastre: guía de encaje (dónde cae) + holograma (dónde está el dedo) */}
                {ghost &&
                  (() => {
                    const ghostBlock = isBlocked(ghost.b);
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
                          {ghostBlock ? (
                            <span className="relative flex-1 flex items-center justify-center overflow-hidden">
                              <span className="absolute inset-0 bg-striped-gray opacity-60" />
                              <span className="relative inline-flex items-center gap-1 text-[11px] font-bold text-outline">
                                <Lock className="w-3 h-3" />
                                {ghost.b.title || "Bloqueado"}
                              </span>
                            </span>
                          ) : (
                            <CardBody
                              b={ghost.b}
                              color={stylist.color}
                              height={rawH}
                              narrow={ghost.mode === "resize" && ghost.cols > 1}
                              startMin={ghost.start}
                              endMin={ghost.start + ghost.dur}
                            />
                          )}
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
                <div className="relative flex items-center justify-center -ml-1 flex-none">
                  <span className="absolute w-3.5 h-3.5 rounded-full bg-accent/40 animate-ping pointer-events-none" />
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-white relative z-10"
                    style={{ boxShadow: "0 0 8px rgba(152,50,154,0.6)" }}
                  />
                </div>
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
