/**
 * Next.js API Route Proxy for Till Open
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API PROXY - TILL OPEN] ===== PROXY START =====');

    const body = await request.json();

    // Get headers from request
    const tenantId = request.headers.get('x-tenant-id') ||
                     process.env.NEXT_PUBLIC_TENANT_ID ||
                     'extraction';
    const tenantSlug = tenantId; // Use same value for tenant slug
    const authToken = request.headers.get('authorization');

    console.log('🔍 [API PROXY - TILL OPEN] Request headers:', {
      hasTenantId: !!tenantId,
      hasAuthToken: !!authToken,
      tenantId: tenantId,
      authTokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'NULL'
    });

    // DEBUG: Log ALL headers to diagnose missing Authorization
    console.log('🔍 [API PROXY - TILL OPEN] All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${key.toLowerCase().includes('auth') ? value.substring(0, 20) + '...' : value}`);
    });

    if (!authToken) {
      console.error('❌ [API PROXY - TILL OPEN] Missing authorization header');
      console.error('❌ [API PROXY - TILL OPEN] Available headers:', Array.from(request.headers.keys()).join(', '));
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token',
          message: 'Authorization header is required'
        },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tritechtechnologyllc.com';
    const fullEndpoint = `${apiUrl}/t/pos/till/open`;

    console.log('🔄 [API PROXY - TILL OPEN] Forwarding till open request to backend:', {
      endpoint: fullEndpoint,
      posId: body.posId,
      branchId: body.branchId,
      openingAmount: body.openingAmount,
      hasCashCounts: !!body.cashCounts,
      hasNotes: !!body.notes
    });

    // 🔍 DEBUG: Log complete request body
    console.log('📤 [API PROXY - TILL OPEN] Request body:', JSON.stringify(body, null, 2));

    // Forward the request to the backend API
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-tenant-slug': tenantSlug,
        'Authorization': authToken,
      },
      body: JSON.stringify(body),
    });

    console.log('📡 [API PROXY - TILL OPEN] Backend response status:', response.status, response.statusText);

    const data = await response.json();

    // 🔍 DEBUG: Log complete response
    console.log('📥 [API PROXY - TILL OPEN] Backend response data:', JSON.stringify(data, null, 2));

    console.log('📦 [API PROXY - TILL OPEN] Backend response summary:', {
      status: response.status,
      ok: response.ok,
      success: data.success,
      hasTillSessionId: !!(data.result?.tillSessionId || data.tillSessionId),
      error: data.error,
      message: data.message
    });

    console.log('🔄 [API PROXY - TILL OPEN] ===== PROXY END =====');

    // Return the backend response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [API PROXY - TILL OPEN] Error:', error);
    console.error('❌ [API PROXY - TILL OPEN] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
        message: 'Failed to connect to till service'
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
