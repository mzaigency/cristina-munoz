import { useState, useCallback, useRef } from 'react';

interface UseSwipeNavigationOptions {
  tabs: string[];
  currentTab: string;
  onTabChange: (tab: string) => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeNavigation({
  tabs,
  currentTab,
  onTabChange,
  threshold = 50,
  enabled = true
}: UseSwipeNavigationOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  // Si el gesto empieza dentro de un elemento con scroll horizontal propio
  // (grid de agenda, filas de chips/pills, tiras de KPIs), ese scroll gana:
  // cambiar de sección a la vez que se panea contenido es un misfire.
  const startedInHorizontalScroller = (target: EventTarget | null, boundary: HTMLElement): boolean => {
    let el = target instanceof HTMLElement ? target : null;
    while (el && el !== boundary) {
      if (el.scrollWidth > el.clientWidth + 1) {
        const ox = getComputedStyle(el).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
      el = el.parentElement;
    }
    return false;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    if (startedInHorizontalScroller(e.target, e.currentTarget as HTMLElement)) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || touchStartX.current === null || touchStartY.current === null) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Only consider horizontal swipes (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwiping.current = true;
    }
  }, [enabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || touchStartX.current === null || !isSwiping.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    const currentIndex = tabs.indexOf(currentTab);

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        onTabChange(tabs[currentIndex - 1]);
      } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        onTabChange(tabs[currentIndex + 1]);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [enabled, tabs, currentTab, onTabChange, threshold]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
