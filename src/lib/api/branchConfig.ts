/**
 * Branch Configuration API Service
 *
 * PURPOSE: Handle branch POS configuration (Pay Now/Pay Later, Receipt Settings)
 * Follows the API specification from Postman collection
 *
 * ENDPOINTS:
 * - GET /t/branches/:branchId/pos-config - Get branch configuration
 * - PUT /t/branches/:branchId/pos-config - Update branch configuration
 *
 * LINKS WITH:
 * - Branch Config Store: Updates configuration state
 * - Auth Store: Gets branchConfig from login/ME responses
 */

import { apiClient } from '@/lib/utils/apiClient';
import type { BranchConfig, POSConfig } from '@/types/pos';

export interface BranchConfigResponse {
  status: number;
  message: string;
  result: {
    branchId: string;
    branchName: string;
    currency: string;
    timezone?: string;
    tax?: {
      mode: 'inclusive' | 'exclusive';
      rate: number;
      vatNumber?: string;
    };
    posConfig?: POSConfig;
  };
}

export interface UpdateBranchConfigRequest {
  // Payment settings
  paymentMode?: 'payNow' | 'payLater';
  enableTableService?: boolean;
  enableHoldOrders?: boolean;
  orderPrefix?: string;
  receiptFooter?: string;

  // Receipt customization
  receiptConfig?: {
    showLogo?: boolean;
    logoUrl?: string;
    showQRCode?: boolean;
    qrCodeData?: string;
    headerText?: string;
    footerText?: string;
    showTaxBreakdown?: boolean;
    showItemCodes?: boolean;
    paperWidth?: number;
    fontSizeMultiplier?: number;
  };

  // Payment methods
  paymentMethods?: {
    cash?: {
      enabled?: boolean;
      taxRateOverride?: number | null;
    };
    card?: {
      enabled?: boolean;
      taxRateOverride?: number | null;
      minAmount?: number;
    };
    mobile?: {
      enabled?: boolean;
      taxRateOverride?: number | null;
    };
  };
}

/**
 * Get branch POS configuration
 *
 * @param branchId - Branch ID
 * @param tenantSlug - Tenant slug for x-tenant-id header
 * @returns Branch configuration
 */
export async function getBranchConfig(
  branchId: string,
  tenantSlug: string
): Promise<BranchConfig> {
  try {
    console.log('🏢 [BRANCH CONFIG API] Fetching configuration...', { branchId, tenantSlug });

    const response = await apiClient.get<BranchConfigResponse>(
      `/t/branches/${branchId}/pos-config`,
      { tenantId: tenantSlug }
    );

    console.log('✅ [BRANCH CONFIG API] Configuration fetched successfully');

    // Map API response to BranchConfig
    const result = response.result;
    return {
      branchId: result.branchId,
      branchName: result.branchName,
      currency: result.currency,
      timezone: result.timezone,
      tax: result.tax,
      posConfig: result.posConfig,
      // Flattened fields for easier access
      paymentMode: result.posConfig?.paymentMode,
      enableTableService: result.posConfig?.enableTableService,
      receiptConfig: result.posConfig?.receiptConfig,
      paymentMethods: result.posConfig?.paymentMethods,
    };
  } catch (error) {
    console.error('❌ [BRANCH CONFIG API] Failed to fetch configuration:', error);
    throw error;
  }
}

/**
 * Update branch POS configuration
 *
 * @param branchId - Branch ID
 * @param tenantSlug - Tenant slug for x-tenant-id header
 * @param updates - Configuration updates
 * @returns Updated branch configuration
 */
export async function updateBranchConfig(
  branchId: string,
  tenantSlug: string,
  updates: UpdateBranchConfigRequest
): Promise<BranchConfig> {
  try {
    console.log('🏢 [BRANCH CONFIG API] Updating configuration...', { branchId, updates });

    const response = await apiClient.put<BranchConfigResponse>(
      `/t/branches/${branchId}/pos-config`,
      updates,
      { tenantId: tenantSlug }
    );

    console.log('✅ [BRANCH CONFIG API] Configuration updated successfully');

    // Map API response to BranchConfig
    const result = response.result;
    return {
      branchId: result.branchId,
      branchName: result.branchName,
      currency: result.currency,
      timezone: result.timezone,
      tax: result.tax,
      posConfig: result.posConfig,
      // Flattened fields for easier access
      paymentMode: result.posConfig?.paymentMode,
      enableTableService: result.posConfig?.enableTableService,
      receiptConfig: result.posConfig?.receiptConfig,
      paymentMethods: result.posConfig?.paymentMethods,
    };
  } catch (error) {
    console.error('❌ [BRANCH CONFIG API] Failed to update configuration:', error);
    throw error;
  }
}
