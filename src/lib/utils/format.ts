/**
 * Format Utilities
 * 
 * PURPOSE: Centralized formatting functions for currency, dates, and other data display.
 * Ensures consistent formatting across the entire application.
 * 
 * LINKS WITH:
 * - All POS components: Use for price and date display
 * - CartOverlay: Price calculations and display
 * - PaymentOverlay: Payment amount formatting
 * - LoyaltyIntegration: Date and price formatting
 * - All UI components: Consistent data formatting
 * 
 * WHY: Essential for consistent user experience. Centralizes formatting logic
 * and makes it easy to change formatting rules across the entire application.
 */

export const formatCurrency = (
  amount: number,
  currency = 'PKR',
  locale = 'en-US'
): string => {
  // Special handling for PKR (Pakistani Rupees)
  if (currency === 'PKR') {
    return `Rs. ${Math.round(amount).toLocaleString()}`;
  }
  
  // Use Intl.NumberFormat for other currencies
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  locale = 'en-US'
): string => {
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObject);
};

export const formatTime = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  locale = 'en-US'
): string => {
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObject);
};

export const formatOrderNumber = (orderId: string): string => {
  return `#${orderId.slice(-6).toUpperCase()}`;
};

export const formatSlotNumber = (orderType: string, slotNumber: number): string => {
  const prefixes = {
    'dine-in': 'D',
    'take-away': 'T',
    'delivery': 'DL',
    'draft': 'DR',
  };
  
  const prefix = prefixes[orderType as keyof typeof prefixes] || 'S';
  return `${prefix}${slotNumber}`;
};

export const formatElapsedTime = (startTime: Date): string => {
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phoneNumber;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
