/**
 * Till Management API Service
 *
 * PURPOSE: Handle till session operations (open/close)
 * Integrated with clock-in/clock-out workflow
 *
 * ENDPOINTS:
 * - POST /t/pos/till/open - Open till session
 * - POST /t/pos/till/close - Close till session
 *
 * HEADERS: x-tenant-id, Authorization, Content-Type: application/json
 *
 * LINKS WITH:
 * - Till Store: Syncs local IndexedDB with backend
 * - Clock-in: Opens till when cashier clocks in
 * - Logout: Closes till when cashier logs out
 */

import type { CashCounts } from '@/types/pos';
import { getAuthToken } from './auth';

export interface OpenTillRequest {
  branchId: string;
  posId: string;
  openingAmount: number;
  cashCounts?: CashCounts;
  notes?: string;
}

export interface OpenTillResponse {
  success: boolean;
  tillSessionId?: string;
  error?: string;
  message?: string;
}

export interface CloseTillRequest {
  branchId: string;
  posId: string;
  tillSessionId: string;
  declaredClosingAmount: number;
  systemClosingAmount: number;
  cashCounts?: CashCounts;
  notes?: string;
}

export interface CloseTillResponse {
  success: boolean;
  token?: string; // Refreshed token with till context cleared
  error?: string;
  message?: string;
}

/**
 * Open a till session for a POS terminal
 *
 * @param request - Till opening details
 * @returns Till session ID and confirmation
 */
export async function openTill(request: OpenTillRequest): Promise<OpenTillResponse> {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'extraction';
    const token = getAuthToken();

    console.log('💰 [TILL API] ===== OPEN TILL START =====');
    console.log('🔍 [TILL API] Token retrieved:', token ? `${token.substring(0, 30)}... (length: ${token.length})` : 'NULL');

    if (!token) {
      console.error('❌ [TILL API] Missing authentication token');
      console.error('❌ [TILL API] Check localStorage for auth-token or pos-auth-storage');
      return {
        success: false,
        error: 'No authentication token',
        message: 'Please log in first',
      };
    }

    // Validate required fields
    if (!request.posId) {
      console.error('❌ [TILL API] Missing posId');
      return {
        success: false,
        error: 'Missing posId',
        message: 'POS terminal ID is required',
      };
    }

    if (!request.branchId) {
      console.error('❌ [TILL API] Missing branchId');
      return {
        success: false,
        error: 'Missing branchId',
        message: 'Branch ID is required',
      };
    }

    if (request.openingAmount === undefined || request.openingAmount < 0) {
      console.error('❌ [TILL API] Invalid opening amount');
      return {
        success: false,
        error: 'Invalid opening amount',
        message: 'Opening amount must be a positive number',
      };
    }

    // 🔄 Use Next.js API route proxy to avoid CORS issues
    const endpoint = '/api/till/open';

    console.log('💰 [TILL API] Opening till...', {
      endpoint,
      posId: request.posId,
      branchId: request.branchId,
      openingAmount: request.openingAmount,
      hasCashCounts: !!request.cashCounts,
      hasNotes: !!request.notes
    });

    // 🔍 DEBUG: Log complete request payload
    console.log('📤 [TILL API] Request payload:', JSON.stringify(request, null, 2));

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'Authorization': `Bearer ${token}`,
    };

    console.log('📋 [TILL API] Request headers:', {
      'Content-Type': headers['Content-Type'],
      'x-tenant-id': headers['x-tenant-id'],
      'Authorization': headers['Authorization'] ? `${headers['Authorization'].substring(0, 20)}...` : 'MISSING'
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    console.log('📡 [TILL API] Response status:', response.status, response.statusText);

    const data = await response.json();

    // 🔍 DEBUG: Log complete response
    console.log('📥 [TILL API] Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ [TILL API] Failed to open till:', {
        status: response.status,
        statusText: response.statusText,
        error: data.message || data.error,
        data
      });
      return {
        success: false,
        error: data.message || data.error || 'Failed to open till',
        message: data.message || 'Unable to open till session',
      };
    }

    console.log('✅ [TILL API] Till opened successfully');

    const tillSessionId = data.result?.tillSessionId || data.tillSessionId || data.id;

    console.log('🆔 [TILL API] Extracted till session ID:', tillSessionId);
    console.log('💰 [TILL API] ===== OPEN TILL END =====');

    return {
      success: true,
      tillSessionId,
    };
  } catch (error) {
    console.error('❌ [TILL API] Network error:', error);
    console.error('❌ [TILL API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      message: 'Unable to connect to server. Please check your internet connection.',
    };
  }
}

/**
 * Close a till session for a POS terminal
 *
 * @param request - Till closing details with cash reconciliation
 * @returns Success confirmation and refreshed token
 */
export async function closeTill(request: CloseTillRequest): Promise<CloseTillResponse> {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'extraction';
    const token = getAuthToken();

    console.log('💰 [TILL API] ===== CLOSE TILL START =====');
    console.log('🔍 [TILL API] Token retrieved:', token ? `${token.substring(0, 30)}... (length: ${token.length})` : 'NULL');

    if (!token) {
      console.error('❌ [TILL API] Missing authentication token');
      console.error('❌ [TILL API] Check localStorage for auth-token or pos-auth-storage');
      return {
        success: false,
        error: 'No authentication token',
        message: 'Please log in first',
      };
    }

    // Validate required fields
    if (!request.posId) {
      console.error('❌ [TILL API] Missing posId');
      return {
        success: false,
        error: 'Missing posId',
        message: 'POS terminal ID is required',
      };
    }

    if (!request.branchId) {
      console.error('❌ [TILL API] Missing branchId');
      return {
        success: false,
        error: 'Missing branchId',
        message: 'Branch ID is required',
      };
    }

    if (!request.tillSessionId) {
      console.error('❌ [TILL API] Missing tillSessionId');
      return {
        success: false,
        error: 'Missing tillSessionId',
        message: 'Till session ID is required',
      };
    }

    if (request.declaredClosingAmount === undefined || request.declaredClosingAmount < 0) {
      console.error('❌ [TILL API] Invalid declared closing amount');
      return {
        success: false,
        error: 'Invalid declared closing amount',
        message: 'Declared closing amount must be a positive number',
      };
    }

    // 🔄 Use Next.js API route proxy to avoid CORS issues
    const endpoint = '/api/till/close';

    console.log('💰 [TILL API] Closing till...', {
      endpoint,
      posId: request.posId,
      branchId: request.branchId,
      tillSessionId: request.tillSessionId,
      declaredAmount: request.declaredClosingAmount,
      systemAmount: request.systemClosingAmount,
      hasCashCounts: !!request.cashCounts,
      hasNotes: !!request.notes
    });

    // 🔍 DEBUG: Log complete request payload
    console.log('📤 [TILL API] Request payload:', JSON.stringify(request, null, 2));

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'Authorization': `Bearer ${token}`,
    };

    console.log('📋 [TILL API] Request headers:', {
      'Content-Type': headers['Content-Type'],
      'x-tenant-id': headers['x-tenant-id'],
      'Authorization': headers['Authorization'] ? `${headers['Authorization'].substring(0, 20)}...` : 'MISSING'
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    console.log('📡 [TILL API] Response status:', response.status, response.statusText);

    const data = await response.json();

    // 🔍 DEBUG: Log complete response
    console.log('📥 [TILL API] Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ [TILL API] Failed to close till:', {
        status: response.status,
        statusText: response.statusText,
        error: data.message || data.error,
        data
      });
      return {
        success: false,
        error: data.message || data.error || 'Failed to close till',
        message: data.message || 'Unable to close till session',
      };
    }

    console.log('✅ [TILL API] Till closed successfully');

    // Get refreshed token (API returns token with till context cleared)
    const newToken = data.result?.token || data.token;

    console.log('🔑 [TILL API] Refreshed token received:', !!newToken);
    console.log('💰 [TILL API] ===== CLOSE TILL END =====');

    return {
      success: true,
      token: newToken,
    };
  } catch (error) {
    console.error('❌ [TILL API] Network error:', error);
    console.error('❌ [TILL API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      message: 'Unable to connect to server. Please check your internet connection.',
    };
  }
}

/**
 * Check if user has an active till session
 *
 * @returns Whether an active till session exists
 */
/**
 * Get current active till session from backend
 * Endpoint: GET /t/pos/till/session
 */
export async function getTillSession(): Promise<{
  success: boolean;
  session?: {
    tillSessionId: string;
    openingAmount: number;
    openingCashCounts?: Record<string, number>;
    openingNotes?: string;
    openedAt: string;
  };
  error?: string;
}> {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'extraction';
    const token = getAuthToken();

    if (!token) {
      return {
        success: false,
        error: 'No authentication token',
      };
    }

    // Use Next.js API route proxy
    const endpoint = '/api/till/session';

    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'Authorization': `Bearer ${token}`,
    };

    console.log('🔍 [TILL API] Checking for active till session...');

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No active till session found
        console.log('ℹ️ [TILL API] No active till session found (404)');
        return {
          success: true,
          session: undefined,
        };
      }

      console.warn('⚠️ [TILL API] Failed to fetch till session:', response.status);
      return {
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    console.log('📦 [TILL API] Raw backend response:', data);

    // Parse the backend response structure
    // Expected: { status: 200, result: { tillSession: {...}, session: { hasTillSession: true } } }
    const result = data.result || data;
    const tillSession = result.tillSession;
    const hasTillSession = result.session?.hasTillSession;

    // Check if there's an active till session
    if (hasTillSession && tillSession && tillSession._id && tillSession.status === 'open') {
      console.log('✅ [TILL API] Found active till session:', {
        tillSessionId: tillSession._id,
        openingAmount: tillSession.openingAmount,
        openedAt: tillSession.openedAt,
        status: tillSession.status
      });

      return {
        success: true,
        session: {
          tillSessionId: tillSession._id,
          openingAmount: tillSession.openingAmount,
          openingCashCounts: tillSession.cashCounts || undefined,
          openingNotes: tillSession.notes || undefined,
          openedAt: tillSession.openedAt
        }
      };
    }

    // No active till session
    console.log('ℹ️ [TILL API] No active till session (hasTillSession:', hasTillSession, ')');
    return {
      success: true,
      session: undefined,
    };

  } catch (error) {
    console.error('❌ [TILL API] Error fetching till session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function checkActiveTill(): Promise<{ success: boolean; hasActiveTill: boolean; error?: string }> {
  // Use getTillSession for more comprehensive check
  const result = await getTillSession();

  return {
    success: result.success,
    hasActiveTill: !!result.session,
    error: result.error
  };
}

/**
 * Mock till operations for development/testing
 *
 * ⚠️ WARNING: ONLY USE IN DEVELOPMENT!
 */
export async function openTillMock(_request: OpenTillRequest): Promise<OpenTillResponse> {
  console.warn('🧪 [TILL API] ⚠️ USING MOCK TILL OPEN - NOT FOR PRODUCTION!');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    tillSessionId: `mock-till-${Date.now()}`,
  };
}

export async function closeTillMock(_request: CloseTillRequest): Promise<CloseTillResponse> {
  console.warn('🧪 [TILL API] ⚠️ USING MOCK TILL CLOSE - NOT FOR PRODUCTION!');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    token: 'mock-refreshed-token-' + Date.now(),
  };
}
