/**
 * Current Time Hook
 * 
 * PURPOSE: Professional time management hook that prevents excessive re-renders
 * and provides optimized time updates for header components.
 * 
 * FEATURES:
 * - Bulletproof interval management with cleanup
 * - Optimized update frequency (1 second for seconds, 1 minute for time-only)
 * - Prevents maximum update depth exceeded errors
 * - SSR-safe initialization
 * 
 * USAGE:
 * const currentTime = useCurrentTime(); // Updates every second
 * const currentTime = useCurrentTime(60000); // Updates every minute
 */

import { useState, useEffect, useRef } from 'react';

interface UseCurrentTimeOptions {
  updateInterval?: number; // milliseconds
  enabled?: boolean;
}

export const useCurrentTime = (options: UseCurrentTimeOptions = {}) => {
  const { 
    updateInterval = 1000, // Default to 1 second
    enabled = true 
  } = options;
  
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!enabled) {
      return;
    }

    // Professional interval management
    const startInterval = () => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set initial time
      if (mountedRef.current) {
        setCurrentTime(new Date());
      }

      // Start new interval
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          setCurrentTime(new Date());
        }
      }, updateInterval);
    };

    startInterval();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateInterval, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return currentTime;
};

// Specialized hooks for common use cases
export const useHeaderTime = () => {
  // Update every second for live time display
  return useCurrentTime({ updateInterval: 1000 });
};

export const useMinuteTime = () => {
  // Update every minute for less frequent updates
  return useCurrentTime({ updateInterval: 60000 });
};