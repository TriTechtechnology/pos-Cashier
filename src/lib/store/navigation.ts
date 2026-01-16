/**
 * NAVIGATION STORE - PWA-FIRST SINGLE-PAGE ARCHITECTURE
 *
 * WHY: PWAs on iPads should NOT use URLs for navigation
 * - URLs are for web apps (SEO, bookmarks, sharing)
 * - Native apps use state changes (instant, offline-perfect)
 * - Zero URL-based bugs (no searchParams, no router effects)
 * - Hardware integration ready (kiosks, printers, waiter tablets)
 *
 * PATTERN: Pure in-memory navigation state (like iOS apps)
 * - State change = instant page render
 * - No router overhead, no URL parsing
 * - Perfect offline experience
 * - Simple debugging (just state, no URLs)
 */

import { create } from 'zustand';

export type NavigationMode = 'normal' | 'payment' | 'draft' | 'edit';

interface NavigationState {
  // Current page/route (simple string, not URL)
  currentPage: 'home' | 'menu' | 'orders' | 'inventory' | 'settings';

  // Menu page specific state
  selectedSlot: string | null;
  selectedOrderType: 'dine-in' | 'take-away' | 'delivery' | null;
  navigationMode: NavigationMode;

  // Cart UI state (not data - data lives in cart store)
  isCartOpen: boolean;

  // Actions - PURE STATE CHANGES (no router needed!)
  navigateToHome: () => void;
  navigateToMenu: (slotId: string, orderType?: 'dine-in' | 'take-away' | 'delivery', mode?: NavigationMode) => void;
  navigateToOrders: () => void;
  navigateToInventory: () => void;
  navigateToSettings: () => void;
  setCartOpen: (isOpen: boolean) => void;
  setNavigationMode: (mode: NavigationMode) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  // Initial state
  currentPage: 'home',
  selectedSlot: null,
  selectedOrderType: null,
  navigationMode: 'normal',
  isCartOpen: false,

  // Actions - PURE STATE UPDATES (instant navigation!)
  navigateToHome: () => {
    console.log('🧭 [NAVIGATION] Navigating to Home');
    set({
      currentPage: 'home',
      selectedSlot: null,
      selectedOrderType: null,
      navigationMode: 'normal',
      isCartOpen: false
    });
    // That's it! No router, no URLs. Just state change = instant page change.
  },

  navigateToMenu: (slotId: string, orderType?: 'dine-in' | 'take-away' | 'delivery', mode: NavigationMode = 'normal') => {
    console.log('🧭 [NAVIGATION] Navigating to Menu:', { slotId, orderType, mode });
    set({
      currentPage: 'menu',
      selectedSlot: slotId,
      selectedOrderType: orderType || 'dine-in',
      navigationMode: mode,
      isCartOpen: mode === 'payment' // Auto-open cart for payment mode
    });
    // Instant navigation - no router delay, no URL parsing!
  },

  navigateToOrders: () => {
    console.log('🧭 [NAVIGATION] Navigating to Orders');
    set({
      currentPage: 'orders',
      isCartOpen: false
    });
  },

  navigateToInventory: () => {
    console.log('🧭 [NAVIGATION] Navigating to Inventory');
    set({
      currentPage: 'inventory',
      isCartOpen: false
    });
  },

  navigateToSettings: () => {
    console.log('🧭 [NAVIGATION] Navigating to Settings');
    set({
      currentPage: 'settings',
      isCartOpen: false
    });
  },

  setCartOpen: (isOpen: boolean) => {
    console.log('🧭 [NAVIGATION] Cart state changed:', isOpen);
    set({ isCartOpen: isOpen });
  },

  setNavigationMode: (mode: NavigationMode) => {
    console.log('🧭 [NAVIGATION] Mode changed:', mode);
    set({ navigationMode: mode });
  }
}));

// Selectors for components
export const useCurrentPage = () => useNavigationStore(state => state.currentPage);
export const useSelectedSlot = () => useNavigationStore(state => state.selectedSlot);
export const useSelectedOrderType = () => useNavigationStore(state => state.selectedOrderType);
export const useNavigationMode = () => useNavigationStore(state => state.navigationMode);
export const useIsCartOpen = () => useNavigationStore(state => state.isCartOpen);

// Actions
export const useNavigationActions = () => useNavigationStore(state => ({
  navigateToHome: state.navigateToHome,
  navigateToMenu: state.navigateToMenu,
  navigateToOrders: state.navigateToOrders,
  navigateToInventory: state.navigateToInventory,
  navigateToSettings: state.navigateToSettings,
  setCartOpen: state.setCartOpen,
  setNavigationMode: state.setNavigationMode
}));
