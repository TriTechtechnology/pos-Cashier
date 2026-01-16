// POS System Constants
export const POS_CONSTANTS = {
  // Tax Configuration
  DEFAULT_TAX_RATE: 0.16, // 16%
  TAX_TYPES: ['GST', 'VAT', 'Service Tax'] as const,
  
  // Order Types
  ORDER_TYPES: ['dine-in', 'take-away', 'delivery'] as const,
  
  // Order Statuses
  ORDER_STATUSES: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const,
  
  // Slot Statuses
  SLOT_STATUSES: ['available', 'occupied', 'processing', 'completed'] as const,
  
  // Payment Methods
  PAYMENT_METHODS: ['cash', 'card', 'online', 'split'] as const,
  
  // Currency Configuration
  DEFAULT_CURRENCY: 'PKR',
  CURRENCY_SYMBOLS: {
    PKR: 'Rs.',
    USD: '$',
    EUR: '€',
    GBP: '£'
  },
  
  // UI Configuration
  ANIMATION_DURATION: 200,
  SWIPE_THRESHOLD: 60,
  MAX_SWIPE_DISTANCE: 120,
  
  // Search Configuration
  SEARCH_DEBOUNCE: 300,
  MIN_SEARCH_LENGTH: 2,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Time Configuration
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUTO_SAVE_INTERVAL: 5 * 1000, // 5 seconds
  
  // Validation Rules
  MIN_ORDER_AMOUNT: 0,
  MAX_ORDER_AMOUNT: 999999,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
  
  // Receipt Configuration
  RECEIPT_WIDTH: 80,
  RECEIPT_HEADER_LINES: 3,
  RECEIPT_FOOTER_LINES: 2,
  
  // KDS Integration
  KDS_UPDATE_INTERVAL: 1000, // 1 second
  KDS_MAX_RETRIES: 3,
  
  // Offline Configuration
  OFFLINE_SYNC_INTERVAL: 10 * 1000, // 10 seconds
  OFFLINE_MAX_RETRIES: 5,
  
  // Performance Configuration
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

// Type definitions for constants
export type OrderType = typeof POS_CONSTANTS.ORDER_TYPES[number];
export type OrderStatus = typeof POS_CONSTANTS.ORDER_STATUSES[number];
export type SlotStatus = typeof POS_CONSTANTS.SLOT_STATUSES[number];
export type PaymentMethod = typeof POS_CONSTANTS.PAYMENT_METHODS[number];
export type TaxType = typeof POS_CONSTANTS.TAX_TYPES[number];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  ITEM_NOT_FOUND: 'The requested item could not be found.',
  INSUFFICIENT_STOCK: 'Insufficient stock available for this item.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  ORDER_NOT_FOUND: 'The requested order could not be found.',
  SLOT_UNAVAILABLE: 'This slot is currently unavailable.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
  QUANTITY_ERROR: 'Please enter a valid quantity.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order created successfully!',
  ORDER_UPDATED: 'Order updated successfully!',
  ORDER_COMPLETED: 'Order completed successfully!',
  PAYMENT_RECEIVED: 'Payment received successfully!',
  ITEM_ADDED: 'Item added to cart successfully!',
  ITEM_UPDATED: 'Item updated successfully!',
  ITEM_REMOVED: 'Item removed from cart successfully!',
  CART_CLEARED: 'Cart cleared successfully!',
  RECEIPT_PRINTED: 'Receipt printed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  CART_DATA: 'pos_cart_data',
  USER_PREFERENCES: 'pos_user_preferences',
  ORDER_HISTORY: 'pos_order_history',
  OFFLINE_DATA: 'pos_offline_data',
  SESSION_DATA: 'pos_session_data',
  SETTINGS: 'pos_settings',
} as const;

// API Endpoints (for future backend integration)
export const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  MENU: '/api/menu',
  SLOTS: '/api/slots',
  PAYMENTS: '/api/payments',
  CUSTOMERS: '/api/customers',
  INVENTORY: '/api/inventory',
  ANALYTICS: '/api/analytics',
  SETTINGS: '/api/settings',
} as const;
