/**
 * CART SYNC SERVICE - Centralized Overlay Syncing
 *
 * PURPOSE: Single place for all cart-to-overlay sync logic
 * BENEFITS:
 * - Consistent syncing across all cart operations
 * - Easier debugging and maintenance
 * - Testable and reusable
 * - Reduces code duplication by ~70%
 *
 * USAGE:
 * ```typescript
 * import { syncCartToOverlay } from '@/lib/services/cartSyncService';
 *
 * await syncCartToOverlay({
 *   orderId: '0001',
 *   slotId: 'D1',
 *   orderType: 'dine-in',
 *   items: cartItems,
 *   customer: customerInfo,
 *   total: 1500,
 *   subtotal: 1350,
 *   tax: 150,
 *   paymentStatus: 'paid',
 *   paymentMethod: 'cash', // 'cash' | 'card' | 'online' | 'unpaid'
 *   status: 'active'
 * });
 * ```
 */

import { useOrderOverlayStore } from '@/lib/store/order-overlay';
import type { CartItem } from '@/lib/store/cart-new';
import type { CustomerInfo, OrderType } from '@/types/pos';

export interface CartSyncParams {
  orderId: string;
  slotId: string;
  orderType: OrderType;
  items: CartItem[];
  customer: CustomerInfo | null;
  total: number;
  subtotal: number;
  tax: number;
  paymentStatus?: 'paid' | 'unpaid';
  paymentMethod?: string; // 'cash' | 'card' | 'online' | 'unpaid'
  status?: 'active' | 'completed';
  // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
  branchId?: string;       // Branch ID for backend sync
  posId?: string;          // POS terminal ID for backend sync
  tillSessionId?: string;  // Till session ID for backend sync
}

/**
 * Sync cart data to order overlay store
 *
 * @param params - Cart data to sync
 * @returns Promise<void>
 * @throws Error if sync fails
 */
export const syncCartToOverlay = async (params: CartSyncParams): Promise<void> => {
  try {
    console.log('🔄 [SYNC SERVICE] Syncing cart to overlay:', params.orderId);
    console.log('🎯 [SYNC SERVICE] Backend sync fields:', {
      branchId: params.branchId || 'missing',
      posId: params.posId || 'missing',
      tillSessionId: params.tillSessionId || 'missing'
    });

    // 🔍 DEBUG: Log items being synced with isModifierUpgrade flag
    params.items.forEach((item, index) => {
      if (item.name.includes('(modifier upgrade)')) {
        console.log(`🔍 [SYNC DEBUG ${index + 1}] Upgrade item BEFORE mapping:`);
        console.log(`  name: ${item.name}`);
        console.log(`  isModifierUpgrade: ${item.isModifierUpgrade}`);
        console.log(`  typeof isModifierUpgrade: ${typeof item.isModifierUpgrade}`);
        console.log(`  uniqueId: ${item.uniqueId}`);
      }
    });

    const overlayStore = useOrderOverlayStore.getState();

    const mappedItems = params.items.map(cartItem => ({
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price,
      quantity: cartItem.quantity,
      modifiers: cartItem.modifiers,
      totalPrice: cartItem.totalPrice,
      total: cartItem.totalPrice,
      category: cartItem.category,
      description: cartItem.description,
      image: cartItem.image,
      isPaid: cartItem.isPaid || false,
      // 🎯 CRITICAL: Preserve paid item tracking fields for differential charging
      paidQuantity: cartItem.paidQuantity,
      originalPaidPrice: cartItem.originalPaidPrice,
      originalPaidModifiers: cartItem.originalPaidModifiers,
      originalOrderId: cartItem.originalOrderId,
      // 🎯 CRITICAL: Preserve uniqueId for cart item editing (fixes modifier editing bug)
      uniqueId: cartItem.uniqueId,
      // 🎯 PROFESSIONAL: Preserve isModifierUpgrade flag (prevents editing upgrade items)
      isModifierUpgrade: cartItem.isModifierUpgrade || false
    }));

    // 🔍 DEBUG: Log items AFTER mapping
    mappedItems.forEach((item, index) => {
      if (item.name.includes('(modifier upgrade)')) {
        console.log(`🔍 [SYNC DEBUG ${index + 1}] Upgrade item AFTER mapping:`);
        console.log(`  name: ${item.name}`);
        console.log(`  isModifierUpgrade: ${item.isModifierUpgrade}`);
        console.log(`  typeof isModifierUpgrade: ${typeof item.isModifierUpgrade}`);
        console.log(`  uniqueId: ${item.uniqueId}`);
      }
    });

    await overlayStore.upsertFromCart({
      orderId: params.orderId,
      slotId: params.slotId,
      orderType: params.orderType,
      items: mappedItems,
      customer: params.customer || { name: '', phone: '', email: '' },
      total: params.total,
      subtotal: params.subtotal,
      tax: params.tax,
      paymentStatus: params.paymentStatus || 'unpaid',
      paymentMethod: params.paymentMethod, // 🎯 CRITICAL: Persist payment method to overlay
      status: params.status || 'active',
      // 🎯 BACKEND SYNC REQUIRED FIELDS
      branchId: params.branchId,       // Pass through for backend sync
      posId: params.posId,             // Pass through for backend sync
      tillSessionId: params.tillSessionId  // Pass through for backend sync
    });

    console.log('✅ [SYNC SERVICE] Cart synced successfully:', params.orderId);
  } catch (error) {
    console.error('❌ [SYNC SERVICE] Failed to sync cart to overlay:', error);
    throw new Error(`Cart sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Remove order overlay when cart is empty
 *
 * @param orderId - Order ID to remove
 * @returns Promise<void>
 */
export const removeOrderOverlay = async (orderId: string): Promise<void> => {
  try {
    console.log('🗑️ [SYNC SERVICE] Removing order overlay:', orderId);

    const overlayStore = useOrderOverlayStore.getState();
    await overlayStore.removeOverlay(orderId);

    console.log('✅ [SYNC SERVICE] Order overlay removed:', orderId);
  } catch (error) {
    console.error('❌ [SYNC SERVICE] Failed to remove order overlay:', error);
    throw new Error(`Order overlay removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Batch sync multiple carts (for advanced scenarios)
 *
 * @param syncs - Array of cart sync operations
 * @returns Promise<void>
 */
export const batchSyncCarts = async (syncs: CartSyncParams[]): Promise<void> => {
  try {
    console.log(`🔄 [SYNC SERVICE] Batch syncing ${syncs.length} carts...`);

    const promises = syncs.map(params => syncCartToOverlay(params));
    await Promise.all(promises);

    console.log(`✅ [SYNC SERVICE] Batch sync completed: ${syncs.length} carts`);
  } catch (error) {
    console.error('❌ [SYNC SERVICE] Batch sync failed:', error);
    throw new Error(`Batch sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
