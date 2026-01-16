/**
 * API Client - Authenticated Request Utility
 *
 * PURPOSE: Centralized API client that automatically includes authentication tokens
 * in all requests. Ensures secure communication with the backend.
 *
 * USAGE:
 * - import { apiClient } from '@/lib/utils/apiClient'
 * - const response = await apiClient.get('/endpoint')
 * - const response = await apiClient.post('/endpoint', data)
 *
 * SECURITY:
 * - All requests include Authorization header with JWT token
 * - Automatically handles token expiration
 * - Redirects to login if unauthorized
 */

import { getAuthToken } from '@/lib/api/auth';

export interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean; // Default: true
  tenantId?: string; // Override default tenant ID
}

/**
 * Make an authenticated API request
 *
 * @param endpoint - API endpoint (e.g., '/orders', '/menu')
 * @param options - Fetch options with auth settings
 * @returns Response data
 */
async function request<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    requireAuth = true,
    tenantId,
    headers = {},
    ...fetchOptions
  } = options;

  // Use NEXT_PUBLIC_API_URL (matches .env.local)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tritechtechnologyllc.com';

  // Build full URL
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Only add x-tenant-id if explicitly provided
  if (tenantId) {
    requestHeaders['x-tenant-id'] = tenantId;
  }

  // Add authorization header if required
  if (requireAuth) {
    const token = getAuthToken();

    if (!token) {
      console.error('❌ [API CLIENT] No auth token found - redirecting to login');

      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }

      throw new Error('Authentication required - no token found');
    }

    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  console.log('🌐 [API CLIENT] Making request:', {
    method: fetchOptions.method || 'GET',
    endpoint,
    requireAuth,
    hasToken: !!getAuthToken(),
  });

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Handle unauthorized (401) - token expired or invalid
    if (response.status === 401) {
      console.error('❌ [API CLIENT] Unauthorized - token invalid or expired');

      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('pos-auth-storage');
        window.location.href = '/';
      }

      throw new Error('Authentication expired - please login again');
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [API CLIENT] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      throw new Error(errorData.message || errorData.error || `Request failed: ${response.statusText}`);
    }

    // Parse response
    const data = await response.json();

    console.log('✅ [API CLIENT] Request successful');

    return data;
  } catch (error) {
    console.error('❌ [API CLIENT] Request error:', error);
    throw error;
  }
}

/**
 * API Client object with HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

/**
 * Example usage:
 *
 * // Get today's orders
 * const orders = await apiClient.get('/orders/today');
 *
 * // Create a new order
 * const newOrder = await apiClient.post('/orders', { items: [...] });
 *
 * // Update order status
 * const updated = await apiClient.patch('/orders/123', { status: 'completed' });
 *
 * // Delete order
 * await apiClient.delete('/orders/123');
 *
 * // Public endpoint (no auth required)
 * const menu = await apiClient.get('/menu', { requireAuth: false });
 */
