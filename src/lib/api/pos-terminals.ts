/**
 * POS Terminals API Service
 *
 * PURPOSE: Manage POS terminals for branches
 * Fetches available terminals for POS selection during login
 *
 * ENDPOINT: GET /t/pos/terminals
 * HEADERS: x-tenant-id, Authorization
 *
 * LINKS WITH:
 * - Login Flow: POS dropdown selection
 * - Till Management: Each till session requires a POS terminal
 */

import type { POSTerminal } from '@/types/pos';
import { getAuthToken } from './auth';

export interface GetTerminalsRequest {
  branchId: string;
}

export interface GetTerminalsResponse {
  success: boolean;
  terminals?: POSTerminal[];
  error?: string;
  message?: string;
}

/**
 * Fetch available POS terminals for a branch
 *
 * 🎯 PUBLIC API - No authentication required
 * This endpoint is accessible without a token (used during login)
 *
 * @param branchId - Branch ID to filter terminals
 * @returns List of active POS terminals
 */
export async function getPOSTerminals(branchId: string): Promise<GetTerminalsResponse> {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'extraction';
    const token = getAuthToken();

    // 🔄 Use Next.js API route proxy to avoid CORS issues
    const endpoint = '/api/pos/terminals';

    console.log('🖥️ [POS TERMINALS API] Fetching terminals from PUBLIC API...', {
      endpoint,
      branchId,
      tenantId,
      hasToken: !!token,
    });

    const url = `${endpoint}?branchId=${branchId}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };

    // Add auth token if available (optional for this public endpoint)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    console.log('📥 [POS TERMINALS API] Backend response:', {
      status: response.status,
      ok: response.ok,
      hasResult: !!data.result,
      terminalsCount: data.result?.length || 0,
      data,
    });

    if (!response.ok) {
      console.error('❌ [POS TERMINALS API] Failed to fetch terminals:', {
        status: response.status,
        error: data.message || data.error,
        data,
      });

      return {
        success: false,
        error: data.message || data.error || 'Failed to fetch POS terminals',
        message: data.message || 'Unable to fetch POS terminals',
      };
    }

    console.log('✅ [POS TERMINALS API] Fetched terminals successfully');

    // Extract terminals from response
    // Backend returns: { result: { items: [...], count: 3, page: 1, limit: 20 } }
    const rawTerminals = data.result?.items || data.result || data.terminals || data;

    console.log('📋 [POS TERMINALS API] Raw terminals:', {
      rawTerminals,
      isArray: Array.isArray(rawTerminals),
      count: Array.isArray(rawTerminals) ? rawTerminals.length : 0
    });

    // Map MongoDB _id to id for frontend compatibility
    const terminals = Array.isArray(rawTerminals)
      ? rawTerminals.map(terminal => ({
          ...terminal,
          id: terminal._id || terminal.id, // Use _id if available, fallback to id
        }))
      : [];

    console.log('✅ [POS TERMINALS API] Mapped terminals:', {
      count: terminals.length,
      terminals: terminals.map(t => ({ id: t.id, name: t.name }))
    });

    return {
      success: true,
      terminals,
    };
  } catch (error) {
    console.error('❌ [POS TERMINALS API] Network error:', error);
    console.error('❌ [POS TERMINALS API] Error details:', {
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
 * Mock POS terminals for development/testing
 * Uses REAL terminals from your backend API
 *
 * ⚠️ WARNING: ONLY USE IN DEVELOPMENT!
 */
export async function getPOSTerminalsMock(_branchId: string): Promise<GetTerminalsResponse> {
  console.warn('🧪 [POS TERMINALS API] ⚠️ USING MOCK DATA - NOT FOR PRODUCTION!');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Real POS terminals from your backend API
  const mockTerminals: POSTerminal[] = [
    {
      id: '694aa3b2f3d9ef02eb447de4',
      branchId: '694aa2b1f3d9ef02eb447da8',
      machineId: 'Terminal-03',
      name: 'Take Away',
      status: 'active',
      metadata: { ip: '10.0.0.3' },
      createdAt: new Date('2025-12-03T21:45:22.340Z'),
      updatedAt: new Date('2025-12-03T21:45:22.340Z'),
    },
    {
      id: '6930a8c60c420f81ac44e8cd',
      branchId: '694aa2b1f3d9ef02eb447da8',
      machineId: 'Terminal-02',
      name: 'Ground Floor',
      status: 'active',
      metadata: { ip: '10.0.0.2' },
      createdAt: new Date('2025-12-03T21:16:54.864Z'),
      updatedAt: new Date('2025-12-03T21:16:54.864Z'),
    },
  ];

  console.log('🧪 [POS TERMINALS MOCK] Using REAL backend terminals:', mockTerminals.map(t => ({ id: t.id, name: t.name })));

  return {
    success: true,
    terminals: mockTerminals,
  };
}
