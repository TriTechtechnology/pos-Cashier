/**
 * UNIFIED SLOT STORE - SIMPLE & BULLETPROOF
 *
 * PURPOSE: Single, simple slot management system with Dexie IndexedDB persistence
 * - Clean interface with no duplicates
 * - Bulletproof offline-first operation
 * - Simple state transitions
 */

import { create } from 'zustand';
import Dexie, { Table } from 'dexie';
import { UnifiedSlot } from '@/types/unified-pos';
import { OrderType, TimeStatus } from '@/types/pos';

interface UnifiedSlotStore {
  // State
  slots: Record<string, UnifiedSlot>;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  getSlot: (slotId: string) => UnifiedSlot | null;
  getSlotsByType: (orderType: OrderType) => UnifiedSlot[];
  findAvailableSlot: (orderType: OrderType) => UnifiedSlot | null;

  // Slot lifecycle - UI state only
  setSlotProcessing: (slotId: string, orderRefData: {
    orderRefId: string;
    paymentMethod: string;
    paymentStatus?: 'paid' | 'unpaid';
  }) => Promise<void>;
  setSlotAvailable: (slotId: string) => Promise<void>;
  setSlotCompleted: (slotId: string) => Promise<void>;

  // Management
  createDynamicSlot: (orderType: OrderType) => Promise<UnifiedSlot>;
  removeSlot: (slotId: string) => Promise<void>;
  reorderSlots: (fromSlotId: string, toPosition: number, orderType: OrderType) => Promise<void>;
  autoAdjustSlotOrder: (orderType: OrderType) => Promise<void>;
  transferOrderToSlot: (sourceSlotId: string, targetSlotId: string) => Promise<void>;

  // Timers
  computeTimers: () => void;
}

// Dexie Database Configuration
class PosSlotDatabase extends Dexie {
  slots!: Table<UnifiedSlot>;

  constructor() {
    super('PosSlotDatabase');
    this.version(1).stores({
      slots: 'id, orderType, status, number, *tags'
    });
  }
}

// Initialize DB only on client-side
let db: PosSlotDatabase | null = null;

const getDB = (): PosSlotDatabase | null => {
  if (typeof window === 'undefined') return null;
  if (!db) {
    db = new PosSlotDatabase();
  }
  return db;
};

// CRITICAL: Mutex lock to prevent race conditions during initialization
let initializationLock = false;
let initializationPromise: Promise<void> | null = null;

// Dexie operations with error handling
const saveSlotToDB = async (slot: UnifiedSlot): Promise<void> => {
  const database = getDB();
  if (!database) return;

  try {
    await database.slots.put(slot);
  } catch (error) {
    console.error('❌ [DB] Failed to save slot:', error);
  }
};

const deleteSlotFromDB = async (slotId: string): Promise<void> => {
  const database = getDB();
  if (!database) return;

  try {
    await database.slots.delete(slotId);
  } catch (error) {
    console.error('❌ [DB] Failed to delete slot:', error);
  }
};

const loadSlotsFromDB = async (): Promise<Record<string, UnifiedSlot>> => {
  const database = getDB();
  if (!database) return {};

  try {
    const slots = await database.slots.toArray();
    const slotsRecord: Record<string, UnifiedSlot> = {};
    slots.forEach(slot => {
      slotsRecord[slot.id] = slot;
    });
    return slotsRecord;
  } catch (error) {
    console.error('❌ [DB] Failed to load slots:', error);
    return {};
  }
};

// Timer utility
const computeTimerStatus = (startTime: Date): { elapsedTime: string; timeStatus: TimeStatus } => {
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  let timeStatus: TimeStatus = 'fresh';
  if (minutes >= 15) timeStatus = 'overdue';
  else if (minutes >= 10) timeStatus = 'warning';

  return { elapsedTime, timeStatus };
};

// Create initial slots for each type
const createInitialSlots = (): Record<string, UnifiedSlot> => {
  const slots: Record<string, UnifiedSlot> = {};
  const now = new Date();

  // Create 8 dine-in slots (D1-D8)
  for (let i = 1; i <= 8; i++) {
    const id = `D${i}`;
    slots[id] = {
      id,
      number: i.toString(),
      orderType: 'dine-in',
      status: 'available',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  }

  // Create 3 take-away slots (T1-T3)
  for (let i = 1; i <= 3; i++) {
    const id = `T${i}`;
    slots[id] = {
      id,
      number: i.toString(),
      orderType: 'take-away',
      status: 'available',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  }

  // Create 3 delivery slots (DL1-DL3)
  for (let i = 1; i <= 3; i++) {
    const id = `DL${i}`;
    slots[id] = {
      id,
      number: i.toString(),
      orderType: 'delivery',
      status: 'available',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  }

  return slots;
};

// Store implementation
export const useUnifiedSlotStore = create<UnifiedSlotStore>((set, get) => ({
  slots: {},
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    // CRITICAL: Prevent concurrent initialization (race condition protection)
    if (initializationLock) {
      console.warn('⚠️ [SLOT INIT] Initialization already in progress, waiting...');
      // Wait for ongoing initialization to complete
      if (initializationPromise) {
        await initializationPromise;
      }
      return;
    }

    // Acquire lock
    initializationLock = true;

    // Create promise that other calls can await
    initializationPromise = (async () => {
      // Silent initialization for performance
      set({ loading: true, error: null });

      try {
      // Try to load existing slots from IndexedDB
      const existingSlots = await loadSlotsFromDB();

      if (Object.keys(existingSlots).length > 0) {
        // 🎯 BULLETPROOF: Load overlays DIRECTLY from IndexedDB (not Zustand state)
        // This avoids race conditions with Zustand state updates
        const { default: Dexie } = await import('dexie');
        class OrderOverlayDB extends Dexie {
          overlays!: Dexie.Table<any, string>;
          constructor() {
            super('OrderOverlayDB');
            this.version(1).stores({
              overlays: 'id, slotId, orderType, paymentStatus, paymentMethod, status, orderDate, syncStatus'
            });
          }
        }
        const overlayDB = new OrderOverlayDB();
        const allOverlays = await overlayDB.overlays.toArray();
        const overlayMap = new Map(allOverlays.map(o => [o.id, o]));

        console.log(`🔍 [SLOT INIT] Loaded ${allOverlays.length} overlays from IndexedDB for validation`);

        const cleanedSlots: Record<string, UnifiedSlot> = {};
        for (const [slotId, slot] of Object.entries(existingSlots)) {
          // If slot has orderRefId, verify it still exists and is actively processing
          if (slot.orderRefId && slot.status === 'processing') {
            const overlay = overlayMap.get(slot.orderRefId);

            // 🎯 BULLETPROOF: Only clear slot if overlay doesn't exist at all
            // OR if overlay is completed (order finished, slot should be available)
            if (!overlay) {
              console.log(`🧹 [SLOT INIT] Clearing slot ${slotId} - overlay ${slot.orderRefId} not found`);
              cleanedSlots[slotId] = {
                ...slot,
                status: 'available',
                orderRefId: undefined,
                paymentStatus: undefined,
                paymentMethod: undefined,
                startTime: undefined,
                elapsedTime: undefined,
                timeStatus: undefined,
                updatedAt: new Date()
              };
              // Update IndexedDB with cleaned slot
              await saveSlotToDB(cleanedSlots[slotId]);
            } else if (overlay.status === 'completed') {
              // Overlay completed - clear slot reference
              console.log(`🧹 [SLOT INIT] Clearing slot ${slotId} - overlay ${slot.orderRefId} is completed`);
              cleanedSlots[slotId] = {
                ...slot,
                status: 'available',
                orderRefId: undefined,
                paymentStatus: undefined,
                paymentMethod: undefined,
                startTime: undefined,
                elapsedTime: undefined,
                timeStatus: undefined,
                updatedAt: new Date()
              };
              // Update IndexedDB with cleaned slot
              await saveSlotToDB(cleanedSlots[slotId]);
            } else {
              // Overlay exists and is active - keep slot processing
              console.log(`✅ [SLOT INIT] Keeping slot ${slotId} - overlay ${slot.orderRefId} is active (status: ${overlay.status}, payment: ${overlay.paymentStatus})`);
              cleanedSlots[slotId] = slot;
            }
          } else {
            // Slot is available or has no orderRefId - keep as is
            cleanedSlots[slotId] = slot;
          }
        }

        // 🏆 PRODUCTION SAFE: Set slots loaded - NO automatic cleanup on init
        // Cleanup is too risky during initialization (race conditions, timing issues)
        // Let the system self-heal naturally through slot validation loop above
        set({ slots: cleanedSlots, loading: false, initialized: true });
      } else {
        // Create initial slots if none exist
        const slots = createInitialSlots();

        // Save initial slots to IndexedDB
        for (const slot of Object.values(slots)) {
          await saveSlotToDB(slot);
        }

        set({ slots, loading: false, initialized: true });
        // Silent slot creation for performance
      }

        // Silent slot ID logging for performance
      } catch (error) {
        console.error('❌ [UNIFIED] Initialization failed:', error);
        set({ error: 'Failed to initialize slots', loading: false });
      } finally {
        // CRITICAL: Always release lock, even on error
        initializationLock = false;
        initializationPromise = null;
      }
    })();

    // Await the initialization
    await initializationPromise;
  },

  getSlot: (slotId: string) => {
    const { slots } = get();
    return slots[slotId] || null;
  },

  getSlotsByType: (orderType: OrderType) => {
    const { slots } = get();
    return Object.values(slots).filter(slot => slot.orderType === orderType);
  },

  findAvailableSlot: (orderType: OrderType) => {
    const { slots } = get();
    return Object.values(slots).find(slot =>
      slot.orderType === orderType && slot.status === 'available'
    ) || null;
  },

  setSlotProcessing: async (slotId: string, orderRefData) => {
    const { slots } = get();
    const existingSlot = slots[slotId];

    if (!existingSlot) {
      console.error('❌ [UNIFIED] Slot not found:', slotId);
      return;
    }

    const now = new Date();
    const updatedSlot: UnifiedSlot = {
      ...existingSlot,
      status: 'processing',
      paymentStatus: orderRefData.paymentStatus || 'unpaid',
      paymentMethod: orderRefData.paymentMethod,
      startTime: now,
      elapsedTime: '00:00',
      timeStatus: 'fresh',
      updatedAt: now,
      orderRefId: orderRefData.orderRefId
    };

    const newSlots = { ...slots, [slotId]: updatedSlot };
    set({ slots: newSlots });

    // Save to IndexedDB
    await saveSlotToDB(updatedSlot);

    // Silent slot processing for performance
  },

  setSlotAvailable: async (slotId: string) => {
    const { slots } = get();
    const existingSlot = slots[slotId];

    if (!existingSlot) {
      console.warn('⚠️ [SLOT AVAILABLE] Slot not found:', slotId);
      return;
    }

    console.log('🧹 [SLOT AVAILABLE] Clearing slot:', slotId, 'current orderRefId:', existingSlot.orderRefId);

    const updatedSlot: UnifiedSlot = {
      ...existingSlot,
      status: 'available',
      paymentStatus: undefined,
      paymentMethod: undefined,
      startTime: undefined,
      elapsedTime: undefined,
      timeStatus: undefined,
      orderRefId: undefined, // Clear order reference - slot becomes truly empty
      updatedAt: new Date()
    };

    let newSlots = { ...slots, [slotId]: updatedSlot };
    set({ slots: newSlots });

    // Save to IndexedDB
    await saveSlotToDB(updatedSlot);

    // 🔄 AUTO-ADJUST: Reorder slots after completion to maintain sequential order
    // Available slots should be grouped together
    await get().autoAdjustSlotOrder(existingSlot.orderType);

    console.log('✅ [SLOT AVAILABLE] Slot cleared and auto-adjusted:', slotId);
  },

  setSlotCompleted: async (slotId: string) => {
    // Silent slot completion for performance
    // Completed orders immediately become available for next customer
    const { setSlotAvailable } = get();
    await setSlotAvailable(slotId);
    // Silent slot completion for performance
  },

  createDynamicSlot: async (orderType: OrderType) => {
    const { slots } = get();
    const existingSlots = Object.values(slots).filter(s => s.orderType === orderType);
    const nextNumber = existingSlots.length + 1;

    let id: string;
    if (orderType === 'dine-in') id = `D${nextNumber}`;
    else if (orderType === 'take-away') id = `T${nextNumber}`;
    else id = `DL${nextNumber}`;

    const now = new Date();
    const newSlot: UnifiedSlot = {
      id,
      number: nextNumber.toString(),
      orderType,
      status: 'available',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const newSlots = { ...slots, [id]: newSlot };
    set({ slots: newSlots });

    // Save to IndexedDB
    await saveSlotToDB(newSlot);

    // Silent slot creation for performance
    return newSlot;
  },

  removeSlot: async (slotId: string) => {
    const { slots } = get();
    const { [slotId]: removed, ...remainingSlots } = slots;

    set({ slots: remainingSlots });

    // Remove from IndexedDB
    await deleteSlotFromDB(slotId);

    // Silent slot removal for performance
  },

  reorderSlots: async (fromSlotId: string, toPosition: number, orderType: OrderType) => {
    const { slots } = get();
    const slotToMove = slots[fromSlotId];

    // Validate slot exists
    if (!slotToMove) {
      console.error('❌ [REORDER] Slot not found:', fromSlotId);
      return;
    }

    // 🎯 CRITICAL: Only allow repositioning of PROCESSING slots
    if (slotToMove.status !== 'processing') {
      console.warn('⚠️ [REORDER] Cannot reorder non-processing slot:', fromSlotId, 'status:', slotToMove.status);
      return;
    }

    // Get all slots of the same type, sorted by number
    const slotsOfType = Object.values(slots)
      .filter(s => s.orderType === orderType)
      .sort((a, b) => parseInt(a.number) - parseInt(b.number));

    const fromIndex = slotsOfType.findIndex(s => s.id === fromSlotId);
    if (fromIndex === -1) return;

    // Validate toPosition
    if (toPosition < 0 || toPosition >= slotsOfType.length) {
      console.error('❌ [REORDER] Invalid position:', toPosition);
      return;
    }

    // No change needed
    if (fromIndex === toPosition) return;

    // 🚀 INSERT-AND-PUSH STRATEGY: Move processing slot, others maintain order
    const [movedSlot] = slotsOfType.splice(fromIndex, 1);
    slotsOfType.splice(toPosition, 0, movedSlot);

    // 🎯 CRITICAL: Only update 'number' property (display order), keep 'id' unchanged
    const updatedSlots = { ...slots };

    slotsOfType.forEach((slot, index) => {
      const newNumber = (index + 1).toString();

      // Only update if number changed (display order changed)
      if (slot.number !== newNumber) {
        updatedSlots[slot.id] = {
          ...slot,
          number: newNumber, // Update display order only, keep ID unchanged
          updatedAt: new Date()
        };

        // Save updated slot to DB
        saveSlotToDB(updatedSlots[slot.id]);
      }
    });

    // Update Zustand state
    set({ slots: updatedSlots });

    console.log('✅ [REORDER] Slots repositioned (IDs preserved, display order updated):', {
      from: fromSlotId,
      fromPosition: fromIndex + 1,
      toPosition: toPosition + 1,
      orderType
    });
  },

  autoAdjustSlotOrder: async (orderType: OrderType) => {
    const { slots } = get();

    // Get all slots of the same type
    const slotsOfType = Object.values(slots)
      .filter(s => s.orderType === orderType)
      .sort((a, b) => parseInt(a.number) - parseInt(b.number));

    // 🎯 SMART ORDERING: Processing slots first, then available slots
    // This keeps active orders visible at the top
    const availableSlots = slotsOfType.filter(s => s.status === 'available');
    const processingSlots = slotsOfType.filter(s => s.status === 'processing');

    // If all slots are already in correct order (processing first), skip
    const needsReordering = slotsOfType.some((slot, index) => {
      if (index < processingSlots.length) {
        return slot.status !== 'processing';
      } else {
        return slot.status !== 'available';
      }
    });

    if (!needsReordering) {
      console.log('✅ [AUTO-ADJUST] Slots already in correct order for', orderType);
      return;
    }

    // Reorder: processing slots first, then available
    const reorderedSlots = [...processingSlots, ...availableSlots];

    // 🎯 CRITICAL: Only update 'number' property (display order), keep 'id' unchanged
    const updatedSlots = { ...slots };

    reorderedSlots.forEach((slot, index) => {
      const newNumber = (index + 1).toString();

      // Only update if number changed (display order changed)
      if (slot.number !== newNumber) {
        updatedSlots[slot.id] = {
          ...slot,
          number: newNumber, // Update display order only, keep ID unchanged
          updatedAt: new Date()
        };

        saveSlotToDB(updatedSlots[slot.id]);
      }
    });

    set({ slots: updatedSlots });

    console.log('✅ [AUTO-ADJUST] Slots auto-adjusted (IDs preserved, display order updated):', {
      orderType,
      processingCount: processingSlots.length,
      availableCount: availableSlots.length
    });
  },

  // Transfer order between slots - ONLY FOR DRAFT ORDERS
  transferOrderToSlot: async (sourceSlotId: string, targetSlotId: string) => {
    const { slots } = get();
    const sourceSlot = slots[sourceSlotId];
    const targetSlot = slots[targetSlotId];

    console.log('🔄 [TRANSFER] Starting draft order transfer:', { sourceSlotId, targetSlotId });

    // 🎯 BULLETPROOF VALIDATION
    if (!sourceSlot) {
      console.error('❌ [TRANSFER] Source slot not found:', sourceSlotId);
      return;
    }

    if (!targetSlot) {
      console.error('❌ [TRANSFER] Target slot not found:', targetSlotId);
      return;
    }

    if (targetSlot.status !== 'available') {
      console.error('❌ [TRANSFER] Target slot must be available. Current status:', targetSlot.status);
      return;
    }

    try {
      const { useOrderOverlayStore } = await import('./order-overlay');
      const { useCartStore } = await import('./cart-new');
      const overlayStore = useOrderOverlayStore.getState();
      const cartStore = useCartStore.getState();

      // 🎯 STEP 1: Get draft overlay for source slot
      const overlay = await overlayStore.getActiveOrderBySlot(sourceSlotId);

      if (!overlay) {
        console.error('❌ [TRANSFER] No draft order found for source slot');
        return;
      }

      // 🎯 CRITICAL: Only allow transfer of DRAFT orders (active + unpaid)
      // Processing orders (placed orders) should NEVER be transferred
      if (overlay.status !== 'active' || overlay.paymentStatus === 'paid') {
        console.error('❌ [TRANSFER] Can only transfer draft orders (active + unpaid). Order status:', overlay.status, 'payment:', overlay.paymentStatus);
        return;
      }

      console.log('📦 [TRANSFER] Found draft order to transfer:', overlay.id);

      // 🎯 STEP 2: Update overlay with new slotId in IndexedDB
      await overlayStore.upsertFromCart({
        orderId: overlay.id,
        slotId: targetSlotId, // ⬅️ CRITICAL: Change slot reference
        orderType: overlay.orderType,
        items: overlay.items,
        customer: overlay.customer,
        total: overlay.total,
        subtotal: overlay.subtotal,
        tax: overlay.tax,
        paymentStatus: overlay.paymentStatus,
        status: overlay.status
      });

      console.log('✅ [TRANSFER] Overlay updated with new slotId:', targetSlotId);

      // 🎯 STEP 3: Clear overlay cache for source slot ONLY
      // Clear source slot - overlay no longer belongs here
      overlayStore.clearSlotCache(sourceSlotId);
      console.log('🧹 [TRANSFER] Cleared overlay cache for source slot');

      // 🎯 CRITICAL: Reload overlay from IndexedDB with new slotId to update Zustand state
      // This ensures draftSlotMap in useSlotManagement detects draft in target slot
      const updatedOverlay = await overlayStore.getActiveOrderBySlot(targetSlotId);
      if (!updatedOverlay) {
        console.error('❌ [TRANSFER] Failed to reload updated overlay from IndexedDB');
        return;
      }
      console.log('✅ [TRANSFER] Reloaded overlay into Zustand state with new slotId:', targetSlotId);

      // 🎯 STEP 4: Transfer cart store if currently viewing this slot
      const currentCartSlotId = cartStore.currentSlotId;
      if (currentCartSlotId === sourceSlotId) {
        console.log('🛒 [TRANSFER] Transferring cart store from source to target slot');
        const sourceCart = cartStore.carts[sourceSlotId];
        if (sourceCart) {
          // Copy cart data to target slot
          cartStore.carts[targetSlotId] = {
            ...sourceCart,
            slotId: targetSlotId
          };
          // Clear source cart
          delete cartStore.carts[sourceSlotId];
          // Update current slot if user is still on this slot
          cartStore.currentSlotId = targetSlotId;
          console.log('✅ [TRANSFER] Cart store transferred successfully');
        }
      }

      const now = new Date();

      // 🎯 STEP 5: Update slot states - DRAFT transfers keep slots as 'available'
      // Draft orders don't change slot status, they just move the overlay reference
      set({
        slots: {
          ...slots,
          [targetSlotId]: {
            ...targetSlot,
            status: 'available', // ⬅️ DRAFT: Slot stays available (draft indicator from overlay)
            orderRefId: undefined, // ⬅️ DRAFT: No orderRefId, overlay loads via slotId
            paymentStatus: undefined,
            paymentMethod: undefined,
            startTime: undefined,
            elapsedTime: undefined,
            timeStatus: undefined,
            updatedAt: now
          },
          [sourceSlotId]: {
            ...sourceSlot,
            status: 'available', // ⬅️ Source becomes truly empty
            orderRefId: undefined,
            paymentStatus: undefined,
            paymentMethod: undefined,
            startTime: undefined,
            elapsedTime: undefined,
            timeStatus: undefined,
            updatedAt: now
          }
        }
      });

      console.log('✅ [TRANSFER] Slot states updated');

      // 🎯 STEP 6: Persist to IndexedDB (parallel for speed)
      await Promise.all([
        saveSlotToDB(get().slots[sourceSlotId]),
        saveSlotToDB(get().slots[targetSlotId])
      ]);

      console.log('✅ [TRANSFER] Slots persisted to IndexedDB');

      // 🎯 STEP 7: Adjust display order (processing slots first)
      await get().autoAdjustSlotOrder(sourceSlot.orderType);

      console.log('✅ [TRANSFER] Order transfer completed successfully:', {
        from: sourceSlotId,
        to: targetSlotId,
        orderId: overlay.id
      });

    } catch (error) {
      console.error('❌ [TRANSFER] Transfer failed:', error);
      throw error;
    }
  },

  computeTimers: () => {
    const { slots } = get();

    // 🚀 PERFORMANCE OPTIMIZATION: Pre-filter processing slots to avoid iterating all slots
    // With 100+ slots, this reduces operations by 90%+ (most slots are available)
    const processingSlots = Object.values(slots).filter(
      slot => slot.status === 'processing' && slot.startTime
    );

    // Early exit if no processing slots (common case)
    if (processingSlots.length === 0) {
      return; // Zero operations when no orders in progress
    }

    let hasUpdates = false;
    const updates: Record<string, UnifiedSlot> = {};

    // Only process active slots
    processingSlots.forEach(slot => {
      const { elapsedTime, timeStatus } = computeTimerStatus(slot.startTime!);

      // 🎯 CRITICAL: Only create update if timer values actually changed
      if (slot.elapsedTime !== elapsedTime || slot.timeStatus !== timeStatus) {
        updates[slot.id] = {
          ...slot,
          elapsedTime,
          timeStatus,
          updatedAt: new Date()
        };
        hasUpdates = true;
      }
    });

    // 🚀 ZERO RE-RENDERS: Only update Zustand if timers actually changed
    if (hasUpdates) {
      set(state => ({
        slots: { ...state.slots, ...updates }
      }));
    }
    // If no changes, no Zustand update = no component re-renders!
  }
}));

// Simple hooks for direct access
export const useUnifiedSlot = (slotId: string) => {
  return useUnifiedSlotStore(state => state.slots[slotId] || null);
};

export const useUnifiedSlotsByType = (orderType: OrderType) => {
  return useUnifiedSlotStore(state =>
    Object.values(state.slots)
      .filter(slot => slot.orderType === orderType)
      .sort((a, b) => parseInt(a.number) - parseInt(b.number)) // Sort by display order
  );
};

// Timer management
let timerInterval: NodeJS.Timeout | null = null;

export const startUnifiedSlotTimer = () => {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    useUnifiedSlotStore.getState().computeTimers();
  }, 1000);

  // Silent timer start for performance
};

export const stopUnifiedSlotTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    // Silent timer stop for performance
  }
};