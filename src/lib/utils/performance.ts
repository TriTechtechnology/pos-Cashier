/**
 * Performance optimization utilities for POS operations
 * These functions are designed to minimize unnecessary calculations and re-renders
 */

// Memoized price calculation with caching
const priceCache = new Map<string, number>();

export const calculateItemPrice = (basePrice: number, modifiers: {
  variations?: Array<{ price: number }>;
  addOns?: Array<{ price: number }>;
}, quantity: number = 1): number => {
  // Create cache key
  const cacheKey = `${basePrice}-${JSON.stringify(modifiers)}-${quantity}`;
  
  // Check cache first
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey)!;
  }
  
  let totalPrice = basePrice;
  
  // Add variation prices
  if (modifiers?.variations) {
    totalPrice += modifiers.variations.reduce((sum: number, mod: { price: number }) => sum + mod.price, 0);
  }
  
  // Add add-on prices
  if (modifiers?.addOns) {
    totalPrice += modifiers.addOns.reduce((sum: number, mod: { price: number }) => sum + mod.price, 0);
  }
  
  // Multiply by quantity and round for PKR
  const finalPrice = Math.round(totalPrice * quantity);
  
  // Cache the result (limit cache size to prevent memory leaks)
  if (priceCache.size > 1000) {
    const firstKey = priceCache.keys().next().value;
    if (firstKey !== undefined) {
      priceCache.delete(firstKey);
    }
  }
  priceCache.set(cacheKey, finalPrice);
  
  return finalPrice;
};

// Optimized array operations
export const findItemById = <T extends { id: string }>(items: T[], id: string): T | undefined => {
  // Use Map for O(1) lookup if array is large
  if (items.length > 100) {
    const itemMap = new Map(items.map(item => [item.id, item]));
    return itemMap.get(id);
  }
  
  // Use find for smaller arrays
  return items.find(item => item.id === id);
};

// Memoized tax calculation
const taxCache = new Map<number, number>();

export const calculateTax = (subtotal: number, rate: number = 0.15): number => {
  if (taxCache.has(subtotal)) {
    return taxCache.get(subtotal)!;
  }
  
  const tax = Math.round(subtotal * rate);
  taxCache.set(subtotal, tax);
  
  // Limit cache size
  if (taxCache.size > 1000) {
    const firstKey = taxCache.keys().next().value;
    if (firstKey !== undefined) {
      taxCache.delete(firstKey);
    }
  }
  
  return tax;
};

// Optimized string operations
export const normalizeString = (str: string): string => {
  return str.toLowerCase().trim();
};

// Fast search with early termination
export const searchItems = <T extends { name: string; description?: string }>(
  items: T[], 
  query: string
): T[] => {
  if (!query.trim()) return items;
  
  const normalizedQuery = normalizeString(query);
  const results: T[] = [];
  
  for (const item of items) {
    if (normalizeString(item.name).includes(normalizedQuery)) {
      results.push(item);
      continue; // Skip description check if name matches
    }
    
    if (item.description && normalizeString(item.description).includes(normalizedQuery)) {
      results.push(item);
    }
    
    // Early termination if we have enough results
    if (results.length >= 50) break;
  }
  
  return results;
};

// Debounced function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttled function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memory-efficient deep clone for objects
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

// Batch state updates to prevent multiple re-renders
export const batchUpdate = <T>(
  updateFn: (current: T) => T,
  delay: number = 16 // 60fps
): ((current: T) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingUpdate: T | null = null;
  
  return (current: T) => {
    pendingUpdate = updateFn(current);
    
    if (timeoutId) return;
    
    timeoutId = setTimeout(() => {
      if (pendingUpdate !== null) {
        // This would be used with a state setter
        // setState(pendingUpdate);
        pendingUpdate = null;
      }
      timeoutId = null;
    }, delay);
  };
};
