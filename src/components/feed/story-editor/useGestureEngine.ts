import { useRef, useState, useCallback } from "react";
import type { OverlayItem, GestureState } from "./types";

// Math utilities
const getDistance = (p1: React.Touch, p2: React.Touch) => 
  Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

const getAngle = (p1: React.Touch, p2: React.Touch) =>
  (Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180) / Math.PI;

const getMidpoint = (p1: React.Touch, p2: React.Touch) => ({
  x: (p1.clientX + p2.clientX) / 2,
  y: (p1.clientY + p2.clientY) / 2,
});

// Constants
const SNAP_CENTER_THRESHOLD = 0.04;
const SNAP_EDGE_THRESHOLD = 0.05;
const EDGE_MARGIN = 0.08;
const TRASH_ZONE_START = 0.82;
const TRASH_ZONE_DELETE = 0.92;
const DOUBLE_TAP_DELAY = 300;

// Rotation snap angles
const ROTATION_SNAP_ANGLES = [0, 45, 90, 135, 180, -45, -90, -135, -180];
const ROTATION_SNAP_THRESHOLD = 5;

interface GestureRef {
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialScale: number;
  initialRotation: number;
  startDist: number;
  startAngle: number;
  isMultiTouch: boolean;
  lastHapticTime: number;
  wasSnappedH: boolean;
  wasSnappedV: boolean;
  wasSnappedLeft: boolean;
  wasSnappedRight: boolean;
  wasSnappedTop: boolean;
  wasSnappedBottom: boolean;
  wasSnappedRotation: boolean;
  lastTapTime: number;
  lastTapItemId: string | null;
  hasMoved: boolean;
}

export interface EnhancedGestureState extends GestureState {
  showLeftGuide: boolean;
  showRightGuide: boolean;
  showTopGuide: boolean;
  showBottomGuide: boolean;
}

export function useGestureEngine(
  containerRef: React.RefObject<HTMLDivElement>,
  overlays: OverlayItem[],
  setOverlays: React.Dispatch<React.SetStateAction<OverlayItem[]>>,
  onDelete?: (id: string) => void,
  onDoubleTap?: (item: OverlayItem) => void
) {
  const [gestureState, setGestureState] = useState<EnhancedGestureState>({
    isDragging: false,
    isMultiTouch: false,
    activeItemId: null,
    showCenterGuideH: false,
    showCenterGuideV: false,
    isInTrashZone: false,
    trashIntensity: 0,
    showLeftGuide: false,
    showRightGuide: false,
    showTopGuide: false,
    showBottomGuide: false,
  });

  const gestureRef = useRef<GestureRef>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialScale: 1,
    initialRotation: 0,
    startDist: 0,
    startAngle: 0,
    isMultiTouch: false,
    lastHapticTime: 0,
    wasSnappedH: false,
    wasSnappedV: false,
    wasSnappedLeft: false,
    wasSnappedRight: false,
    wasSnappedTop: false,
    wasSnappedBottom: false,
    wasSnappedRotation: false,
    lastTapTime: 0,
    lastTapItemId: null,
    hasMoved: false,
  });

  const haptic = useCallback((pattern: number | number[], minInterval = 40) => {
    const now = Date.now();
    if (now - gestureRef.current.lastHapticTime < minInterval) return;
    gestureRef.current.lastHapticTime = now;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, itemId: string) => {
    e.stopPropagation();
    
    const item = overlays.find(o => o.id === itemId);
    if (!item || !containerRef.current) return;

    const g = gestureRef.current;
    const now = Date.now();
    
    // Detect double-tap for mobile
    if (now - g.lastTapTime < DOUBLE_TAP_DELAY && g.lastTapItemId === itemId) {
      // Double-tap detected
      g.lastTapTime = 0;
      g.lastTapItemId = null;
      onDoubleTap?.(item);
      haptic([10, 20, 10]);
      return;
    }
    
    g.lastTapTime = now;
    g.lastTapItemId = itemId;
    g.hasMoved = false;
    
    // Reset snap states
    g.wasSnappedH = false;
    g.wasSnappedV = false;
    g.wasSnappedLeft = false;
    g.wasSnappedRight = false;
    g.wasSnappedTop = false;
    g.wasSnappedBottom = false;
    g.wasSnappedRotation = false;

    // Bring to front
    setOverlays(prev => {
      const idx = prev.findIndex(o => o.id === itemId);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const [removed] = newArr.splice(idx, 1);
      newArr.push(removed);
      return newArr;
    });

    if (e.touches.length === 2) {
      g.isMultiTouch = true;
      g.startDist = getDistance(e.touches[0], e.touches[1]);
      g.startAngle = getAngle(e.touches[0], e.touches[1]);
      g.initialScale = item.scale;
      g.initialRotation = item.rotation;
      
      const mid = getMidpoint(e.touches[0], e.touches[1]);
      g.startX = mid.x;
      g.startY = mid.y;
    } else {
      g.isMultiTouch = false;
      g.startX = e.touches[0].clientX;
      g.startY = e.touches[0].clientY;
    }

    g.initialX = item.x;
    g.initialY = item.y;
    g.initialScale = item.scale;
    g.initialRotation = item.rotation;

    setGestureState(prev => ({
      ...prev,
      isDragging: true,
      isMultiTouch: g.isMultiTouch,
      activeItemId: itemId,
    }));

    haptic(5);
  }, [overlays, setOverlays, containerRef, haptic, onDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gestureState.isDragging || !gestureState.activeItemId || !containerRef.current) return;

    e.preventDefault();
    const container = containerRef.current.getBoundingClientRect();
    const g = gestureRef.current;
    const itemId = gestureState.activeItemId;
    
    // Mark as moved (not a tap)
    g.hasMoved = true;

    let newX: number, newY: number, newScale: number, newRotation: number;
    
    // Get current item for multi-touch that starts after initial touch
    const currentItem = overlays.find(o => o.id === itemId);
    if (!currentItem) return;

    if (e.touches.length >= 2) {
      // Multi-touch: simultaneous pan, pinch, rotate
      // If we just got a second finger, initialize multi-touch state
      if (!g.isMultiTouch) {
        g.isMultiTouch = true;
        g.startDist = getDistance(e.touches[0], e.touches[1]);
        g.startAngle = getAngle(e.touches[0], e.touches[1]);
        g.initialScale = currentItem.scale;
        g.initialRotation = currentItem.rotation;
        const mid = getMidpoint(e.touches[0], e.touches[1]);
        g.startX = mid.x;
        g.startY = mid.y;
        g.initialX = currentItem.x;
        g.initialY = currentItem.y;
        
        setGestureState(prev => ({ ...prev, isMultiTouch: true }));
      }
      
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const currentAngle = getAngle(e.touches[0], e.touches[1]);
      const mid = getMidpoint(e.touches[0], e.touches[1]);

      const scaleFactor = currentDist / g.startDist;
      newScale = Math.max(0.3, Math.min(5, g.initialScale * scaleFactor));
      newRotation = g.initialRotation + (currentAngle - g.startAngle);

      // Snap rotation
      for (const snapAngle of ROTATION_SNAP_ANGLES) {
        if (Math.abs(newRotation - snapAngle) < ROTATION_SNAP_THRESHOLD) {
          newRotation = snapAngle;
          if (!g.wasSnappedRotation) {
            haptic(15);
            g.wasSnappedRotation = true;
          }
          break;
        } else {
          g.wasSnappedRotation = false;
        }
      }

      const deltaX = (mid.x - g.startX) / container.width;
      const deltaY = (mid.y - g.startY) / container.height;
      newX = g.initialX + deltaX;
      newY = g.initialY + deltaY;

      if (newScale <= 0.31 || newScale >= 4.99) {
        haptic(20);
      }
    } else {
      // Single touch: pan only
      const touch = e.touches[0];
      const deltaX = (touch.clientX - g.startX) / container.width;
      const deltaY = (touch.clientY - g.startY) / container.height;
      
      newX = g.initialX + deltaX;
      newY = g.initialY + deltaY;
      newScale = currentItem.scale;
      newRotation = currentItem.rotation;
    }

    // Snap logic
    let snapH = false, snapV = false;
    let snapLeft = false, snapRight = false, snapTop = false, snapBottom = false;

    // Center snap
    const distFromCenterH = Math.abs(newX - 0.5);
    const distFromCenterV = Math.abs(newY - 0.5);
    
    if (distFromCenterH < SNAP_CENTER_THRESHOLD) {
      newX = 0.5;
      snapH = true;
      if (!g.wasSnappedH) {
        haptic(15);
        g.wasSnappedH = true;
      }
    } else {
      g.wasSnappedH = false;
    }

    if (distFromCenterV < SNAP_CENTER_THRESHOLD) {
      newY = 0.5;
      snapV = true;
      if (!g.wasSnappedV) {
        haptic(15);
        g.wasSnappedV = true;
      }
    } else {
      g.wasSnappedV = false;
    }

    // Edge snaps
    if (!snapH) {
      if (Math.abs(newX - EDGE_MARGIN) < SNAP_EDGE_THRESHOLD) {
        newX = EDGE_MARGIN;
        snapLeft = true;
        if (!g.wasSnappedLeft) {
          haptic(10);
          g.wasSnappedLeft = true;
        }
      } else {
        g.wasSnappedLeft = false;
      }
      
      if (Math.abs(newX - (1 - EDGE_MARGIN)) < SNAP_EDGE_THRESHOLD) {
        newX = 1 - EDGE_MARGIN;
        snapRight = true;
        if (!g.wasSnappedRight) {
          haptic(10);
          g.wasSnappedRight = true;
        }
      } else {
        g.wasSnappedRight = false;
      }
    }

    if (!snapV) {
      if (Math.abs(newY - EDGE_MARGIN) < SNAP_EDGE_THRESHOLD) {
        newY = EDGE_MARGIN;
        snapTop = true;
        if (!g.wasSnappedTop) {
          haptic(10);
          g.wasSnappedTop = true;
        }
      } else {
        g.wasSnappedTop = false;
      }
      
      if (Math.abs(newY - (TRASH_ZONE_START - 0.05)) < SNAP_EDGE_THRESHOLD && newY < TRASH_ZONE_START) {
        newY = TRASH_ZONE_START - 0.05;
        snapBottom = true;
        if (!g.wasSnappedBottom) {
          haptic(10);
          g.wasSnappedBottom = true;
        }
      } else {
        g.wasSnappedBottom = false;
      }
    }

    // Trash zone detection
    const inTrash = newY > TRASH_ZONE_START;
    const trashIntensity = inTrash 
      ? Math.min(1, (newY - TRASH_ZONE_START) / (TRASH_ZONE_DELETE - TRASH_ZONE_START))
      : 0;

    if (inTrash && trashIntensity > 0.5) {
      haptic(Math.floor(10 + trashIntensity * 30), 80);
    }

    // Update overlay
    setOverlays(prev => prev.map(o => 
      o.id === itemId 
        ? { ...o, x: newX, y: newY, scale: newScale, rotation: newRotation }
        : o
    ));

    setGestureState(prev => ({
      ...prev,
      showCenterGuideH: snapH,
      showCenterGuideV: snapV,
      showLeftGuide: snapLeft,
      showRightGuide: snapRight,
      showTopGuide: snapTop,
      showBottomGuide: snapBottom,
      isInTrashZone: inTrash,
      trashIntensity,
      isMultiTouch: e.touches.length >= 2,
    }));
  }, [gestureState.isDragging, gestureState.activeItemId, containerRef, overlays, setOverlays, haptic]);

  const handleTouchEnd = useCallback(() => {
    const itemId = gestureState.activeItemId;
    const g = gestureRef.current;
    
    if (itemId && gestureState.trashIntensity >= 0.8) {
      setOverlays(prev => prev.filter(o => o.id !== itemId));
      haptic([30, 40, 30, 40, 30]);
      onDelete?.(itemId);
    }

    // Reset multi-touch flag on touch end
    g.isMultiTouch = false;

    setGestureState({
      isDragging: false,
      isMultiTouch: false,
      activeItemId: null,
      showCenterGuideH: false,
      showCenterGuideV: false,
      isInTrashZone: false,
      trashIntensity: 0,
      showLeftGuide: false,
      showRightGuide: false,
      showTopGuide: false,
      showBottomGuide: false,
    });
  }, [gestureState.activeItemId, gestureState.trashIntensity, setOverlays, haptic, onDelete]);

  return {
    gestureState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
