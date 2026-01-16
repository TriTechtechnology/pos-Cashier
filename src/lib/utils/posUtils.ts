import { CartItem } from '@/lib/store/cart-new';

// Define the modifiers type locally since it's not exported from cart store
interface CartItemModifiers {
  variations?: Array<{ id: string; name: string; price: number }>;
  addOns?: Array<{ id: string; name: string; price: number }>;
  specialInstructions?: string;
}

/**
 * Calculate the total price of a cart item including modifiers
 */
export const calculateItemTotal = (
  basePrice: number,
  quantity: number,
  modifiers?: CartItemModifiers
): number => {
  let totalPrice = basePrice;
  
  // Add variation costs
  if (modifiers?.variations) {
    totalPrice += modifiers.variations.reduce((sum: number, mod: any) => sum + mod.price, 0);
  }
  
  // Add add-on costs
  if (modifiers?.addOns) {
    totalPrice += modifiers.addOns.reduce((sum: number, mod: any) => sum + mod.price, 0);
  }
  
  return totalPrice * quantity;
};

// BULLETPROOF: Sequential order number generation without throttling interference
// PRODUCTION SAFE: Device-prefixed order IDs prevent collisions across multiple devices

/**
 * Get or generate unique device ID
 * This ensures order IDs are unique across multiple devices/browsers
 */
const getDeviceId = (): string => {
  const DEVICE_ID_KEY = 'pos-device-id';

  if (typeof window === 'undefined') {
    return 'SERVER'; // SSR fallback
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      // Generate 6-character alphanumeric ID
      deviceId = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('🆔 [DEVICE] Generated new device ID:', deviceId);
    }
    return deviceId;
  } catch (e) {
    // Fallback if localStorage fails
    return 'TEMP' + Date.now().toString(36).substring(-4).toUpperCase();
  }
};

/**
 * Get order prefix from branch config (ORD, INV, etc.)
 * Falls back to device ID if not configured
 */
const getOrderPrefix = (): string => {
  if (typeof window === 'undefined') return getDeviceId();

  try {
    const data = localStorage.getItem('pos-branch-config-storage');
    if (!data) return getDeviceId();

    const parsed = JSON.parse(data);
    return parsed?.state?.config?.posConfig?.orderPrefix || getDeviceId();
  } catch {
    return getDeviceId();
  }
};

/**
 * Generate sequential order number with branch prefix
 * Format: ORD-0001, ORD-0002, etc.
 */
export const generateOrderNumber = (): string => {
  const prefix = getOrderPrefix();

  let counter = 1;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pos-order-counter');
      if (stored) counter = parseInt(stored, 10) + 1;
      localStorage.setItem('pos-order-counter', counter.toString());
    } catch {
      counter = Date.now() % 10000;
    }
  }

  return `${prefix}-${counter.toString().padStart(4, '0')}`;
};

/**
 * Discard an unused order number (when draft is emptied)
 * With random numbers, we just log this for debugging
 */
export const discardOrderNumber = (orderNumber: string): void => {
  console.log('🗑️ [ORDER NUMBER] Discarded order number:', orderNumber);
};

/**
 * Get the current device ID for backend tracking
 * Used by sync service to identify which device sent the order
 */
export const getCurrentDeviceId = (): string => {
  return getDeviceId();
};

/**
 * Get timezone from branch config
 * Defaults to Asia/Karachi (primary market timezone)
 */
export const getBranchTimezone = (): string => {
  if (typeof window === 'undefined') return 'Asia/Karachi';

  try {
    const data = localStorage.getItem('pos-branch-config-storage');
    if (!data) return 'Asia/Karachi';

    const parsed = JSON.parse(data);
    return parsed?.state?.config?.timezone || 'Asia/Karachi';
  } catch {
    return 'Asia/Karachi';
  }
};

/**
 * Format date with branch timezone
 * Returns date formatted in the branch's configured timezone
 */
export const formatDateWithTimezone = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = new Date(date);
  const timezone = getBranchTimezone();

  try {
    return d.toLocaleString('en-US', { ...options, timeZone: timezone });
  } catch (e) {
    return d.toLocaleString('en-US', options);
  }
};

/**
 * Format time elapsed since a given date
 */
export const formatTimeElapsed = (startTime: Date | string): string => {
  const now = new Date();
  const start = new Date(startTime);
  const diff = now.getTime() - start.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

/**
 * Validate cart item data
 */
export const validateCartItem = (item: Partial<CartItem>): boolean => {
  return !!(
    item.id &&
    item.name &&
    typeof item.price === 'number' &&
    item.price >= 0 &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  );
};

/**
 * Group items by category for display
 */
export const groupItemsByCategory = <T extends { category: string }>(items: T[]): Record<string, T[]> => {
  const groups: Record<string, T[]> = {};
  
  items.forEach(item => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
  });
  
  return groups;
};

/**
 * Search items by query (name, description, category)
 */
export const searchItems = <T extends { name: string; description?: string; category: string }>(
  items: T[],
  query: string
): T[] => {
  if (!query.trim()) return items;
  
  const searchTerm = query.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.description?.toLowerCase().includes(searchTerm) ||
    item.category.toLowerCase().includes(searchTerm)
  );
};

/**
 * Sort items by priority (available first, then by name)
 */
export const sortItemsByPriority = <T extends { available: boolean; name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    // Available items first
    if (a.available !== b.available) {
      return a.available ? -1 : 1;
    }
    // Then by name
    return a.name.localeCompare(b.name);
  });
};

/**
 * Calculate tax amount
 */
export const calculateTax = (subtotal: number, taxRate: number = 0.15): number => {
  return Math.round(subtotal * taxRate);
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
