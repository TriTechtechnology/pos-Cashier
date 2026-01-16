/**
 * CUSTOM ITEMS SERVICE - LocalStorage Management
 *
 * PURPOSE: Manages cashier-created custom menu items stored locally
 * BENEFITS:
 * - Fast in-store item creation without backend
 * - Persistent across sessions
 * - Device-specific catalog
 *
 * USAGE:
 * ```typescript
 * import { customItemsService } from '@/lib/services/customItemsService';
 *
 * // Add a new custom item
 * const item = customItemsService.addCustomItem({
 *   name: 'Special Burger',
 *   price: 850,
 *   specialInstructions: 'Extra cheese'
 * });
 *
 * // Get all custom items
 * const items = customItemsService.getCustomItems();
 *
 * // Remove a custom item
 * customItemsService.removeCustomItem('custom-1234567890');
 * ```
 */

import { MenuItem } from '@/types/pos';

const STORAGE_KEY = 'pos-custom-items';

export interface CustomItemInput {
  name: string;
  price: number;
  specialInstructions?: string;
  createdBy?: string;
}

class CustomItemsService {
  /**
   * Get all custom items from localStorage
   */
  getCustomItems(): MenuItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const items = JSON.parse(stored) as MenuItem[];
      // Convert date strings back to Date objects
      return items.map(item => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined
      }));
    } catch (error) {
      console.error('❌ [CUSTOM ITEMS] Failed to load custom items:', error);
      return [];
    }
  }

  /**
   * Add a new custom item
   */
  addCustomItem(input: CustomItemInput): MenuItem {
    const now = new Date();
    const customItem: MenuItem = {
      id: `custom-${now.getTime()}`, // Timestamp-based unique ID
      name: input.name,
      description: input.specialInstructions || 'Custom item',
      price: input.price,
      category: 'custom',
      image: undefined, // No image - will use FoodIcon based on name
      available: true,
      isCustomItem: true,
      createdAt: now,
      createdBy: input.createdBy || 'cashier'
    };

    const items = this.getCustomItems();
    items.push(customItem);
    this.saveCustomItems(items);

    console.log('✅ [CUSTOM ITEMS] Added new custom item:', customItem);
    return customItem;
  }

  /**
   * Remove a custom item
   */
  removeCustomItem(itemId: string): boolean {
    const items = this.getCustomItems();
    const filtered = items.filter(item => item.id !== itemId);

    if (filtered.length === items.length) {
      console.warn('⚠️ [CUSTOM ITEMS] Item not found:', itemId);
      return false;
    }

    this.saveCustomItems(filtered);
    console.log('✅ [CUSTOM ITEMS] Removed custom item:', itemId);
    return true;
  }

  /**
   * Update a custom item
   */
  updateCustomItem(itemId: string, updates: Partial<CustomItemInput>): MenuItem | null {
    const items = this.getCustomItems();
    const index = items.findIndex(item => item.id === itemId);

    if (index === -1) {
      console.warn('⚠️ [CUSTOM ITEMS] Item not found for update:', itemId);
      return null;
    }

    const updatedItem: MenuItem = {
      ...items[index],
      name: updates.name !== undefined ? updates.name : items[index].name,
      price: updates.price !== undefined ? updates.price : items[index].price,
      description: updates.specialInstructions !== undefined
        ? updates.specialInstructions
        : items[index].description
    };

    items[index] = updatedItem;
    this.saveCustomItems(items);

    console.log('✅ [CUSTOM ITEMS] Updated custom item:', updatedItem);
    return updatedItem;
  }

  /**
   * Clear all custom items (for testing/reset)
   */
  clearCustomItems(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ [CUSTOM ITEMS] Cleared all custom items');
  }

  /**
   * Get the template item for "Add Custom Item" button
   */
  getCustomTemplate(): MenuItem {
    return {
      id: 'custom-template',
      name: '',
      description: 'Tap to create custom item',
      price: 0,
      category: 'custom',
      image: '➕',
      available: true,
      isCustomTemplate: true
    };
  }

  /**
   * Save custom items to localStorage
   */
  private saveCustomItems(items: MenuItem[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('❌ [CUSTOM ITEMS] Failed to save custom items:', error);
    }
  }
}

// Export singleton instance
export const customItemsService = new CustomItemsService();
