import { useState, useCallback, useRef } from 'react';
import { useHaptic } from '@/hooks/useHaptic';

interface UseDragToDeleteOptions {
  trashZoneY: number;
  onDelete: () => void;
}

export function useDragToDelete({ trashZoneY, onDelete }: UseDragToDeleteOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const haptic = useHaptic();
  const deleteTriggered = useRef(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    deleteTriggered.current = false;
    haptic.light();
  }, [haptic]);

  const handleDrag = useCallback((clientY: number, containerHeight: number) => {
    const normalizedY = clientY / containerHeight;
    const isInTrashZone = normalizedY > 0.75;
    
    if (isInTrashZone !== isOverTrash) {
      setIsOverTrash(isInTrashZone);
      if (isInTrashZone) {
        haptic.medium();
      }
    }
  }, [isOverTrash, haptic]);

  const handleDragEnd = useCallback(() => {
    if (isOverTrash && !deleteTriggered.current) {
      deleteTriggered.current = true;
      haptic.heavy();
      onDelete();
    }
    
    setIsDragging(false);
    setIsOverTrash(false);
  }, [isOverTrash, onDelete, haptic]);

  return {
    isDragging,
    isOverTrash,
    handleDragStart,
    handleDrag,
    handleDragEnd,
  };
}
