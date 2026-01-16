/**
 * Authentication API Service
 *
 * PURPOSE: Handle PIN-based authentication for cashiers
 * Follows the API specification from Postman collection
 *
 * ENDPOINT: POST /api/auth/login-pin
 * HEADERS: Content-Type: application/json
 *
 * LINKS WITH:
 * - Auth Store: Updates user state after successful login
 */

import type { BranchConfig } from '@/types/pos';

export interface PinLoginRequest {
  employeeId: string;
  pin: string;
}

export interface PinLoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'cashier' | 'manager' | 'waiter' | 'admin';
    permissions: string[];
    branchId?: string; // Optional: backend may provide for till management
    tenantId?: string; // Optional: backend may provide for tenant context
    posId?: string; // Optional: backend may provide for terminal tracking
  };
  branchConfig?: BranchConfig; // Branch configuration from login response
  message?: string;
  error?: string;
}

/**
 * Authenticate a staff user via Employee ID and PIN
 *
 * @param employeeId - Employee ID (e.g., "EMP-A7K3M2")
 * @param pin - 6-digit PIN code
 * @param role - User role (cashier/manager/waiter) - optional, may come from API
 * @returns Authentication response with token and user data
 */
export async function loginWithPin(
  employeeId: string,
  pin: string,
  role?: 'cashier' | 'manager' | 'waiter'
): Promise<PinLoginResponse> {
  try {
    // Send Employee ID and PIN to backend
    const requestBody: PinLoginRequest = {
      employeeId,
      pin,
    };

    // Use Next.js API route proxy to avoid CORS issues in development
    const endpoint = '/api/auth/login-pin';

    console.log('🔐 [AUTH API] Logging in with PIN...', {
      endpoint,
      role,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 🔍 DEBUG: Log the complete API response
    console.log('📦 [AUTH API] Complete API Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ [AUTH API] Login failed:', data);
      return {
        success: false,
        error: data.message || data.error || 'Authentication failed',
        message: data.message || 'Invalid PIN or credentials',
      };
    }

    console.log('✅ [AUTH API] Login successful - Status:', response.status);

    // Extract data from the API response structure
    // API returns: { status: 200, message: "...", result: { token, user } }
    const result = data.result || data;
    const token = result.token || data.token || data.access_token || data.accessToken;
    const userData = result.user || data.user || data.staff || data;

    console.log('🔍 [AUTH API] Extracted token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    console.log('🔍 [AUTH API] Extracted user:', userData);

    // Validate we have the required data
    if (!token) {
      console.error('❌ [AUTH API] Token not found in response. Response keys:', Object.keys(data));
      return {
        success: false,
        error: 'No authentication token in API response',
        message: 'Server did not return authentication token',
      };
    }

    if (!userData || !userData._id) {
      console.error('❌ [AUTH API] User data not found in response');
      return {
        success: false,
        error: 'No user data in API response',
        message: 'Server did not return user information',
      };
    }

    // Extract role from roles array or use selected role
    const userRole = userData.roles?.[0] || role || 'cashier';

    // Extract tenant context from backend response
    const branchId = userData.branchId || userData.branch?._id || result.branchId;
    const tenantId = userData.tenantId || userData.tenant?._id || result.tenantId;
    const posId = userData.posId || userData.pos?._id || result.posId;

    // Extract branchConfig from API response
    const branchConfig = result.branchConfig || data.branchConfig;
    if (branchConfig) {
      console.log('✅ [AUTH API] Branch configuration received from login:', {
        branchId: branchConfig.branchId,
        paymentMode: branchConfig.paymentMode || branchConfig.posConfig?.paymentMode,
        enableTableService: branchConfig.enableTableService || branchConfig.posConfig?.enableTableService,
      });
    }

    // Store tenant context in cookies for API calls
    if (typeof window !== 'undefined') {
      if (branchId) {
        document.cookie = `pos-branch-id=${branchId}; path=/; max-age=2592000`; // 30 days
        console.log('✅ [AUTH API] Branch ID stored in cookie:', branchId);
      }
      if (tenantId) {
        document.cookie = `pos-tenant-id=${tenantId}; path=/; max-age=2592000`; // 30 days
        console.log('✅ [AUTH API] Tenant ID stored in cookie:', tenantId);
      }
      if (posId) {
        document.cookie = `pos-terminal-id=${posId}; path=/; max-age=2592000`; // 30 days
        console.log('✅ [AUTH API] POS ID stored in cookie:', posId);
      }
    }

    // Map API response to our expected format
    const mappedResponse = {
      success: true,
      token: token,
      user: {
        id: userData._id || userData.id || '',
        name: userData.fullName || userData.name || userData.username || 'User',
        email: userData.email || '',
        role: userRole as 'cashier' | 'manager' | 'waiter' | 'admin',
        permissions: userData.permissions || ['pos.access', 'orders.create', 'orders.view'],
        ...(branchId && { branchId }), // Only include if provided by backend
        ...(tenantId && { tenantId }), // Only include if provided by backend
        ...(posId && { posId }), // Only include if provided by backend
      },
      ...(branchConfig && { branchConfig }), // Include branch configuration if provided
    };

    console.log('✅ [AUTH API] Mapped response:', {
      hasToken: !!mappedResponse.token,
      userId: mappedResponse.user.id,
      userName: mappedResponse.user.name,
      userRole: mappedResponse.user.role,
      hasBranchId: !!mappedResponse.user.branchId,
      hasTenantId: !!mappedResponse.user.tenantId,
      hasPosId: !!mappedResponse.user.posId,
    });

    return mappedResponse;
  } catch (error) {
    console.error('❌ [AUTH API] Network error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      message: 'Unable to connect to server. Please check your internet connection.',
    };
  }
}

/**
 * Mock authentication for development/testing
 *
 * ⚠️ WARNING: ONLY USE IN DEVELOPMENT!
 * - Set NEXT_PUBLIC_ENABLE_MOCK_DATA=false in production
 * - Mock mode bypasses real API authentication
 * - Should never be enabled in production environments
 *
 * Falls back to this if ENABLE_MOCK_DATA is true
 */
export async function loginWithPinMock(
  employeeId: string,
  pin: string,
  role: 'cashier' | 'manager' | 'waiter'
): Promise<PinLoginResponse> {
  console.warn('🧪 [AUTH API] ⚠️ USING MOCK AUTHENTICATION - NOT FOR PRODUCTION!');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Accept any Employee ID and 6-digit PIN in mock mode
  if (employeeId && pin.length === 6) {
    return {
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'mock-user-1',
        name: 'Test User',
        email: `${role}@test.com`,
        role,
        permissions: ['pos.access', 'orders.create', 'orders.view'],
        branchId: '694aa2b1f3d9ef02eb447da8', // Mock branch ID for testing
        tenantId: 'extraction', // Mock tenant ID for testing
        posId: '6930a8c60c420f81ac44e8cd', // Mock POS ID for testing
      },
    };
  }

  return {
    success: false,
    error: 'Invalid PIN',
    message: 'PIN must be 6 digits',
  };
}

/**
 * Get current user info (ME API)
 * Fetches fresh user data and branchConfig from backend
 */
export async function getCurrentUser(): Promise<PinLoginResponse> {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
        message: 'Please login first',
      };
    }

    // Get tenant ID from cookie
    const cookies = typeof window !== 'undefined' ? document.cookie : '';
    const tenantIdMatch = cookies.match(/pos-tenant-id=([^;]+)/);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : '';

    console.log('👤 [AUTH API] Fetching current user (ME API)...', { tenantId });

    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [AUTH API] ME API failed:', data);
      return {
        success: false,
        error: data.message || data.error || 'Failed to fetch user info',
        message: data.message || 'Unable to fetch user information',
      };
    }

    console.log('✅ [AUTH API] ME API successful');

    // Extract data from the API response structure
    const result = data.result || data;
    const userData = result;

    // Extract branchConfig from response
    const branchConfig = result.branchConfig;
    if (branchConfig) {
      console.log('✅ [AUTH API] Branch configuration received from ME API:', {
        branchId: branchConfig.branchId,
        branchName: branchConfig.branchName,
        paymentMode: branchConfig.paymentMode,
      });
    }

    // Extract role from roles array
    const userRole = userData.roles?.[0] || 'cashier';

    // Extract tenant context
    const branchId = userData.assignedBranchId || userData.branchIds?.[0];
    const posId = userData.posIds?.[0];

    // Map response to our format
    const mappedResponse: PinLoginResponse = {
      success: true,
      token: token, // Use existing token
      user: {
        id: userData._id || userData.id || '',
        name: userData.fullName || userData.name || 'User',
        email: userData.email || '',
        role: userRole as 'cashier' | 'manager' | 'waiter' | 'admin',
        permissions: userData.permissions || ['pos.access', 'orders.create', 'orders.view'],
        ...(branchId && { branchId }),
        ...(posId && { posId }),
      },
      ...(branchConfig && { branchConfig }),
    };

    console.log('✅ [AUTH API] ME API mapped response:', {
      hasToken: !!mappedResponse.token,
      userId: mappedResponse.user?.id,
      userName: mappedResponse.user?.name,
      hasBranchConfig: !!mappedResponse.branchConfig,
      branchName: branchConfig?.branchName,
    });

    return mappedResponse;
  } catch (error) {
    console.error('❌ [AUTH API] ME API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      message: 'Unable to connect to server',
    };
  }
}

/**
 * Logout function - clears token and user data
 */
export async function logout(): Promise<void> {
  console.log('🚪 [AUTH API] Logging out...');

  // Clear all auth-related data from localStorage and cookies
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('pos-auth-storage');
    localStorage.removeItem('pos-session');

    // Clear tenant context cookies
    document.cookie = 'pos-branch-id=; path=/; max-age=0';
    document.cookie = 'pos-tenant-id=; path=/; max-age=0';
    document.cookie = 'pos-terminal-id=; path=/; max-age=0';
  }

  console.log('✅ [AUTH API] Logout complete');
}

/**
 * Get stored auth token
 *
 * BULLETPROOF: Checks multiple storage locations
 * 1. First checks 'auth-token' (direct storage)
 * 2. Falls back to Zustand persist 'pos-auth-storage' if needed
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Primary: Check direct token storage
  const directToken = localStorage.getItem('auth-token');
  if (directToken) {
    console.log('✅ [AUTH] Token found in auth-token');
    return directToken;
  }

  // Fallback: Check Zustand persist storage
  try {
    const authStorage = localStorage.getItem('pos-auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const zustandToken = parsed?.state?.token;
      if (zustandToken) {
        console.log('✅ [AUTH] Token found in pos-auth-storage (Zustand persist)');
        // Also save to direct storage for next time
        localStorage.setItem('auth-token', zustandToken);
        return zustandToken;
      }
    }
  } catch (error) {
    console.error('❌ [AUTH] Failed to parse pos-auth-storage:', error);
  }

  console.error('❌ [AUTH] No token found in any storage location');
  return null;
}

/**
 * Store auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth-token', token);
}
