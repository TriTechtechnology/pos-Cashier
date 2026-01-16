/**
 * ClientProvider Component - SIMPLIFIED UNIFIED SYSTEM
 *
 * PURPOSE: Simple provider that initializes only the unified slot system
 * - No complex dual system logic
 * - Clean unified slot initialization
 * - Simple cart store rehydration
 */

'use client';

import { useEffect } from 'react';
import { useUnifiedSlotStore, startUnifiedSlotTimer, stopUnifiedSlotTimer } from '@/lib/store/unified-slots';
import syncService from '@/lib/services/syncService';
import { logger } from '@/lib/utils/logger';
// Cart store import removed - using in-memory only approach
import { ManagerPinProvider } from './ManagerPinProvider';

interface ClientProviderProps {
  children: React.ReactNode;
}

export const ClientProvider = ({ children }: ClientProviderProps) => {
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize cart store (cart store doesn't use persistence to avoid hydration issues)
      try {
        // Cart store is in-memory only for bulletproof architecture
        logger.debug('Cart store initialized (in-memory only)');
      } catch (error) {
        logger.error('Failed to initialize cart store', error);
      }

      // Initialize unified slot system
      try {
        const initializeUnifiedSlots = useUnifiedSlotStore.getState().initialize;
        await initializeUnifiedSlots();
        logger.debug('Unified slot system initialized');
      } catch (error) {
        logger.error('Failed to initialize unified slots', error);
      }

      // Start slot timers
      try {
        startUnifiedSlotTimer();
        logger.debug('Slot timers started');
      } catch (error) {
        logger.error('Failed to start unified slot timer', error);
      }

      // ⚠️ AUTO-SYNC DISABLED - Manual sync only via Settings button
      // Cashiers must manually sync paid orders before closing till
      // This prevents duplicate syncs and gives cashiers control
      logger.debug('Auto-sync disabled - manual sync only');

      // Perform daily cleanup on app startup
      try {
        await syncService.performDailyCleanup();
        logger.debug('Daily cleanup completed');
      } catch (error) {
        logger.error('Failed to perform daily cleanup', error);
      }

      logger.info('Client Provider initialized successfully');
    };

    initializeApp();

    // CRITICAL: Cleanup on component unmount to prevent memory leaks
    return () => {
      logger.debug('Client Provider unmounting - cleaning up resources');

      // Stop timer interval to prevent memory leak
      try {
        stopUnifiedSlotTimer();
        logger.debug('Slot timers stopped');
      } catch (error) {
        logger.error('Failed to stop slot timers', error);
      }

      // Auto-sync is disabled, no cleanup needed
      logger.debug('No auto-sync to stop');
    };
  }, []); // No dependencies needed since we're using getState() inside

  return (
    <ManagerPinProvider>
      {children}
    </ManagerPinProvider>
  );
};