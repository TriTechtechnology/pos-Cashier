/**
 * Centralized API Configuration for POS System
 * 
 * ADMIN-BACKEND INTEGRATION:
 * This POS app is designed to connect with a separate client admin module.
 * 
 * Architecture:
 * 1. Admin Module (Separate WebApp) → Configures menus, modifiers, pricing, rules
 * 2. Backend API → Serves dynamic configurations to POS
 * 3. POS System (This App) → Consumes admin-configured data
 * 
 * The POS adapts to ANY admin configuration without code changes:
 * - Menu items, categories, pricing
 * - Add-on requirements (required/optional)
 * - Selection rules (min/max selections)
 * - All business logic driven by admin data
 * 
 * Mock Mode: Simulates real admin backend for testing and development
 * Real Mode: Connects to actual admin backend API
 */

// Common API response interface
export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
}

export { LoyaltyAPI } from './loyalty';
export { categoriesAPI } from './categories';
export { paymentAPI } from './payment';
export { ordersAPI } from './orders';
export { MOCK_DATA, getMockData, validateMockData } from './mockDataManager';

// Simple API configuration
export const API_CONFIG = {
  mode: 'mock' as 'mock' | 'real',
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.yourbackend.com'
};

// Helper to check if we're in mock mode
export const isMockMode = () => API_CONFIG.mode === 'mock';

// Helper to get API base URL
export const getApiBaseUrl = () => {
  return isMockMode() ? '/mock' : API_CONFIG.baseUrl;
};

console.log(`🚀 POS System: ${isMockMode() ? 'Mock Mode (Offline-First)' : 'Real API Mode'}`);
