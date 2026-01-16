/**
 * ORDER OVERLAY STORE - Single Source of Truth for Order Data
 *
 * ARCHITECTURE:
 * - Slots (unified-slots.ts): UI state only, stores orderRefId reference
 * - Order Overlays (this file): Complete order data in IndexedDB
 * - Cart (cart-new.ts): Temporary UI state, creates/updates overlays
 *
 * ORDER LIFECYCLE:
 * 1. Draft: slot=available, overlay=active+unpaid+items (user building order)
 * 2. Placed Unpaid: slot=processing, overlay=active+unpaid+items (order placed, not paid)
 * 3. Placed Paid: slot=processing, overlay=active+paid+items (order placed and paid)
 * 4. Completed: slot=available, overlay=completed (order finished, shows in orders page)
 *
 * SLOT REUSE:
 * - Same slot can have multiple orders over time (one active, rest completed)
 * - getActiveOrderBySlot returns MOST RECENT active order only
 * - Completed overlays never interfere with new orders
 */

import { create } from 'zustand';
import Dexie, { Table } from 'dexie';
import type { CustomerInfo, OrderItem, OrderType } from '@/types/pos';

export interface OverlayOrder {
  id: string; // order id / order number
  slotId: string;
  orderType: OrderType;
  totalPrice?: number;
  paymentMethod?: string; // 'cash' | 'card' | 'online' | 'unpaid'
  paymentStatus?: 'paid' | 'unpaid';
  status?: 'active' | 'completed'; // Order lifecycle status - completed orders never load in cart
  customer: CustomerInfo;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  tax?: number;
  specialInstructions?: string;
  placedAt: Date;
  updatedAt: Date;

  // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
  branchId?: string;       // Branch ID for backend sync
  posId?: string;          // POS terminal ID for backend sync
  tillSessionId?: string;  // Till session ID for backend sync
  backendOrderId?: string; // MongoDB _id from backend (used for print receipt)

  // PRODUCTION SYNC FIELDS
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed'; // Backend sync status
  syncAttempts?: number; // Retry counter for failed syncs
  lastSyncAttempt?: Date; // When last sync was attempted
  orderDate?: string; // YYYY-MM-DD for daily grouping and cleanup
}

class OrderOverlayDB extends Dexie {
  overlays!: Table<OverlayOrder, string>;

  constructor() {
    super('OrderOverlayDB');
    this.version(1).stores({
      overlays: 'id, slotId, orderType, paymentStatus, paymentMethod, status, orderDate, syncStatus'
    });
  }
}

// Initialize DB only on client-side
let db: OrderOverlayDB | null = null;

const getDB = (): OrderOverlayDB | null => {
  if (typeof window === 'undefined') return null;
  if (!db) {
    db = new OrderOverlayDB();
  }
  return db;
};

async function saveOverlayToDB(overlay: OverlayOrder): Promise<void> {
  const database = getDB();
  if (!database) return;

  try {
    await database.overlays.put(overlay);

    // 🔍 DEBUG: Read back from IndexedDB to verify what was actually saved
    const savedOverlay = await database.overlays.get(overlay.id);
    if (savedOverlay) {
      savedOverlay.items.forEach((item, index) => {
        if (item.name.includes('(modifier upgrade)')) {
          console.log(`🔍 [OVERLAY DB] Item ${index + 1} READ BACK from IndexedDB:`);
          console.log(`  name: ${item.name}`);
          console.log(`  isModifierUpgrade: ${item.isModifierUpgrade}`);
          console.log(`  typeof isModifierUpgrade: ${typeof item.isModifierUpgrade}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ [OVERLAY DB] Failed to save overlay:', error);
  }
}

async function deleteOverlayFromDB(orderId: string): Promise<void> {
  const database = getDB();
  if (!database) return;

  try {
    console.warn('🗑️ [OVERLAY DB] DELETING overlay from IndexedDB:', orderId);
    console.trace(); // Show stack trace to see who called this
    await database.overlays.delete(orderId);
  } catch (error) {
    console.error('❌ [OVERLAY DB] Failed to delete overlay:', error);
  }
}

interface OrderOverlayStore {
  overlays: Record<string, OverlayOrder>; // key: orderId
  initialized: boolean;
  loadAll: () => Promise<void>;

  // Queries
  getByOrderId: (orderId: string) => OverlayOrder | null;
  getBySlotId: (slotId: string) => Promise<OverlayOrder | null>;

  // Mutations
  upsertFromCart: (params: {
    orderId: string;
    slotId: string;
    orderType: OrderType;
    items: OrderItem[];
    customer: CustomerInfo;
    total: number;
    paymentMethod?: string;
    paymentStatus?: 'paid' | 'unpaid';
    status?: 'active' | 'completed';
    specialInstructions?: string;
    placedAt?: Date;
    subtotal?: number;
    tax?: number;
    // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
    branchId?: string;       // Branch ID for backend sync
    posId?: string;          // POS terminal ID for backend sync
    tillSessionId?: string;  // Till session ID for backend sync
  }) => Promise<OverlayOrder>;

  updateOverlay: (orderId: string, updates: Partial<OverlayOrder>) => Promise<void>;
  markOrderCompleted: (orderId: string) => Promise<void>;
  removeOverlay: (orderId: string) => Promise<void>;
  clearSlotCache: (slotId: string) => void;
  getActiveOrderBySlot: (slotId: string) => Promise<OverlayOrder | null>;
  getOrderForEditing: (slotId: string) => Promise<OverlayOrder | null>; // For editing: gets ANY order for slot
  clearLegacyOrders: () => Promise<void>; // Clean up old 8-digit order IDs
  cleanupOrphanedActiveOrders: () => Promise<void>; // Clean up orphaned active orders

  // PRODUCTION SYNC METHODS
  getTodaysOrders: () => Promise<OverlayOrder[]>; // Get all orders for today's date
  getPendingSyncOrders: () => Promise<OverlayOrder[]>; // Get orders that need backend sync
  markOrderSynced: (orderId: string) => Promise<void>; // Mark order as successfully synced
  markOrderSyncFailed: (orderId: string, attempts: number) => Promise<void>; // Mark sync failed with retry count
  clearOldOrders: (beforeDate: string) => Promise<void>; // Clean up orders older than specified date
  getOrdersByDateRange: (startDate: string, endDate: string) => Promise<OverlayOrder[]>; // For orders page filtering

  // DEV ONLY - Delete all orders
  clearAllOrders: () => Promise<void>; // DEV ONLY - Delete all order overlays
}

export const useOrderOverlayStore = create<OrderOverlayStore>((set, get) => ({
  overlays: {},
  initialized: true, // lazy load per-slot on demand

  loadAll: async () => {
    try {
      const all = await getDB()?.overlays.toArray();
      const map: Record<string, OverlayOrder> = {};
      if (all) {
        all.forEach(o => { map[o.id] = o; });
      }
      set({ overlays: map });
      console.log(`📦 [LOAD ALL] Loaded ${all?.length || 0} orders into memory`);
    } catch (e) {
      console.error('❌ [OVERLAY DB] Failed to load all overlays:', e);
    }
  },

  getByOrderId: (orderId: string) => {
    const { overlays } = get();
    return overlays[orderId] || null;
  },

  getBySlotId: async (slotId: string) => {
    // 🚨 DEPRECATED: Use getActiveOrderBySlot for cart loading
    console.warn('⚠️ [OVERLAY STORE] getBySlotId is deprecated. Use getActiveOrderBySlot for cart operations.');
    return get().getActiveOrderBySlot(slotId);
  },

  getActiveOrderBySlot: async (slotId: string) => {
    console.log('🔍 [OVERLAY STORE] Loading ACTIVE order for slot:', slotId);

    // First check in-memory for active orders only - GET MOST RECENT ACTIVE ORDER
    const inMemoryActiveOrders = Object.values(get().overlays).filter(o => {
      if (o.slotId !== slotId) return false;

      // 🚨 CRITICAL: Never return completed orders for cart loading
      if (o.status === 'completed') {
        return false;
      }

      // Only return active orders (default status is active)
      if (o.status && o.status !== 'active') {
        return false;
      }

      // For active orders, check payment status for mixed payment workflows
      if (o.paymentStatus === 'paid') {
        // Check if order has any unpaid items (mixed payment state)
        const hasUnpaidItems = o.items?.some(item => !item.isPaid);
        return hasUnpaidItems; // Only return if there are unpaid items to process
      }
      return o.paymentStatus === 'unpaid' || !o.paymentStatus; // Default to unpaid if not set
    });

    // 🎯 BULLETPROOF: Get MOST RECENT active order if multiple exist
    if (inMemoryActiveOrders.length > 0) {
      const mostRecent = inMemoryActiveOrders.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
      console.log('✅ [OVERLAY STORE] Found most recent active order in memory:', mostRecent.id, 'updated:', mostRecent.updatedAt);
      return mostRecent;
    }

    // Fallback to DB for active order - GET MOST RECENT
    try {
      const results = await getDB()?.overlays.where('slotId').equals(slotId).toArray();
      if (!results || results.length === 0) {
        console.log('❌ [OVERLAY STORE] No active order found for slot:', slotId);
        return null;
      }

      // Filter for active orders only
      const activeOrders = results.filter(o => {
        if (o.status === 'completed') return false;
        if (o.status && o.status !== 'active') return false;

        if (o.paymentStatus === 'paid') {
          const hasUnpaidItems = o.items?.some(item => !item.isPaid);
          return hasUnpaidItems;
        }
        return o.paymentStatus === 'unpaid' || !o.paymentStatus;
      });

      if (activeOrders.length === 0) {
        console.log('❌ [OVERLAY STORE] No active orders found in DB for slot:', slotId);
        return null;
      }

      // 🎯 BULLETPROOF: Get MOST RECENT active order
      const mostRecent = activeOrders.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      console.log('✅ [OVERLAY STORE] Loaded most recent active order from DB:', mostRecent.id, 'updated:', mostRecent.updatedAt);
      set(state => ({ overlays: { ...state.overlays, [mostRecent.id]: mostRecent } }));
      return mostRecent;
    } catch (error) {
      console.error('❌ [OVERLAY DB] Failed to load active order:', error);
      return null;
    }
  },

  getOrderForEditing: async (slotId: string) => {
    console.log('✏️ [OVERLAY STORE] Loading ACTIVE draft order for editing, slot:', slotId);

    // 🎯 PRODUCTION RULE: ONLY return ACTIVE orders, NEVER completed orders
    // Completed orders are historical records and should never be reopened for editing

    // First check in-memory for ACTIVE orders only
    const inMemoryActiveOrders = Object.values(get().overlays).filter(o =>
      o.slotId === slotId && o.status === 'active'
    );
    if (inMemoryActiveOrders.length > 0) {
      // Sort by updatedAt to get the MOST RECENT active order
      const mostRecent = inMemoryActiveOrders.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      console.log('✅ [OVERLAY STORE] Found active draft order in memory:', mostRecent.id);
      return mostRecent;
    }

    // Fallback to DB for ACTIVE orders only
    try {
      const results = await getDB()?.overlays
        .where('slotId').equals(slotId)
        .toArray();

      if (!results || results.length === 0) {
        console.log('✅ [OVERLAY STORE] No draft order found for slot:', slotId);
        return null;
      }

      // Filter for ACTIVE orders only (exclude completed)
      const activeOrders = results.filter(o => o.status === 'active');

      if (activeOrders.length === 0) {
        console.log('✅ [OVERLAY STORE] No active draft orders (only completed orders exist)');
        return null;
      }

      // Sort by updatedAt to get the MOST RECENT active order
      const mostRecentActive = activeOrders.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      console.log('✅ [OVERLAY STORE] Found active draft order in DB:', mostRecentActive.id);
      set(state => ({ overlays: { ...state.overlays, [mostRecentActive.id]: mostRecentActive } }));
      return mostRecentActive;
    } catch (error) {
      console.error('❌ [OVERLAY DB] Failed to load order for editing:', error);
      return null;
    }
  },

  upsertFromCart: async (params) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if this is an existing order (preserve sync status)
    const existingOverlay = get().overlays[params.orderId];

    // 🚨 CRITICAL PRODUCTION LOGIC: Smart sync status management
    // - If order just became PAID → mark as 'pending' (needs immediate sync)
    // - If order was already synced and still paid → keep 'synced' (don't re-sync)
    // - If order is unpaid → 'pending' (but won't sync until paid per getPendingSyncOrders filter)
    const wasPreviouslyPaid = existingOverlay?.paymentStatus === 'paid';
    const isNowPaid = params.paymentStatus === 'paid';
    const justBecamePaid = isNowPaid && !wasPreviouslyPaid;

    let syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
    if (existingOverlay?.syncStatus === 'synced' && isNowPaid) {
      // Order was already synced and is still paid → keep synced
      syncStatus = 'synced';
    } else if (justBecamePaid) {
      // Order just became paid → mark for immediate sync
      syncStatus = 'pending';
      console.log('💳 [SYNC] Order just became PAID → marking for sync:', params.orderId);
    } else {
      // Preserve existing status or default to pending
      syncStatus = existingOverlay?.syncStatus || 'pending';
    }

    const overlay: OverlayOrder = {
      id: params.orderId,
      slotId: params.slotId,
      orderType: params.orderType,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      status: params.status || 'active', // Use provided status or default to active
      customer: params.customer,
      items: params.items,
      total: params.total,
      subtotal: params.subtotal,
      tax: params.tax,
      specialInstructions: params.specialInstructions,
      placedAt: params.placedAt || now,
      updatedAt: now,

      // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
      branchId: params.branchId,       // Branch ID for backend sync
      posId: params.posId,             // POS terminal ID for backend sync
      tillSessionId: params.tillSessionId,  // Till session ID for backend sync

      // PRODUCTION SYNC FIELDS
      orderDate: today, // For daily grouping and cleanup
      syncStatus, // Smart status based on payment state
      syncAttempts: existingOverlay?.syncAttempts || 0, // Preserve retry count
      lastSyncAttempt: existingOverlay?.lastSyncAttempt // Preserve last sync attempt
    };

    // 🔍 DEBUG: Log upgrade items before saving to IndexedDB
    overlay.items.forEach((item, index) => {
      if (item.name.includes('(modifier upgrade)')) {
        console.log(`🔍 [OVERLAY STORE] Item ${index + 1} BEFORE IndexedDB save:`);
        console.log(`  name: ${item.name}`);
        console.log(`  isModifierUpgrade: ${item.isModifierUpgrade}`);
        console.log(`  typeof isModifierUpgrade: ${typeof item.isModifierUpgrade}`);
      }
    });

    set(state => ({ overlays: { ...state.overlays, [overlay.id]: overlay } }));
    await saveOverlayToDB(overlay);

    // 🔄 TRIGGER SYNC COUNT UPDATE: When order becomes paid, update sync counts immediately
    if (justBecamePaid && typeof window !== 'undefined') {
      console.log('🔄 [SYNC] Updating sync counts after payment...');
      const { syncService } = await import('@/lib/services/syncService');
      await syncService.updateSyncCounts();
    }

    return overlay;
  },

  updateOverlay: async (orderId, updates) => {
    const existing = get().overlays[orderId];
    if (!existing) return;
    const updated: OverlayOrder = { ...existing, ...updates, updatedAt: new Date() };
    set(state => ({ overlays: { ...state.overlays, [orderId]: updated } }));
    await saveOverlayToDB(updated);
  },

  // Mark order as completed - for OrderOverlay completion
  markOrderCompleted: async (orderId: string) => {
    // Try in-memory first
    let existing = get().overlays[orderId];

    // If not in memory, load from DB
    if (!existing) {
      const dbOrder = await getDB()?.overlays.get(orderId);
      if (!dbOrder) {
        console.error('❌ [OVERLAY STORE] Cannot mark non-existent order as completed:', orderId);
        return;
      }
      existing = dbOrder;
    }

    // 🚨 CRITICAL PRODUCTION FIX: NEVER reset sync status when completing
    // Sync status should ONLY be set when order becomes PAID, not when completed
    // If order was already synced, keep it synced
    // If order was pending/failed, it should have been synced when paid
    const updated: OverlayOrder = {
      ...existing,
      status: 'completed',
      // 🎯 PRESERVE sync status - don't reset to pending if already synced
      syncStatus: existing.syncStatus || 'synced', // If no status, assume synced (order was paid and synced before completion)
      updatedAt: new Date()
    };

    set(state => ({ overlays: { ...state.overlays, [orderId]: updated } }));
    await saveOverlayToDB(updated);
    console.log('✅ [OVERLAY STORE] Marked order as completed:', orderId, 'sync status:', updated.syncStatus);

    // Update sync counts (counts won't change if status preserved)
    if (typeof window !== 'undefined') {
      const { syncService } = await import('@/lib/services/syncService');
      await syncService.updateSyncCounts();
    }
  },

  removeOverlay: async (orderId) => {
    const { overlays } = get();
    const cloned = { ...overlays };
    delete cloned[orderId];
    set({ overlays: cloned });
    await deleteOverlayFromDB(orderId);
  },

  clearSlotCache: (slotId: string) => {
    console.log('🗑️ [OVERLAY STORE] Clearing cache for slot:', slotId);
    const { overlays } = get();
    const filtered = Object.fromEntries(
      Object.entries(overlays).filter(([_, overlay]) => overlay.slotId !== slotId)
    );
    set({ overlays: filtered });
  },

  clearLegacyOrders: async () => {
    console.log('🧹 [OVERLAY STORE] Clearing legacy 8-digit order IDs...');
    try {
      // Get all orders from IndexedDB
      const allOrders = await getDB()?.overlays.toArray();
      if (!allOrders) return;

      // Find orders with 8+ digit IDs (legacy timestamp-based IDs)
      const legacyOrders = allOrders.filter(order => {
        // Check if order ID contains numbers
        const numericPart = order.id.replace(/[^0-9]/g, '');
        return numericPart.length >= 8;
      });

      console.log(`🧹 [CLEANUP] Found ${legacyOrders.length} legacy orders with 8+ digit IDs`);

      if (legacyOrders.length > 0) {
        // Delete legacy orders from IndexedDB
        const legacyIds = legacyOrders.map(order => order.id);
        await getDB()?.overlays.bulkDelete(legacyIds);

        // Remove legacy orders from in-memory cache
        const { overlays } = get();
        const filtered = Object.fromEntries(
          Object.entries(overlays).filter(([orderId]) => {
            const numericPart = orderId.replace(/[^0-9]/g, '');
            return numericPart.length < 8;
          })
        );
        set({ overlays: filtered });

        console.log(`✅ [CLEANUP] Removed ${legacyOrders.length} legacy orders:`, legacyIds);
      } else {
        console.log('✅ [CLEANUP] No legacy orders found to clean');
      }
    } catch (error) {
      console.error('❌ [CLEANUP] Error clearing legacy orders:', error);
    }
  },

  // 🏆 BULLETPROOF: Clean up TRULY orphaned active overlays ONLY
  // NEVER delete valid processing/draft orders - production safety first!
  cleanupOrphanedActiveOrders: async () => {
    console.warn('🧹🧹🧹 [CLEANUP] CLEANUP FUNCTION CALLED - Checking for orphaned active orders...');
    console.trace(); // Show stack trace to see who called cleanup
    try {
      // Get all active orders from IndexedDB
      const allOrders = await getDB()?.overlays.toArray();
      if (!allOrders) {
        console.log('🧹 [CLEANUP] No orders in IndexedDB');
        return;
      }

      // Get all slots from unified-slots store
      const { useUnifiedSlotStore } = await import('./unified-slots');
      const slotStore = useUnifiedSlotStore.getState();
      const allSlots = Object.values(slotStore.slots || {});

      console.log(`🧹 [CLEANUP] Checking ${allOrders.length} orders against ${allSlots.length} slots`);
      console.log(`🧹 [CLEANUP] All orders:`, allOrders.map(o => ({ id: o.id, slotId: o.slotId, status: o.status, items: o.items?.length })));
      console.log(`🧹 [CLEANUP] All slots:`, allSlots.map(s => ({ id: s.id, status: s.status, orderRefId: s.orderRefId })));

      // 🎯 CONSERVATIVE CLEANUP: Only delete if TRULY orphaned
      // An order is orphaned ONLY if:
      // 1. status === 'active' (never touch completed orders)
      // 2. Slot doesn't exist at all (slot was deleted/corrupted)
      // 3. Slot is processing BUT has DIFFERENT orderRefId (slot was hijacked by another order)
      //
      // 🚫 NEVER DELETE:
      // - Draft orders (slot available, overlay has items) - valid draft state
      // - Processing orders (slot processing with matching orderRefId) - valid active state
      const orphanedOrders = allOrders.filter(order => {
        // Only check active orders (NEVER touch completed orders!)
        if (order.status !== 'active') return false;

        // Find corresponding slot
        const slot = allSlots.find(s => s.id === order.slotId);

        // If slot doesn't exist at all, order is orphaned
        if (!slot) {
          console.log(`🧹 [CLEANUP] Order ${order.id} orphaned: slot ${order.slotId} doesn't exist`);
          return true;
        }

        // 🚫 CRITICAL FIX: NEVER delete draft orders!
        // Draft = slot is available, overlay is active with items
        // This is a VALID STATE - user is building order before placing it
        if (slot.status === 'available' && !slot.orderRefId) {
          // Check if overlay has items - if so, it's a valid draft, NOT orphaned
          if (order.items && order.items.length > 0) {
            console.log(`✅ [CLEANUP] Order ${order.id} is a VALID DRAFT - keeping it (slot: ${order.slotId}, items: ${order.items.length})`);
            return false; // NOT orphaned - valid draft
          } else {
            // Empty overlay with no items - this is truly orphaned
            console.log(`🧹 [CLEANUP] Order ${order.id} orphaned: slot ${order.slotId} is available, overlay has no items`);
            return true;
          }
        }

        // If slot is processing but has DIFFERENT orderRefId, this overlay is orphaned
        if (slot.status === 'processing' && slot.orderRefId && slot.orderRefId !== order.id) {
          console.log(`🧹 [CLEANUP] Order ${order.id} orphaned: slot ${order.slotId} is processing different order (${slot.orderRefId})`);
          return true;
        }

        // 🚫 PRODUCTION SAFETY: Do NOT delete if:
        // - Slot is processing with matching orderRefId (valid active order)
        // - Slot is available with items in overlay (valid draft)
        return false;
      });

      console.log(`🧹 [CLEANUP] Found ${orphanedOrders.length} orphaned active orders`);

      if (orphanedOrders.length > 0) {
        // Delete orphaned orders from IndexedDB
        const orphanedIds = orphanedOrders.map(order => order.id);
        console.warn('🗑️ [CLEANUP] BULK DELETING orphaned orders:', orphanedIds);
        await getDB()?.overlays.bulkDelete(orphanedIds);

        // Remove from in-memory cache
        const { overlays } = get();
        const filtered = Object.fromEntries(
          Object.entries(overlays).filter(([orderId]) => !orphanedIds.includes(orderId))
        );
        set({ overlays: filtered });

        console.log(`✅ [CLEANUP] Removed ${orphanedOrders.length} orphaned orders:`, orphanedIds);
      } else {
        console.log('✅ [CLEANUP] No orphaned active orders found');
      }
    } catch (error) {
      console.error('❌ [CLEANUP] Error cleaning orphaned orders:', error);
    }
  },

  // PRODUCTION SYNC METHODS FOR OFFLINE-FIRST ARCHITECTURE

  // Get all orders for today (for orders page display)
  getTodaysOrders: async (): Promise<OverlayOrder[]> => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const orders = await getDB()?.overlays.where('orderDate').equals(today).toArray();
      if (!orders) return [];
      console.log(`📅 [TODAY'S ORDERS] Found ${orders.length} orders for ${today}`);
      return orders;
    } catch (error) {
      console.error('❌ [TODAY\'S ORDERS] Error fetching today\'s orders:', error);
      return [];
    }
  },

  // Get orders that need to be synced with backend
  // ONLY sync PAID orders (regardless of completion status)
  getPendingSyncOrders: async (): Promise<OverlayOrder[]> => {
    try {
      const pendingOrders = await getDB()?.overlays
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .toArray();
      if (!pendingOrders) return [];

      // Filter to only PAID orders (status doesn't matter - only payment matters)
      const paidOnly = pendingOrders.filter(order => order.paymentStatus === 'paid');
      console.log(`🔄 [PENDING SYNC] Found ${paidOnly.length} paid orders awaiting sync (${pendingOrders.length - paidOnly.length} unpaid orders skipped)`);
      return paidOnly;
    } catch (error) {
      console.error('❌ [PENDING SYNC] Error fetching pending orders:', error);
      return [];
    }
  },

  // Mark order as successfully synced with backend
  markOrderSynced: async (orderId: string) => {
    try {
      const overlay = await getDB()?.overlays.get(orderId);
      if (overlay) {
        const updated: OverlayOrder = {
          ...overlay,
          syncStatus: 'synced',
          lastSyncAttempt: new Date(),
          updatedAt: new Date()
        };
        await getDB()?.overlays.put(updated);

        // Update in-memory store
        set(state => ({ overlays: { ...state.overlays, [orderId]: updated } }));
        console.log('✅ [SYNC SUCCESS] Order marked as synced:', orderId);
      }
    } catch (error) {
      console.error('❌ [SYNC SUCCESS] Error marking order as synced:', error);
    }
  },

  // Mark order sync as failed with retry count
  markOrderSyncFailed: async (orderId: string, attempts: number) => {
    try {
      const overlay = await getDB()?.overlays.get(orderId);
      if (overlay) {
        const updated: OverlayOrder = {
          ...overlay,
          syncStatus: 'failed',
          syncAttempts: attempts,
          lastSyncAttempt: new Date(),
          updatedAt: new Date()
        };
        await getDB()?.overlays.put(updated);

        // Update in-memory store
        set(state => ({ overlays: { ...state.overlays, [orderId]: updated } }));
        console.log(`❌ [SYNC FAILED] Order sync failed (attempt ${attempts}):`, orderId);
      }
    } catch (error) {
      console.error('❌ [SYNC FAILED] Error marking order sync as failed:', error);
    }
  },

  // Clean up orders older than specified date (daily cleanup)
  clearOldOrders: async (beforeDate: string) => {
    try {
      const oldOrders = await getDB()?.overlays.where('orderDate').below(beforeDate).toArray();
      if (!oldOrders) return;

      if (oldOrders.length > 0) {
        await getDB()?.overlays.where('orderDate').below(beforeDate).delete();

        // Remove from in-memory store
        const { overlays } = get();
        const filtered = Object.fromEntries(
          Object.entries(overlays).filter(([_, order]) =>
            !order.orderDate || order.orderDate >= beforeDate
          )
        );
        set({ overlays: filtered });

        console.log(`🗑️ [CLEANUP] Removed ${oldOrders.length} orders older than ${beforeDate}`);
      } else {
        console.log(`✅ [CLEANUP] No orders found older than ${beforeDate}`);
      }
    } catch (error) {
      console.error('❌ [CLEANUP] Error clearing old orders:', error);
    }
  },

  // Get orders by date range (for orders page filtering)
  getOrdersByDateRange: async (startDate: string, endDate: string): Promise<OverlayOrder[]> => {
    try {
      const orders = await getDB()?.overlays
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();
      if (!orders) return [];
      console.log(`📊 [DATE RANGE] Found ${orders.length} orders between ${startDate} and ${endDate}`);
      return orders;
    } catch (error) {
      console.error('❌ [DATE RANGE] Error fetching orders by date range:', error);
      return [];
    }
  },

  // 🚀 PROFESSIONAL: Get all active draft slot IDs efficiently
  // Instead of checking each slot individually, get all active orders in one call
  getActiveDraftSlotIds: async () => {
    try {
      // 🔍 DEBUG: Get all orders to see what's happening
      const allOrders = await getDB()?.overlays.toArray();
      if (!allOrders) return [];

      // Filter for active drafts (unpaid, not completed, has items)
      const activeOrders = allOrders.filter(order => {
        const isUnpaid = !order.paymentStatus || order.paymentStatus === 'unpaid';
        const isNotCompleted = !order.status || order.status !== 'completed';
        const hasItems = order.items && order.items.length > 0;

        const isDraft = isUnpaid && isNotCompleted && hasItems;

        // 🔍 DEBUG: Log problematic orders
        if (!isDraft && hasItems) {
          console.log(`🔍 [DEBUG] Order ${order.id} in slot ${order.slotId} not draft: payment=${order.paymentStatus}, status=${order.status}, items=${order.items?.length}`);
        }

        return isDraft;
      });

      const slotIds = new Set(activeOrders.map(order => order.slotId));
      console.log(`⚡ [EFFICIENT LOOKUP] Found ${slotIds.size} active drafts from ${allOrders.length} total orders`);
      return slotIds;
    } catch (error) {
      console.error('❌ [EFFICIENT LOOKUP] Error getting active draft slots:', error);
      return new Set<string>();
    }
  },

  // DEV ONLY - Delete all order overlays
  clearAllOrders: async () => {
    try {
      await getDB()?.overlays.clear();
      set({ overlays: {} });
      console.log('🗑️ [DEV] Cleared all order overlays from IndexedDB');
    } catch (error) {
      console.error('❌ [DEV] Error clearing all orders:', error);
    }
  }
}));

// Convenience selectors
export const useOverlayByOrderId = (orderId: string | null | undefined) => {
  return useOrderOverlayStore(state => (orderId ? state.overlays[orderId] || null : null));
};

export const useAllOverlays = () => {
  return useOrderOverlayStore(state =>
    Object.values(state.overlays).sort((a, b) => (b.placedAt?.valueOf() || 0) - (a.placedAt?.valueOf() || 0))
  );
};


