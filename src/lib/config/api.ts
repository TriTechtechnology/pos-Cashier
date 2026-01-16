/**
 * API Configuration
 *
 * Central configuration for API endpoints and behavior
 */

// Determine if we should use mock data (default: true for offline-first POS)
export const shouldUseMockData = (): boolean => {
  // In production, you might want to check environment variables
  // For now, always use mock data for offline-first operation
  if (typeof window === 'undefined') return true;

  // Check localStorage for override (useful for testing)
  const useMock = localStorage.getItem('pos-use-mock-data');
  if (useMock !== null) {
    return useMock === 'true';
  }

  // Default to true for offline-first POS
  return true;
};

// API Configuration
export const API_CONFIG = {
  // API Keys (stored here for development, should use env vars in production)
  keys: {
    loyalty: process.env.NEXT_PUBLIC_LOYALTY_API_KEY || 'dev-loyalty-key',
    payment: process.env.NEXT_PUBLIC_PAYMENT_API_KEY || 'dev-payment-key',
    menu: process.env.NEXT_PUBLIC_MENU_API_KEY || 'dev-menu-key'
  },

  // Base URLs for different services
  baseUrls: {
    loyalty: process.env.NEXT_PUBLIC_LOYALTY_API_URL || 'https://api.digitalwallet.cards/v1',
    payment: process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://api.payment.example.com/v1',
    menu: process.env.NEXT_PUBLIC_MENU_API_URL || 'https://api.menu.example.com/v1',
    orders: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://api.orders.example.com/v1'
  },

  // Timeout settings (ms)
  timeout: {
    default: 10000, // 10 seconds
    upload: 30000,  // 30 seconds for file uploads
    download: 60000 // 60 seconds for large downloads
  },

  // Retry settings
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  }
};

// Helper to toggle mock data (useful for debugging)
export const setUseMockData = (useMock: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pos-use-mock-data', String(useMock));
  }
};
