/**
 * Customer Store (Zustand)
 * 
 * PURPOSE: Global state management for customer data including scanned customers,
 * recent customers, search functionality, and customer operations.
 * 
 * LINKS WITH:
 * - CustomerInfo interface: Customer data structure
 * - LoyaltyAPI: Customer lookup and loyalty operations
 * - CartOverlay: Customer selection and info display
 * - LoyaltyIntegration: Customer loyalty management
 * - GuestTabContent: Customer info input
 * - All POS components: Access customer state
 * 
 * WHY: Manages customer data across the entire application. Handles customer
 * scanning, lookup, and maintains recent customer history for quick access.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CustomerInfo } from '@/types/pos';
import { LoyaltyCard } from '@/lib/api/loyalty';

export interface OrderHistoryItem {
  id: string;
  date: string;
  total: number;
  items: string[];
  status: 'completed' | 'cancelled' | 'refunded';
}

interface CustomerStore {
  // State
  scannedCustomer: CustomerInfo | null;
  recentCustomers: CustomerInfo[];
  searchQuery: string;
  searchResults: CustomerInfo[];
  isSearching: boolean;
  isScannerOpen: boolean;

  // Actions
  setScannedCustomer: (customer: CustomerInfo | null) => void;
  addToRecentCustomers: (customer: CustomerInfo) => void;
  clearScannedCustomer: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: CustomerInfo[]) => void;
  setSearching: (isSearching: boolean) => void;
  clearRecentCustomers: () => void;
  removeFromRecentCustomers: (phone: string) => void;
  setScannerOpen: (isOpen: boolean) => void;
  initializeFromMockData: () => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      scannedCustomer: null,
      recentCustomers: [],
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      isScannerOpen: false,

      // Actions
      setScannedCustomer: (customer) => {
        set({ scannedCustomer: customer });
        if (customer) {
          get().addToRecentCustomers(customer);
        }
      },

      addToRecentCustomers: (customer) => {
        const state = get();
        const existingIndex = state.recentCustomers.findIndex(
          c => c.phone === customer.phone
        );

        let updatedRecent = [...state.recentCustomers];
        
        if (existingIndex >= 0) {
          // Update existing customer
          updatedRecent[existingIndex] = customer;
        } else {
          // Add new customer
          updatedRecent.unshift(customer);
        }

        // Keep only last 10 customers
        updatedRecent = updatedRecent.slice(0, 10);

        set({ recentCustomers: updatedRecent });
      },

      clearScannedCustomer: () => {
        set({ scannedCustomer: null });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSearchResults: (results) => {
        set({ searchResults: results });
      },

      setSearching: (isSearching) => {
        set({ isSearching: isSearching });
      },

      clearRecentCustomers: () => {
        set({ recentCustomers: [] });
      },

      removeFromRecentCustomers: (phone) => {
        const state = get();
        const updatedRecent = state.recentCustomers.filter(
          c => c.phone !== phone
        );
        set({ recentCustomers: updatedRecent });
      },

      setScannerOpen: (isOpen) => {
        set({ isScannerOpen: isOpen });
      },

      initializeFromMockData: async () => {
        try {
          const { MOCK_DATA } = await import('@/lib/api/mockDataManager');
          
          // Convert loyalty cards to customer info format
          const mockCustomers = Object.values(MOCK_DATA.loyaltyCards as Record<string, LoyaltyCard>).map((card: LoyaltyCard) => ({
            name: card.customerName,
            phone: card.customerPhone,
            email: card.customerEmail,
            loyaltyCardId: card.id,
            specialInstructions: card.specialInstructions,
            currentStamps: card.currentStamps,
            totalStamps: card.totalStamps,
            totalOrders: card.recentOrders.length,
            totalSpent: card.recentOrders.reduce((sum: number, order: { total: number }) => sum + order.total, 0),
            memberSince: card.memberSince,
            lastScanned: new Date().toISOString(),
            orderHistory: card.recentOrders.map((order: { id: string; date: string; total: number; items: Array<{ name: string }>; status: 'completed' | 'cancelled' | 'refunded' }) => ({
              id: order.id,
              date: order.date,
              total: order.total,
              items: order.items.map((item: { name: string }) => item.name || 'Unknown Item'),
              status: order.status
            })),
            fullOrderData: card.recentOrders.map((order: { id: string; date: string; total: number; items: Array<{ name: string; price: number; quantity: number }>; status: string }) => ({
              id: order.id,
              slotId: 'unknown',
              orderType: 'dine-in' as const,
              status: 'completed' as const,
              items: order.items.map((item: { name: string; price: number; quantity: number }) => ({
                id: item.name,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
                notes: ''
              })),
              total: order.total,
              customerInfo: undefined,
              createdAt: new Date(order.date),
              updatedAt: new Date(order.date)
            }))
          }));
          
          set({ recentCustomers: mockCustomers });
          console.log('✅ Customer store initialized with centralized mock data');
        } catch (error) {
          console.error('Failed to initialize customer store from mock data:', error);
        }
      }
    }),
    {
      name: 'pos-customer-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        scannedCustomer: state.scannedCustomer,
        recentCustomers: state.recentCustomers,
      }),
    }
  )
);
