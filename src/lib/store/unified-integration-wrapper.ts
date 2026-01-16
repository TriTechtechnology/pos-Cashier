/**
 * PHASE 1 INTEGRATION WRAPPER - OVERLAY-FIRST ARCHITECTURE 🚀
 *
 * PURPOSE: Bridge between old slot patterns and new clean architecture
 * - Slots = Pure UI state (status, timers, references)
 * - Order data queries redirect to Order Overlay Store
 * - Backward compatible interface for zero breaking changes
 * - Lightning-fast performance with minimal overhead
 */

import { useMemo } from 'react';
import { useUnifiedSlotStore, useUnifiedSlot, useUnifiedSlotsByType } from './unified-slots';
import { OrderType } from '@/types/pos';
import { UnifiedSlot } from '@/types/unified-pos';

// Note: convertUnifiedToLegacyWithOverlay removed - use Order Overlay hooks directly for data

/**
 * Synchronous conversion (UI state only - for React hooks)
 */
const convertUnifiedToLegacySync = (unifiedSlot: UnifiedSlot) => {
  return {
    ...unifiedSlot,
    // Legacy fields point to orderRefId (components should use Order Overlay hooks)
    orderId: unifiedSlot.orderRefId,
    customerName: undefined, // → Use useOrderOverlay hook
    orderDetails: undefined, // → Use useOrderOverlay hook
    orderTotal: undefined,   // → Use useOrderOverlay hook
    orderCustomer: undefined, // → Use useOrderOverlay hook
    specialInstructions: undefined, // → Use useOrderOverlay hook
    syncedAt: undefined
  };
};

/**
 * Legacy hook for getting single slot (UI state only)
 * For order data, use useOrderOverlay hook instead
 */
export const useSafeSlot = (slotId: string) => {
  const unifiedSlot = useUnifiedSlot(slotId);
  return useMemo(() => {
    return unifiedSlot ? convertUnifiedToLegacySync(unifiedSlot) : null;
  }, [unifiedSlot]);
};

/**
 * Legacy hook alias for getting single slot
 */
export const useSafeGetSlot = (slotId: string) => {
  return useSafeSlot(slotId);
};

/**
 * Simple slot actions that directly use unified system
 */
export const useSafeSlotActions = () => {
  const store = useUnifiedSlotStore();

  return useMemo(() => ({
    // Direct access to unified system functions
    createDynamicSlot: store.createDynamicSlot,
    setSlotProcessing: store.setSlotProcessing,
    setSlotAvailable: store.setSlotAvailable,
    setSlotCompleted: store.setSlotCompleted,
    removeSlot: store.removeSlot,
    reorderSlots: store.reorderSlots,
    computeTimers: store.computeTimers,
    findAvailableSlot: store.findAvailableSlot
  }), [store]);
};

/**
 * Simple hook for getting slots by type (UI state only)
 * For order data, components should use Order Overlay hooks
 */
export const useSafeSlotsByType = (orderType: OrderType) => {
  const unifiedSlots = useUnifiedSlotsByType(orderType);

  return useMemo(() => {
    return unifiedSlots?.map(convertUnifiedToLegacySync) || [];
  }, [unifiedSlots]);
};