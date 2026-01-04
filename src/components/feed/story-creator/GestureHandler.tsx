/**
 * STORY CREATOR - GESTURE HANDLER
 * Sistema de gestos profesional tipo Instagram
 * - Multi-touch: pan + pinch + rotate simultáneos
 * - Snap-to-grid con guías magnéticas
 * - Vibración háptica progresiva
 * - Física suave 60fps
 */

import { useRef, useCallback, useState } from "react";

// ============= TYPES =============

export interface GestureState {
  isDragging: boolean;
  isMultiTouch: boolean;
  showCenterGuideH: boolean;
  showCenterGuideV: boolean;
  isInTrashZone: boolean;
  trashZoneIntensity: number; // 0-1
}

interface GestureRefState {
  startX: number;
  startY: number;
  initialItemX: number;
  initialItemY: number;
  initialScale: number;
  initialRotation: number;
  startDist: number;
  startAngle: number;
  isMultiTouch: boolean;
  lastSnapH: boolean;
  lastSnapV: boolean;
  lastHapticTime: number;
}

// ============= MATH UTILS =============

const getDistance = (p1: React.Touch, p2: React.Touch) => 
  Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

const getAngle = (p1: React.Touch, p2: React.Touch) =>
  (Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180) / Math.PI;

const getMidpoint = (p1: React.Touch, p2: React.Touch) => ({
  x: (p1.clientX + p2.clientX) / 2,
  y: (p1.clientY + p2.clientY) / 2,
});

// Snap threshold - distance from center to trigger snap (percentage)
const SNAP_THRESHOLD = 0.03; // 3% of container
const SNAP_FRICTION = 0.6; // How much to slow down near center

// Trash zone thresholds
const TRASH_ZONE_START = 0.80;
const TRASH_ZONE_DELETE = 0.92;

// ============= HOOK =============

interface UseGestureHandlerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onTransformStart?: (id: string) => void;
  onTransformEnd?: (id: string, wasDeleted: boolean) => void;
}

export function useGestureHandler({ containerRef, onTransformStart, onTransformEnd }: UseGestureHandlerProps) {
  const [gestureState, setGestureState] = useState<GestureState>({
    isDragging: false,
    isMultiTouch: false,
    showCenterGuideH: false,
    showCenterGuideV: false,
    isInTrashZone: false,
    trashZoneIntensity: 0,
  });

  const gestureRef = useRef<GestureRefState>({
    startX: 0,
    startY: 0,
    initialItemX: 0,
    initialItemY: 0,
    initialScale: 1,
    initialRotation: 0,
    startDist: 0,
    startAngle: 0,
    isMultiTouch: false,
    lastSnapH: false,
    lastSnapV: false,
    lastHapticTime: 0,
  });

  const activeItemIdRef = useRef<string | null>(null);

  // Haptic feedback with throttle
  const haptic = useCallback((pattern: number | number[], minInterval = 50) => {
    const now = Date.now();
    if (now - gestureRef.current.lastHapticTime < minInterval) return;
    gestureRef.current.lastHapticTime = now;
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Start gesture
  const handleGestureStart = useCallback((
    e: React.TouchEvent | React.MouseEvent,
    itemId: string,
    currentTransform: { x: number; y: number; scale: number; rotation: number }
  ) => {
    e.stopPropagation();
    activeItemIdRef.current = itemId;
    onTransformStart?.(itemId);

    const g = gestureRef.current;

    if ("touches" in e && e.touches.length === 2) {
      // Multi-touch: pinch + rotate
      g.isMultiTouch = true;
      g.startDist = getDistance(e.touches[0], e.touches[1]);
      g.startAngle = getAngle(e.touches[0], e.touches[1]);
      g.initialScale = currentTransform.scale;
      g.initialRotation = currentTransform.rotation;

      const mid = getMidpoint(e.touches[0], e.touches[1]);
      const container = containerRef.current?.getBoundingClientRect();
      if (container) {
        g.startX = mid.x;
        g.startY = mid.y;
        g.initialItemX = currentTransform.x;
        g.initialItemY = currentTransform.y;
      }
    } else {
      // Single touch: pan
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      g.isMultiTouch = false;
      g.startX = clientX;
      g.startY = clientY;
      g.initialItemX = currentTransform.x;
      g.initialItemY = currentTransform.y;
      g.initialScale = currentTransform.scale;
      g.initialRotation = currentTransform.rotation;
    }

    g.lastSnapH = false;
    g.lastSnapV = false;

    setGestureState({
      isDragging: true,
      isMultiTouch: g.isMultiTouch,
      showCenterGuideH: false,
      showCenterGuideV: false,
      isInTrashZone: false,
      trashZoneIntensity: 0,
    });

    haptic(5);
  }, [containerRef, haptic, onTransformStart]);

  // Move gesture - returns new transform
  const handleGestureMove = useCallback((
    e: React.TouchEvent | React.MouseEvent,
    currentTransform: { x: number; y: number; scale: number; rotation: number }
  ): { x: number; y: number; scale: number; rotation: number } | null => {
    if (!activeItemIdRef.current) return null;

    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return null;

    const g = gestureRef.current;
    let newX = currentTransform.x;
    let newY = currentTransform.y;
    let newScale = currentTransform.scale;
    let newRotation = currentTransform.rotation;

    if ("touches" in e && e.touches.length === 2 && g.isMultiTouch) {
      // Multi-touch: scale + rotate
      e.preventDefault();
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const currentAngle = getAngle(e.touches[0], e.touches[1]);

      const scaleFactor = currentDist / g.startDist;
      const rotationDiff = currentAngle - g.startAngle;

      newScale = Math.max(0.3, Math.min(5, g.initialScale * scaleFactor));
      newRotation = g.initialRotation + rotationDiff;

      // Also allow pan during pinch
      const mid = getMidpoint(e.touches[0], e.touches[1]);
      const deltaX = mid.x - g.startX;
      const deltaY = mid.y - g.startY;
      newX = g.initialItemX + deltaX / container.width;
      newY = g.initialItemY + deltaY / container.height;

      // Haptic at scale limits
      if (newScale <= 0.31 || newScale >= 4.99) {
        haptic(15);
      }
    } else if (!g.isMultiTouch) {
      // Single touch: pan with snap-to-center
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const deltaX = clientX - g.startX;
      const deltaY = clientY - g.startY;

      let rawX = g.initialItemX + deltaX / container.width;
      let rawY = g.initialItemY + deltaY / container.height;

      // Check snap-to-center
      const distFromCenterH = Math.abs(rawX - 0.5);
      const distFromCenterV = Math.abs(rawY - 0.5);

      const snapH = distFromCenterH < SNAP_THRESHOLD;
      const snapV = distFromCenterV < SNAP_THRESHOLD;

      // Apply magnetic snap with smooth friction
      if (snapH) {
        const friction = 1 - (1 - distFromCenterH / SNAP_THRESHOLD) * SNAP_FRICTION;
        newX = 0.5 + (rawX - 0.5) * friction;
        // If just snapped, vibrate
        if (!g.lastSnapH) {
          haptic(10);
          g.lastSnapH = true;
        }
      } else {
        newX = rawX;
        g.lastSnapH = false;
      }

      if (snapV) {
        const friction = 1 - (1 - distFromCenterV / SNAP_THRESHOLD) * SNAP_FRICTION;
        newY = 0.5 + (rawY - 0.5) * friction;
        if (!g.lastSnapV) {
          haptic(10);
          g.lastSnapV = true;
        }
      } else {
        newY = rawY;
        g.lastSnapV = false;
      }
    }

    // Check trash zone
    const isInTrash = newY > TRASH_ZONE_START;
    const trashIntensity = isInTrash 
      ? Math.min(1, (newY - TRASH_ZONE_START) / (TRASH_ZONE_DELETE - TRASH_ZONE_START))
      : 0;

    // Progressive haptic for trash zone
    if (isInTrash && trashIntensity > 0.5) {
      haptic(Math.floor(10 + trashIntensity * 20), 100);
    }

    setGestureState(prev => ({
      ...prev,
      showCenterGuideH: Math.abs(newX - 0.5) < SNAP_THRESHOLD,
      showCenterGuideV: Math.abs(newY - 0.5) < SNAP_THRESHOLD,
      isInTrashZone: isInTrash,
      trashZoneIntensity: trashIntensity,
    }));

    return { x: newX, y: newY, scale: newScale, rotation: newRotation };
  }, [containerRef, haptic]);

  // End gesture
  const handleGestureEnd = useCallback((currentY: number): boolean => {
    const itemId = activeItemIdRef.current;
    const shouldDelete = currentY > TRASH_ZONE_DELETE;

    if (shouldDelete) {
      haptic([30, 50, 30, 50, 30]);
    }

    setGestureState({
      isDragging: false,
      isMultiTouch: false,
      showCenterGuideH: false,
      showCenterGuideV: false,
      isInTrashZone: false,
      trashZoneIntensity: 0,
    });

    if (itemId) {
      onTransformEnd?.(itemId, shouldDelete);
    }
    activeItemIdRef.current = null;

    return shouldDelete;
  }, [haptic, onTransformEnd]);

  const cancelGesture = useCallback(() => {
    activeItemIdRef.current = null;
    setGestureState({
      isDragging: false,
      isMultiTouch: false,
      showCenterGuideH: false,
      showCenterGuideV: false,
      isInTrashZone: false,
      trashZoneIntensity: 0,
    });
  }, []);

  return {
    gestureState,
    handleGestureStart,
    handleGestureMove,
    handleGestureEnd,
    cancelGesture,
    activeItemId: activeItemIdRef.current,
  };
}

// ============= GUIDE LINES COMPONENT =============

interface GuideLinesProps {
  showHorizontal: boolean;
  showVertical: boolean;
}

export function GuideLines({ showHorizontal, showVertical }: GuideLinesProps) {
  if (!showHorizontal && !showVertical) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Horizontal center guide */}
      {showHorizontal && (
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-400/80 shadow-[0_0_8px_2px_rgba(34,211,238,0.5)]" />
      )}
      {/* Vertical center guide */}
      {showVertical && (
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-cyan-400/80 shadow-[0_0_8px_2px_rgba(34,211,238,0.5)]" />
      )}
      {/* Center crosshair when both active */}
      {showHorizontal && showVertical && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-cyan-400 rounded-full shadow-[0_0_12px_4px_rgba(34,211,238,0.6)] animate-pulse" />
      )}
    </div>
  );
}

// ============= TRASH ZONE COMPONENT =============

interface TrashZoneProps {
  isVisible: boolean;
  intensity: number; // 0-1
}

export function TrashZone({ isVisible, intensity }: TrashZoneProps) {
  if (!isVisible) return null;

  const scale = 1 + intensity * 0.3;
  const isDeleteReady = intensity > 0.8;

  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
      <div 
        className="flex items-center justify-center transition-all duration-150"
        style={{
          width: 64 * scale,
          height: 64 * scale,
          borderRadius: '50%',
          background: isDeleteReady 
            ? 'rgba(239, 68, 68, 0.9)' 
            : intensity > 0.3 
              ? `rgba(245, 158, 11, ${0.4 + intensity * 0.4})` 
              : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          boxShadow: isDeleteReady 
            ? '0 0 30px rgba(239, 68, 68, 0.6)' 
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <svg 
          width={24 * scale} 
          height={24 * scale} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isDeleteReady ? 'white' : intensity > 0.3 ? 'white' : 'rgba(239, 68, 68, 0.8)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform"
          style={{ transform: isDeleteReady ? 'rotate(-10deg)' : 'none' }}
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </div>
    </div>
  );
}
