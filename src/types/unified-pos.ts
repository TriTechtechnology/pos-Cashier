/**
 * UNIFIED POS TYPES - PHASE 1: WORLD'S FASTEST OFFLINE POS 🚀
 *
 * PURPOSE: Ultra-clean slot interface for lightning-fast UI performance
 * Order details moved to Order Overlay Store for optimal architecture
 *
 * STRATEGY:
 * ✅ Slots = Pure UI state (status, timers, references)
 * ✅ Order Overlay = Complete business data (items, customer, payments)
 * ✅ Zero data duplication = Maximum performance
 * ✅ Offline-first ready for backend sync
 */

import { OrderType, OrderStatus, PaymentStatus, TimeStatus } from './pos';

// 🎯 CLEAN UI-ONLY SLOT INTERFACE
// Ultra-lightweight for maximum performance ⚡
export interface UnifiedSlot {
  // 🏷️ CORE IDENTIFICATION (Required)
  id: string;                    // D1, T1, DL1 format
  number: string;                // Slot position in sequence
  orderType: OrderType;          // 'dine-in' | 'take-away' | 'delivery'
  status: OrderStatus;           // 'available' | 'processing' | 'completed' | 'draft'
  isActive: boolean;             // Slot availability flag

  // ⏰ TIMING DATA (Optional - for processing orders)
  startTime?: Date;              // Order placement timestamp
  elapsedTime?: string;          // "MM:SS" format for UI display
  timeStatus?: TimeStatus;       // 'fresh' | 'warning' | 'overdue'

  // 💰 PAYMENT STATUS (Optional - UI feedback only)
  paymentStatus?: PaymentStatus; // 'paid' | 'unpaid' - UI state only
  paymentMethod?: string;        // 'cash' | 'card' | 'online' - UI display only

  // 🔗 ORDER REFERENCE (Optional) - Points to Order Overlay Store
  orderRefId?: string;           // OrderOverlay id in IndexedDB

  // 👥 TABLE MANAGEMENT (Optional)
  customerCount?: number;        // Table occupancy (for dine-in)

  // 🔧 METADATA (Required)
  createdAt: Date;              // Slot creation time
  updatedAt: Date;              // Last modification time
  syncedAt?: Date;              // Backend sync status (future)
}

// 🔄 BACKWARD COMPATIBILITY TYPES
// Legacy field mappings that now redirect to Order Overlay Store
export interface LegacySlotMapping {
  // These fields are deprecated - use Order Overlay Store instead
  orderId?: string;              // → OrderOverlay.id
  customerName?: string;         // → OrderOverlay.customer.name
  orderDetails?: any[];          // → OrderOverlay.items
  orderTotal?: number;           // → OrderOverlay.total
  orderCustomer?: any;           // → OrderOverlay.customer
  specialInstructions?: string;  // → OrderOverlay.specialInstructions
}

// Alias for existing Slot interface consumers
export type CompatibilitySlot = UnifiedSlot & LegacySlotMapping;

// 🎯 CONVERSION UTILITIES - PHASE 1: OVERLAY-FIRST ARCHITECTURE
export class SlotConverter {
  /**
   * Convert legacy Slot to clean UnifiedSlot (order data extraction)
   * Order data is extracted and should be saved to Order Overlay Store
   */
  static fromLegacySlot(legacySlot: any): {
    slot: UnifiedSlot;
    orderData?: {
      orderId: string;
      customer: any;
      items: any[];
      total: number;
      specialInstructions?: string
    }
  } {
    // Clean UI-only slot data
    const slot: UnifiedSlot = {
      id: legacySlot.id,
      number: legacySlot.number,
      orderType: legacySlot.orderType,
      status: legacySlot.status,
      isActive: legacySlot.isActive ?? true,
      createdAt: legacySlot.createdAt || new Date(),
      updatedAt: legacySlot.updatedAt || new Date(),

      // UI state only
      startTime: legacySlot.startTime,
      elapsedTime: legacySlot.elapsedTime,
      timeStatus: legacySlot.timeStatus,
      paymentStatus: legacySlot.paymentStatus,
      paymentMethod: legacySlot.paymentMethod,
      customerCount: legacySlot.customerCount,
      syncedAt: legacySlot.syncedAt,

      // Reference to Order Overlay (if exists)
      orderRefId: legacySlot.orderId || legacySlot.orderRefId
    };

    // Extract order data for Order Overlay Store
    let orderData = undefined;
    if (legacySlot.orderId || legacySlot.orderDetails || legacySlot.orderCustomer) {
      orderData = {
        orderId: legacySlot.orderId || `order-${Date.now()}`,
        customer: legacySlot.orderCustomer || {
          name: legacySlot.customerName || 'Guest'
        },
        items: legacySlot.orderDetails || [],
        total: legacySlot.orderTotal || 0,
        specialInstructions: legacySlot.specialInstructions
      };
    }

    return { slot, orderData };
  }

  /**
   * Convert UnifiedSlot to legacy format (backward compatibility)
   * NOTE: Order data fields will be empty - use Order Overlay Store instead
   */
  static toLegacySlot(unifiedSlot: UnifiedSlot): CompatibilitySlot {
    return {
      ...unifiedSlot,
      // Legacy fields are undefined - redirect to Order Overlay Store
      orderId: unifiedSlot.orderRefId,
      customerName: undefined, // → Use Order Overlay Store
      orderDetails: undefined, // → Use Order Overlay Store
      orderTotal: undefined,   // → Use Order Overlay Store
      orderCustomer: undefined, // → Use Order Overlay Store
      specialInstructions: undefined // → Use Order Overlay Store
    };
  }

  /**
   * Validate UnifiedSlot structure (defensive programming)
   */
  static validate(slot: UnifiedSlot): boolean {
    return !!(
      slot.id &&
      slot.number &&
      slot.orderType &&
      slot.status &&
      typeof slot.isActive === 'boolean' &&
      slot.createdAt &&
      slot.updatedAt
    );
  }

  /**
   * Safely merge slot updates (UI state only)
   */
  static mergeUpdates(existing: UnifiedSlot, updates: Partial<UnifiedSlot>): UnifiedSlot {
    return {
      ...existing,
      ...updates,
      updatedAt: new Date() // Always update timestamp
    };
  }
}

// 🎯 HELPER TYPES FOR SPECIFIC USE CASES
export type ProcessingSlot = UnifiedSlot & {
  status: 'processing';
  orderRefId: string; // Processing slots always have order reference
};

export type AvailableSlot = UnifiedSlot & {
  status: 'available';
  orderRefId?: undefined; // Available slots have no order
};

export type CompletedSlot = UnifiedSlot & {
  status: 'completed';
  orderRefId: string; // Completed slots reference Order Overlay
};

// 🎯 UTILITY FUNCTIONS - OVERLAY-FIRST ARCHITECTURE
export const SlotUtils = {
  /**
   * Type guards for slot states (UI-only validation)
   */
  isProcessing: (slot: UnifiedSlot): slot is ProcessingSlot =>
    slot.status === 'processing' && !!slot.orderRefId,

  isAvailable: (slot: UnifiedSlot): slot is AvailableSlot =>
    slot.status === 'available',

  isCompleted: (slot: UnifiedSlot): slot is CompletedSlot =>
    slot.status === 'completed' && !!slot.orderRefId,

  /**
   * Generate slot ID based on order type and number
   */
  generateId: (orderType: OrderType, number: number): string => {
    const prefixes: Record<OrderType, string> = {
      'dine-in': 'D',
      'take-away': 'T',
      'delivery': 'DL',
      'draft': 'DR'
    };
    return `${prefixes[orderType] || 'S'}${number}`;
  },

  /**
   * Calculate timer status based on elapsed time
   */
  computeTimer: (slot: ProcessingSlot): { elapsedTime: string; timeStatus: TimeStatus } => {
    if (!slot.startTime) {
      return { elapsedTime: '00:00', timeStatus: 'fresh' };
    }

    const elapsed = Date.now() - slot.startTime.getTime();
    const seconds = Math.floor(elapsed / 1000);

    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    const elapsedTime = `${minutes}:${secs}`;

    let timeStatus: TimeStatus = 'fresh';
    if (seconds >= 40 * 60) {
      timeStatus = 'overdue';
    } else if (seconds >= 15 * 60) {
      timeStatus = 'warning';
    }

    return { elapsedTime, timeStatus };
  }
};

export default UnifiedSlot;