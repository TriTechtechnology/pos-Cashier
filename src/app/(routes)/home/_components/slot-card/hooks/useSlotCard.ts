/**
 * useSlotCard Hook
 * 
 * PURPOSE: Custom hook for slot card state management, animations, and interactions.
 * Home page specific hook for slot card functionality.
 * 
 * LINKS WITH:
 * - SlotCard: Main slot card component that uses this hook
 * - Slot type: Defines slot data structure
 * - getThemeStyles: Theme-based styling utility
 * 
 * WHY: Home page specific hook moved to _hooks directory following
 * the established pattern. Keeps all home page logic organized.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Slot } from '@/types/pos';
import { getThemeStyles } from '@/lib/utils/theme';
import { useSettingsStore } from '@/lib/store/settings';

interface UseSlotCardProps {
  slot: Slot;
  index: number;
  isSelected: boolean;
  selectedIndex: number | null | undefined;
  onSelect: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onClick?: (slot: Slot) => void;
  isCompact?: boolean;
}

export const useSlotCard = ({
  slot,
  index,
  isSelected,
  selectedIndex,
  onSelect,
  isCompact = false
}: Omit<UseSlotCardProps, 'onSwap' | 'onClick'>) => {
  const [isPressed, setIsPressed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const justSelectedRef = useRef(false);

  // Memoize expensive calculations
  const cardHeight = useMemo(() => isCompact ? 'h-20' : 'h-24', [isCompact]);
  const iconSize = useMemo(() => isCompact ? 'w-3 h-3' : 'w-4 h-4', [isCompact]);
  const textSize = useMemo(() => isCompact ? 'text-xs' : 'text-sm', [isCompact]);
  const padding = useMemo(() => isCompact ? 'p-2' : 'p-3', [isCompact]);

  // Memoize theme styles to prevent recalculation
  const themeStyles = useMemo(() => getThemeStyles(), []);

  // Memoize border styling based on selection state
  const borderStyling = useMemo(() => {
    // If processing order, don't apply full border to allow timer border to show
    if (slot.status === 'processing') {
      if (isSelected) {
        // Selected processing tile - use theme primary color border but exclude right border
        return '!border-t-2 !border-l-2 !border-b-2 !border-primary !ring-2 !ring-primary/30';
      } else if (selectedIndex !== null && selectedIndex !== index) {
        // Other tiles when swap mode is active - use dotted border for processing slots
        return '!border-t-2 !border-l-2 !border-b-2 !border-solid !border-primary/30';
      } else {
        // Normal processing state - use default border but exclude right border
        return '!border-t-2 !border-l-2 !border-b-2 !border-solid !border-border';
      }
    } else {
      // Non-processing orders - use full border
      if (isSelected) {
        // Selected tile - use theme primary color border
        return '!border-2 !border-primary !ring-2 !ring-primary/30';
      } else if (selectedIndex !== null && selectedIndex !== index) {
        // Other tiles when swap mode is active - use dotted border for empty slots
        return slot.status === 'available' ? '!border-2 !border-dashed !border-primary/40' : '!border-2 !border-solid !border-primary/30';
      } else {
        // Normal state - use default border
        return slot.status === 'available' ? '!border-2 !border-dashed !border-border' : '!border-2 !border-solid !border-border';
      }
    }
  }, [isSelected, selectedIndex, index, slot.status]);

  const { orderTiming } = useSettingsStore();

  // Memoize timer border class
  const timerBorderClass = useMemo(() => {
    if (slot.status !== 'processing') return '';

    const elapsedMinutes = slot.startTime
      ? Math.floor((currentTime.getTime() - slot.startTime.getTime()) / 60000)
      : 0;

    if (elapsedMinutes >= orderTiming.criticalThreshold) { // Default 40
      return 'timer-border-red';
    } else if (elapsedMinutes >= orderTiming.warningThreshold) { // Default 15
      return 'timer-border-yellow';
    } else {
      return 'timer-border-green';
    }
  }, [slot.status, slot.startTime, currentTime, orderTiming.criticalThreshold, orderTiming.warningThreshold]);

  // Memoize current timer
  const currentTimer = useMemo(() => {
    if (!slot.startTime) return '00:00';

    const elapsed = Math.floor((currentTime.getTime() - slot.startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [slot.startTime, currentTime]);

  // Optimized timer interval - only for processing orders
  useEffect(() => {
    if (slot.status === 'processing' && slot.startTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [slot.status, slot.startTime?.getTime()]);

  // Global click handler removed - deselection now handled in slot-card click handler
  // This prevents conflict with hold-to-select functionality

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  // Touch event handlers optimized for tablet
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    holdTimerRef.current = setTimeout(() => {
      justSelectedRef.current = true;
      onSelect(index);
      // Keep selected for 1 second to prevent instant deselection
      setTimeout(() => {
        justSelectedRef.current = false;
      }, 1000);
    }, 1000);
  }, [onSelect, index]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    holdTimerRef.current = setTimeout(() => {
      justSelectedRef.current = true;
      onSelect(index);
      // Keep selected for 1 second to prevent instant deselection
      setTimeout(() => {
        justSelectedRef.current = false;
      }, 1000);
    }, 1000);
  }, [onSelect, index]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  return {
    isPressed,
    currentTime,
    cardHeight,
    iconSize,
    textSize,
    padding,
    themeStyles,
    borderStyling,
    timerBorderClass,
    currentTimer,
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    justSelectedRef
  };
};
