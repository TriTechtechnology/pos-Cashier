/**
 * useSlotManagement Hook - SIMPLIFIED UNIFIED SYSTEM
 *
 * PURPOSE: Direct access to unified slot system for home page functionality
 * - Clean, simple slot management
 * - Direct unified slot access (no wrapper complexity)
 * - Real-time timer updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Slot, OrderType } from '@/types/pos';
import { useUnifiedSlotStore, useUnifiedSlotsByType } from '@/lib/store/unified-slots';
import { UnifiedSlot } from '@/types/unified-pos';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';

// Consolidated slot state interface - NO DRAFT SECTION (PROFESSIONAL ARCHITECTURE)
interface SlotState {
  'dine-in': Slot[];
  'take-away': Slot[];
  delivery: Slot[];
}

// Selection state for swapping
interface SelectedSlot {
  index: number;
  section: keyof SlotState;
}

export const useSlotManagement = () => {
  // Selection state for swapping
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  // Direct unified slot access
  const unifiedSlotStore = useUnifiedSlotStore();
  const dineInSlots = useUnifiedSlotsByType('dine-in');
  const takeAwaySlots = useUnifiedSlotsByType('take-away');
  const deliverySlots = useUnifiedSlotsByType('delivery');

  // ORDER OVERLAY checking for draft status - use Zustand selector for reactivity
  const overlays = useOrderOverlayStore(state => state.overlays);

  // 🏆 PROFESSIONAL: Pure slot status - NO DYNAMIC DRAFT DETECTION
  // Draft indication comes from ORDER OVERLAYS separately, not slot status
  const getSafeSlotStatus = useCallback((unifiedSlot: UnifiedSlot): 'available' | 'processing' | 'completed' => {
    // Slots only store their actual operational status - never compute drafts
    return unifiedSlot.status as 'available' | 'processing' | 'completed';
  }, []);

  // 🚀 BULLETPROOF: Pre-compute draft slots with strict validation + slot cross-reference
  const draftSlotMap = useMemo(() => {
    const map = new Map<string, boolean>();
    try {
      // Get all current slots for validation
      const allSlots = Object.values(unifiedSlotStore.slots || {});

      Object.values(overlays || {}).forEach((order) => {
        // BULLETPROOF: Only mark as draft if ALL conditions are true:
        // 1. Order has a slotId reference
        // 2. Order status is explicitly 'active' (not completed/cancelled)
        // 3. Order is unpaid
        // 4. Order has items (not an empty shell)
        // 5. Slot exists and is either available OR has matching orderRefId
        if (order.slotId &&
            order.status === 'active' &&  // ⬅️ STRICT: Must be explicitly active
            order.paymentStatus !== 'paid' &&
            order.items && order.items.length > 0) {  // ⬅️ Must have items

          // 🎯 PRODUCTION SAFETY: Verify slot exists and is valid
          const slot = allSlots.find(s => s.id === order.slotId);
          if (slot && (slot.status === 'available' || slot.orderRefId === order.id)) {
            map.set(order.slotId, true);
          }
          // If slot doesn't exist or has different orderRefId, ignore this order (orphaned)
        }
      });
    } catch (error) {
      // Silent error handling for performance
      console.error('❌ [DRAFT DETECTION] Error computing draft slots:', error);
    }
    return map;
  }, [overlays, unifiedSlotStore.slots]);

  // Draft lookup now done directly via draftSlotMap.has(slotId) - no function needed


  // 🏆 PROFESSIONAL: No draft store needed - using single source of truth (ORDER OVERLAYS)

  // Convert UnifiedSlot to Slot for compatibility
  const convertToSlot = useCallback((unifiedSlot: UnifiedSlot): Slot => ({
    id: unifiedSlot.id,
    number: unifiedSlot.number,
    orderType: unifiedSlot.orderType,
    status: unifiedSlot.status,
    isActive: unifiedSlot.isActive,
    startTime: unifiedSlot.startTime,
    timeStatus: unifiedSlot.timeStatus,
    elapsedTime: unifiedSlot.elapsedTime,
    customerCount: unifiedSlot.customerCount,
    // Order reference only (order data is in Order Overlay Store)
    orderId: unifiedSlot.orderRefId,
    customerName: undefined, // → Use Order Overlay Store
    orderDetails: undefined, // → Use Order Overlay Store
    orderTotal: undefined,   // → Use Order Overlay Store
    orderCustomer: undefined, // → Use Order Overlay Store
    paymentMethod: unifiedSlot.paymentMethod,
    paymentStatus: unifiedSlot.paymentStatus,
    specialInstructions: undefined, // → Use Order Overlay Store
    createdAt: unifiedSlot.createdAt,
    updatedAt: unifiedSlot.updatedAt,
    syncedAt: undefined // Not needed
  }), []);


  // No state needed - use processedSlots directly

  // No overlay count needed - draftSlotMap handles change detection efficiently

  // 🏆 PROFESSIONAL: Fast slot processing with separate draft indication
  const processedSlots = useMemo(() => {
    const convertSlot = (unifiedSlot: UnifiedSlot) => {
      const slotStatus = getSafeSlotStatus(unifiedSlot);

      // 🚀 FAST: Direct map lookup instead of function call
      const hasDraft = draftSlotMap.has(unifiedSlot.id);
      const displayStatus = (slotStatus === 'available' && hasDraft) ? 'draft' : slotStatus;

      // 🎯 BULLETPROOF: For draft slots, find the overlay ID from overlays
      let orderId = unifiedSlot.orderRefId;
      if (displayStatus === 'draft' && !orderId) {
        // Find the draft overlay for this slot
        const draftOverlay = Object.values(overlays || {}).find(o =>
          o.slotId === unifiedSlot.id &&
          o.status === 'active' &&
          o.paymentStatus !== 'paid' &&
          o.items && o.items.length > 0
        );
        if (draftOverlay) {
          orderId = draftOverlay.id;
        }
      }

      return {
        id: unifiedSlot.id,
        number: unifiedSlot.number,
        orderType: unifiedSlot.orderType,
        status: displayStatus, // UI display status includes draft
        isActive: unifiedSlot.isActive,
        startTime: unifiedSlot.startTime,
        timeStatus: unifiedSlot.timeStatus,
        elapsedTime: unifiedSlot.elapsedTime,
        customerCount: unifiedSlot.customerCount,
        orderId: orderId, // Now includes overlay ID for drafts
        customerName: undefined,
        orderDetails: undefined,
        orderTotal: undefined,
        orderCustomer: undefined,
        paymentMethod: unifiedSlot.paymentMethod,
        paymentStatus: unifiedSlot.paymentStatus,
        specialInstructions: undefined,
        createdAt: unifiedSlot.createdAt,
        updatedAt: unifiedSlot.updatedAt,
        syncedAt: undefined
      };
    };

    return {
      'dine-in': (dineInSlots || []).map(convertSlot),
      'take-away': (takeAwaySlots || []).map(convertSlot),
      delivery: (deliverySlots || []).map(convertSlot)
    } as SlotState;
  }, [dineInSlots, takeAwaySlots, deliverySlots, draftSlotMap, getSafeSlotStatus]);

  // 🚀 PERFORMANCE: Debug logging removed to prevent excessive console output

  // 🚀 PERFORMANCE: Manual refresh only when needed (not on every timer tick)
  const refetchSlots = useCallback(async () => {
    // Timers update automatically via global timer - manual refresh not needed
    // This function kept for compatibility but optimized to do nothing
  }, []);

  // Initialize slots on mount - optimized to run only once
  useEffect(() => {
    refetchSlots();
  }, []);

  // Ensure fresh data when tab gains visibility (returning from payment)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetchSlots();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refetchSlots]);

  // Handle slot selection for swapping
  const handleSelect = useCallback((index: number, section: keyof SlotState) => {
    if (index === -1) {
      console.log('🔄 [SELECT] Deselecting slot');
      setSelectedSlot(null);
    } else {
      console.log('✅ [SELECT] Slot selected:', { index, section });
      setSelectedSlot({ index, section });
    }
  }, []);

  // HOME PAGE: REPOSITION ONLY (insert & push display order)
  const handleSwap = useCallback(async (fromIndex: number, toIndex: number, section: keyof SlotState) => {
    console.log('🔄 [REPOSITION] Home page swap:', { fromIndex, toIndex, section });

    if (fromIndex === toIndex) {
      setSelectedSlot(null);
      return;
    }

    const sectionSlots = processedSlots[section];
    if (!sectionSlots) {
      setSelectedSlot(null);
      return;
    }

    const fromSlot = sectionSlots[fromIndex];

    // Only processing orders can be repositioned
    if (fromSlot.status !== 'processing') {
      console.log('❌ Only processing orders can reposition');
      setSelectedSlot(null);
      return;
    }

    try {
      // SIMPLE: Just reorder display (insert & push)
      console.log('🔄 Repositioning display order');
      await unifiedSlotStore.reorderSlots(fromSlot.id, toIndex, fromSlot.orderType);
      console.log('✅ Reposition done');
    } catch (error) {
      console.error('❌ Reposition failed:', error);
    }

    setSelectedSlot(null);
  }, [processedSlots, unifiedSlotStore]);

  // Handle slot deletion - only allow deleting the last slot in each section
  const handleDeleteSlot = useCallback(async (slotId: string, section: keyof SlotState) => {
    try {
      const sectionSlots = processedSlots[section];
      if (!sectionSlots) return false;
      const slotIndex = sectionSlots.findIndex(slot => slot.id === slotId);

      // Only allow deletion of the last slot in the section
      if (slotIndex !== sectionSlots.length - 1) {
        return false;
      }

      // Only allow deletion of available slots (not processing orders)
      const slot = sectionSlots[slotIndex];
      if (slot.status !== 'available') {
        return false;
      }

      await unifiedSlotStore.removeSlot(slotId);
      setSelectedSlot(null);
      await refetchSlots();
      return true;
    } catch (error) {
      console.error('Failed to delete slot:', error);
      return false;
    }
  }, [processedSlots, unifiedSlotStore, refetchSlots]);

  // Find available slot for order type
  const findAvailableSlot = useCallback((orderType: OrderType) => {
    const availableSlot = unifiedSlotStore.findAvailableSlot(orderType);
    return availableSlot ? convertToSlot(availableSlot) : null;
  }, [unifiedSlotStore, convertToSlot]);

  return {
    slots: processedSlots,
    selectedSlot,
    loading: unifiedSlotStore.loading,
    handleSelect,
    handleSwap,
    handleDeleteSlot,
    findAvailableSlot,
    refetchSlots,
    // Expose slot actions for CRUD operations (direct access)
    setProcessing: unifiedSlotStore.setSlotProcessing,
    setAvailable: unifiedSlotStore.setSlotAvailable,
    setCompleted: unifiedSlotStore.setSlotCompleted,
    // Dynamic slot creation (direct access)
    createNewSlot: unifiedSlotStore.createDynamicSlot
  };
};