/**
 * Kitchen Interface System
 *
 * Professional modular system that supports both:
 * - Receipt printing (current)
 * - KDS (Kitchen Display System) - future integration
 *
 * Toggle in settings allows switching between modes
 */

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: {
    variations?: Array<{ name: string; }>;
    addOns?: Array<{ name: string; }>;
    specialInstructions?: string;
    notes?: string;
  };
  isNew?: boolean; // For additional items on existing orders
}

export interface KitchenOrder {
  orderId: string;
  slotId: string;
  orderNumber: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  items: KitchenOrderItem[];
  timestamp: string;
  customerName?: string;
  specialInstructions?: string;
  isAdditionalItems?: boolean; // True when printing only new items
  priority?: 'normal' | 'urgent';
}

// Kitchen system modes
export type KitchenSystemMode = 'receipt' | 'kds';

// Abstract kitchen interface
export interface KitchenSystemInterface {
  sendToKitchen(order: KitchenOrder): Promise<boolean>;
  getSystemStatus(): Promise<'online' | 'offline' | 'error'>;
  getMode(): KitchenSystemMode;
}

// Receipt-based kitchen system (current implementation)
export class ReceiptKitchenSystem implements KitchenSystemInterface {
  getMode(): KitchenSystemMode {
    return 'receipt';
  }

  async sendToKitchen(order: KitchenOrder): Promise<boolean> {
    try {
      console.log('🖨️ [KITCHEN RECEIPT] Printing kitchen receipt for order:', order.orderId);

      // Generate kitchen receipt content
      const receiptContent = this.generateKitchenReceipt(order);

      // TODO: Integrate with actual receipt printer
      // For now, log the receipt content
      console.log('📄 [KITCHEN RECEIPT CONTENT]:\n', receiptContent);

      // Simulate successful printing
      return true;
    } catch (error) {
      console.error('❌ [KITCHEN RECEIPT] Error printing:', error);
      return false;
    }
  }

  async getSystemStatus(): Promise<'online' | 'offline' | 'error'> {
    // TODO: Check actual printer status
    return 'online';
  }

  private generateKitchenReceipt(order: KitchenOrder): string {
    const header = order.isAdditionalItems ? 'ADDITIONAL ITEMS' : 'NEW ORDER';

    let receipt = `
=====================================
           ${header}
=====================================
Order: ${order.orderNumber}
Slot: ${order.slotId}
Type: ${order.orderType.toUpperCase()}
Time: ${new Date(order.timestamp).toLocaleTimeString()}
${order.customerName ? `Customer: ${order.customerName}` : ''}
${order.priority === 'urgent' ? '🔥 URGENT ORDER' : ''}
-------------------------------------
`;

    order.items.forEach((item, index) => {
      receipt += `${index + 1}. ${item.name} x${item.quantity}${item.isNew ? ' (NEW)' : ''}\n`;

      if (item.modifiers?.variations?.length) {
        item.modifiers.variations.forEach(variation => {
          receipt += `   - ${variation.name}\n`;
        });
      }

      if (item.modifiers?.addOns?.length) {
        item.modifiers.addOns.forEach(addon => {
          receipt += `   + ${addon.name}\n`;
        });
      }

      if (item.modifiers?.specialInstructions) {
        receipt += `   * ${item.modifiers.specialInstructions}\n`;
      }

      if (item.modifiers?.notes) {
        receipt += `   Note: ${item.modifiers.notes}\n`;
      }

      receipt += '\n';
    });

    if (order.specialInstructions) {
      receipt += `-------------------------------------\nSPECIAL INSTRUCTIONS:\n${order.specialInstructions}\n`;
    }

    receipt += `=====================================\n`;

    return receipt;
  }
}

// KDS system stub (future implementation)
export class KDSKitchenSystem implements KitchenSystemInterface {
  getMode(): KitchenSystemMode {
    return 'kds';
  }

  async sendToKitchen(order: KitchenOrder): Promise<boolean> {
    try {
      console.log('📺 [KDS] Sending order to Kitchen Display System:', order.orderId);

      // TODO: Send to KDS endpoint when implemented
      // await fetch('/api/kds/orders', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(order)
      // });

      console.log('📺 [KDS] Order sent successfully (stubbed)');
      return true;
    } catch (error) {
      console.error('❌ [KDS] Error sending order:', error);
      return false;
    }
  }

  async getSystemStatus(): Promise<'online' | 'offline' | 'error'> {
    // TODO: Check KDS server status
    return 'online';
  }
}

// Kitchen system factory
export class KitchenSystemFactory {
  static create(mode: KitchenSystemMode): KitchenSystemInterface {
    switch (mode) {
      case 'receipt':
        return new ReceiptKitchenSystem();
      case 'kds':
        return new KDSKitchenSystem();
      default:
        return new ReceiptKitchenSystem();
    }
  }
}

// Utility functions for converting cart items to kitchen orders
export const convertCartToKitchenOrder = (
  cartItems: any[],
  slotId: string,
  orderNumber: string,
  orderType: 'dine-in' | 'take-away' | 'delivery',
  customerName?: string,
  specialInstructions?: string,
  onlyNewItems = false
): KitchenOrder => {
  const items: KitchenOrderItem[] = cartItems
    .filter(item => !onlyNewItems || !item.isPaid) // Only unpaid items for additional orders
    .map(item => ({
      id: item.uniqueId || item.id,
      name: item.name,
      quantity: item.quantity || 1,
      modifiers: item.modifiers ? {
        variations: item.modifiers.variations || [],
        addOns: item.modifiers.addOns || [],
        specialInstructions: item.modifiers.specialInstructions,
        notes: item.modifiers.notes
      } : undefined,
      isNew: onlyNewItems && !item.isPaid
    }));

  return {
    orderId: `${slotId}-${Date.now()}`,
    slotId,
    orderNumber,
    orderType,
    items,
    timestamp: new Date().toISOString(),
    customerName,
    specialInstructions,
    isAdditionalItems: onlyNewItems,
    priority: orderType === 'delivery' ? 'urgent' : 'normal'
  };
};