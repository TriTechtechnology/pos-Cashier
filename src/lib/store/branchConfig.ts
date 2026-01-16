/**
 * Branch Configuration Store
 *
 * PURPOSE: Manage branch-level POS configuration (Pay Now/Pay Later, Receipt Settings)
 * This store holds the configuration fetched from the API (login response or dedicated endpoint)
 *
 * LINKS WITH:
 * - Auth Store: Receives initial config from login/ME API
 * - Branch Config API: Fetches/updates configuration
 * - Payment Flow: Uses paymentMode to determine workflow
 * - Receipt Printing: Uses receiptConfig for customization
 *
 * STORAGE: LocalStorage (persisted across sessions)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BranchConfig, PaymentMode } from '@/types/pos';
import { getBranchConfig, updateBranchConfig, UpdateBranchConfigRequest } from '@/lib/api/branchConfig';

export interface BranchConfigStore {
  // State
  config: BranchConfig | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConfig: (config: BranchConfig) => void;
  fetchConfig: (branchId: string, tenantSlug: string) => Promise<void>;
  updateConfig: (branchId: string, tenantSlug: string, updates: UpdateBranchConfigRequest) => Promise<void>;
  clearConfig: () => void;
  clearError: () => void;

  // Selectors (convenience methods)
  getPaymentMode: () => PaymentMode;
  isPayNow: () => boolean;
  isPayLater: () => boolean;
  isTableServiceEnabled: () => boolean;
  isPaymentMethodEnabled: (method: 'cash' | 'card' | 'mobile') => boolean;
}

export const useBranchConfigStore = create<BranchConfigStore>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      isLoading: false,
      error: null,

      // Actions
      setConfig: (config) => {
        console.log('🏢 [BRANCH CONFIG STORE] Setting configuration:', config);
        set({ config, error: null });
      },

      fetchConfig: async (branchId: string, tenantSlug: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🏢 [BRANCH CONFIG STORE] Fetching configuration...', { branchId, tenantSlug });
          const config = await getBranchConfig(branchId, tenantSlug);

          set({
            config,
            isLoading: false,
            error: null,
          });

          console.log('✅ [BRANCH CONFIG STORE] Configuration fetched successfully');
        } catch (error) {
          console.error('❌ [BRANCH CONFIG STORE] Failed to fetch configuration:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch configuration',
            isLoading: false,
          });
        }
      },

      updateConfig: async (branchId: string, tenantSlug: string, updates: UpdateBranchConfigRequest) => {
        set({ isLoading: true, error: null });

        try {
          console.log('🏢 [BRANCH CONFIG STORE] Updating configuration...', { branchId, updates });
          const config = await updateBranchConfig(branchId, tenantSlug, updates);

          set({
            config,
            isLoading: false,
            error: null,
          });

          console.log('✅ [BRANCH CONFIG STORE] Configuration updated successfully');
        } catch (error) {
          console.error('❌ [BRANCH CONFIG STORE] Failed to update configuration:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update configuration',
            isLoading: false,
          });
          throw error; // Re-throw so UI can handle it
        }
      },

      clearConfig: () => {
        console.log('🏢 [BRANCH CONFIG STORE] Clearing configuration');
        set({
          config: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      // Selectors
      getPaymentMode: () => {
        const { config } = get();
        return config?.paymentMode || config?.posConfig?.paymentMode || 'payNow';
      },

      isPayNow: () => {
        const { getPaymentMode } = get();
        return getPaymentMode() === 'payNow';
      },

      isPayLater: () => {
        const { getPaymentMode } = get();
        return getPaymentMode() === 'payLater';
      },

      isTableServiceEnabled: () => {
        const { config } = get();
        return config?.enableTableService || config?.posConfig?.enableTableService || false;
      },

      isPaymentMethodEnabled: (method: 'cash' | 'card' | 'mobile') => {
        const { config } = get();
        const paymentMethods = config?.paymentMethods || config?.posConfig?.paymentMethods;
        return paymentMethods?.[method]?.enabled ?? true; // Default to enabled if not configured
      },
    }),
    {
      name: 'pos-branch-config-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);

// Convenience selectors for components
export const usePaymentMode = () => useBranchConfigStore((state) => state.getPaymentMode());
export const useIsPayNow = () => useBranchConfigStore((state) => state.isPayNow());
export const useIsPayLater = () => useBranchConfigStore((state) => state.isPayLater());
export const useIsTableServiceEnabled = () => useBranchConfigStore((state) => state.isTableServiceEnabled());
export const useBranchConfig = () => useBranchConfigStore((state) => state.config);
