/**
 * Next.js API Route Proxy for POS Terminals
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = request.url ? new URL(request.url) : { searchParams: new URLSearchParams() };
    const branchId = searchParams.get('branchId');

    // Get headers from request
    const tenantId = request.headers.get('x-tenant-id') ||
                     process.env.NEXT_PUBLIC_TENANT_ID ||
                     'extraction';
    const authToken = request.headers.get('authorization');

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.tritechtechnologyllc.com';

    console.log('🔄 [API PROXY - TERMINALS] Forwarding POS terminals request to backend:', {
      endpoint: `${apiUrl}/t/pos/terminals`,
      branchId,
      hasToken: !!authToken,
      tenantId,
    });

    // Build URL with query params
    const url = `${apiUrl}/t/pos/terminals${branchId ? `?branchId=${branchId}` : ''}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };

    // Add auth token if provided
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Forward the request to the backend API
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    console.log('📦 [API PROXY - TERMINALS] Backend response:', {
      status: response.status,
      ok: response.ok,
      terminals: data.result?.length || 0,
      hasResult: !!data.result,
      data: data,
    });

    // Return the backend response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [API PROXY - TERMINALS] Error:', error);
    console.error('❌ [API PROXY - TERMINALS] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
        message: 'Failed to connect to POS terminals service'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS preflight requests (CORS)
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
    },
  });
}
