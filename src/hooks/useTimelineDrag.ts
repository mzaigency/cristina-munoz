import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Motor de arrastre compartido por la agenda de día y la de semana.
 *
 * Usa Pointer Events (no el drag&drop de HTML5, que no existe en táctil), así
 * que el mismo código sirve para ratón y dedo:
 *  - ratón: el arrastre arranca al superar 4px desde cualquier punto de la tarjeta
 *  - táctil: SOLO desde los tiradores, y manteniendo pulsado; si el dedo se mueve
 *    antes de tiempo se cancela, porque entonces está haciendo scroll
 *
 * Mantiene dos posiciones a la vez: la LIBRE (`rawStart`/`rawDur`, sigue al
 * puntero 1:1 → el holograma) y la ENCAJADA a `snap` minutos (`start`/`dur`,
 * lo que se guarda → la guía punteada).
 */

export type DragMode = "move" | "resize";

export interface DragMeta {
  /** minuto absoluto de inicio */
  start: number;
  /** duración en minutos */
  dur: number;
  /** posición dentro del reparto de solapes */
  col: number;
  cols: number;
  /** columna de origen (slug del profesional en día, fecha en semana) */
  colId: string;
}

export interface DragState<T> extends DragMeta {
  b: T;
  mode: DragMode;
  pointerType: string;
  startX: number;
  startY: number;
  originStart: number;
  originDur: number;
  originColId: string;
  /** true cuando el gesto ya cuenta como arrastre (umbral o pulsación larga) */
  active: boolean;
  rawStart: number;
  rawDur: number;
}

interface Options<T> {
  dayStart: number;
  dayEnd: number;
  /** píxeles por minuto */
  ppm: number;
  /** minutos de encaje (por defecto 15) */
  snap?: number;
  /** ms que hay que mantener el tirador en táctil (por defecto 260) */
  longPressMs?: number;
  /** ids de columna en orden; se usan para saber sobre cuál está el puntero */
  columnIds: string[];
  railRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onMove?: (booking: T, colId: string, startMinutes: number) => void;
  onResize?: (booking: T, duration: number) => void;
}

/**
 * Vibración corta al agarrar/soltar. Android la soporta; iOS Safari NO tiene
 * Vibration API, ahí el aviso es el salto visual de la tarjeta al levantarse.
 */
export const haptic = (pattern: number | number[] = 12) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* navegador sin Vibration API */
  }
};

/** Bloquea selección de texto y menú contextual al mantener pulsado (iOS) */
export const NO_SELECT = {
  WebkitUserSelect: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
} as const;

export function useTimelineDrag<T extends { id: string }>({
  dayStart,
  dayEnd,
  ppm,
  snap = 15,
  longPressMs = 260,
  columnIds,
  railRefs,
  onMove,
  onResize,
}: Options<T>) {
  const [drag, setDrag] = useState<DragState<T> | null>(null);
  const dragRef = useRef<DragState<T> | null>(null);
  const longPress = useRef<number | null>(null);
  /** tras un arrastre, ignora el click sintético que dispara el navegador */
  const suppressClick = useRef(false);
  const rafId = useRef<number | null>(null);
  const pendingPoint = useRef<{ x: number; y: number } | null>(null);

  const setDragState = useCallback((d: DragState<T> | null) => {
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
    (e: React.PointerEvent, b: T, mode: DragMode, meta: DragMeta) => {
      if (mode === "move" && !onMove) return;
      if (mode === "resize" && !onResize) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (mode === "resize") e.preventDefault();
      const touch = e.pointerType !== "mouse";

      setDragState({
        ...meta,
        b,
        mode,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
        originStart: meta.start,
        originDur: meta.dur,
        originColId: meta.colId,
        // Con ratón, redimensionar arranca al instante y mover al superar el umbral.
        // Con el dedo SIEMPRE hay que mantener pulsado el tirador, tanto para mover
        // como para estirar: si no, un scroll que empieza encima acaba arrastrando.
        active: mode === "resize" && !touch,
        rawStart: meta.start,
        rawDur: meta.dur,
      });

      if (touch) {
        clearLongPress();
        longPress.current = window.setTimeout(() => {
          const cur = dragRef.current;
          if (!cur || cur.active) return;
          setDragState({ ...cur, active: true });
          haptic(mode === "resize" ? 10 : 14);
        }, longPressMs);
      }
    },
    [onMove, onResize, setDragState, longPressMs],
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
        if (cur.dur !== cur.originDur) {
          if (cur.pointerType !== "mouse") haptic(8);
          onResize?.(cur.b, cur.dur);
        }
      } else if (cur.start !== cur.originStart || cur.colId !== cur.originColId) {
        if (cur.pointerType !== "mouse") haptic(8);
        onMove?.(cur.b, cur.colId, cur.start);
      }
    };

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
        const raw = cur.originDur + dy / ppm;
        const rawDur = Math.max(snap, Math.min(raw, maxDur));
        const dur = Math.max(snap, Math.min(Math.round(raw / snap) * snap, maxDur));
        setDragState({ ...cur, active, dur, rawDur });
        return;
      }

      const raw = cur.originStart + dy / ppm;
      const maxStart = dayEnd - cur.dur;
      const rawStart = Math.max(dayStart, Math.min(raw, maxStart));
      const start = Math.max(dayStart, Math.min(Math.round(raw / snap) * snap, maxStart));

      let colId = cur.colId;
      for (const id of columnIds) {
        const el = railRefs.current[id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right) {
          colId = id;
          break;
        }
      }
      setDragState({ ...cur, active, start, rawStart, colId });
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
  }, [dragging, dayStart, dayEnd, ppm, snap, columnIds, railRefs, onMove, onResize, setDragState]);

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

  return { drag, dragActive, beginDrag, suppressClick };
}
