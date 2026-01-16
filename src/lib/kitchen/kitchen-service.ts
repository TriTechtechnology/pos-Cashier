/**
 * Kitchen Service - Professional POS Integration
 *
 * Centralized service for sending orders to kitchen
 * Supports both Receipt printing and KDS (Kitchen Display System)
 * Easily integrates with existing POS workflows
 */

import {
  KitchenSystemInterface,
  KitchenSystemFactory,
  KitchenOrder,
  convertCartToKitchenOrder,
  KitchenSystemMode
} from './kitchen-interface';
import { useSettingsStore } from '@/lib/store/settings';

class KitchenService {
  private kitchenSystem!: KitchenSystemInterface; // Will be initialized in constructor
  private currentMode: KitchenSystemMode = 'receipt'; // Default to receipt

  constructor() {
    // Initialize with settings store mode
    this.initializeWithSettings();
  }

  // Initialize kitchen service with current settings
  private initializeWithSettings() {
    try {
      const settings = useSettingsStore.getState();
      this.currentMode = settings.kitchen.mode;
      this.kitchenSystem = KitchenSystemFactory.create(this.currentMode);
      console.log(`🍳 [KITCHEN SERVICE] Initialized with mode: ${this.currentMode}`);
    } catch (error) {
      console.warn('⚠️ [KITCHEN SERVICE] Failed to load settings, using default mode');
      this.kitchenSystem = KitchenSystemFactory.create(this.currentMode);
    }
  }

  // Switch between receipt and KDS mode
  switchMode(mode: KitchenSystemMode) {
    console.log(`🔄 [KITCHEN SERVICE] Switching to ${mode} mode`);
    this.currentMode = mode;
    this.kitchenSystem = KitchenSystemFactory.create(mode);
  }

  getCurrentMode(): KitchenSystemMode {
    return this.currentMode;
  }

  // Send new order to kitchen
  async sendNewOrder(
    cartItems: any[],
    slotId: string,
    orderNumber: string,
    orderType: 'dine-in' | 'take-away' | 'delivery',
    customerName?: string,
    specialInstructions?: string
  ): Promise<boolean> {
    try {
      console.log('🍳 [KITCHEN SERVICE] Sending new order to kitchen');

      const kitchenOrder = convertCartToKitchenOrder(
        cartItems,
        slotId,
        orderNumber,
        orderType,
        customerName,
        specialInstructions,
        false // All items for new order
      );

      const success = await this.kitchenSystem.sendToKitchen(kitchenOrder);

      if (success) {
        console.log('✅ [KITCHEN SERVICE] New order sent successfully');
      } else {
        console.error('❌ [KITCHEN SERVICE] Failed to send new order');
      }

      return success;
    } catch (error) {
      console.error('❌ [KITCHEN SERVICE] Error sending new order:', error);
      return false;
    }
  }

  // Send additional items only (for existing paid orders)
  async sendAdditionalItems(
    cartItems: any[],
    slotId: string,
    orderNumber: string,
    orderType: 'dine-in' | 'take-away' | 'delivery',
    customerName?: string,
    specialInstructions?: string
  ): Promise<boolean> {
    try {
      console.log('🍳 [KITCHEN SERVICE] Sending additional items to kitchen');

      // Filter only unpaid (new) items
      const newItems = cartItems.filter(item => !item.isPaid);

      if (newItems.length === 0) {
        console.log('ℹ️ [KITCHEN SERVICE] No new items to send to kitchen');
        return true;
      }

      const kitchenOrder = convertCartToKitchenOrder(
        cartItems,
        slotId,
        orderNumber,
        orderType,
        customerName,
        specialInstructions,
        true // Only new items
      );

      // Add priority for additional items
      kitchenOrder.priority = 'urgent';

      const success = await this.kitchenSystem.sendToKitchen(kitchenOrder);

      if (success) {
        console.log(`✅ [KITCHEN SERVICE] Additional items sent successfully (${newItems.length} items)`);
      } else {
        console.error('❌ [KITCHEN SERVICE] Failed to send additional items');
      }

      return success;
    } catch (error) {
      console.error('❌ [KITCHEN SERVICE] Error sending additional items:', error);
      return false;
    }
  }

  // Get kitchen system status
  async getKitchenStatus(): Promise<'online' | 'offline' | 'error'> {
    try {
      return await this.kitchenSystem.getSystemStatus();
    } catch (error) {
      console.error('❌ [KITCHEN SERVICE] Error checking kitchen status:', error);
      return 'error';
    }
  }

  // Utility method to check if we should send to kitchen
  shouldSendToKitchen(cartItems: any[], isNewOrder = true): boolean {
    if (isNewOrder) {
      // For new orders, send if there are any items
      return cartItems.length > 0;
    } else {
      // For existing orders, send only if there are unpaid items
      return cartItems.some(item => !item.isPaid);
    }
  }
}

// Singleton instance
export const kitchenService = new KitchenService();

// Export for easy integration in components
export { kitchenService as default };

// Export types for TypeScript
export type { KitchenSystemMode, KitchenOrder };