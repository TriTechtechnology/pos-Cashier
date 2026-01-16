/**
 * Next.js API Route Proxy for POS Orders
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 *
 * ENDPOINT: POST /t/pos/orders
 * REQUEST: { branchId, posId, tillSessionId, customerName?, notes?, items[] }
 * RESPONSE: { status, message, result: { orderId, order } }
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API PROXY] ===== ORDER PROXY START =====');

    const body = await request.json();

    // Get tenant slug from env.local (used in URL path)
    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_ID || 'extraction';

    // Get headers from request
    const tenantId = request.headers.get('x-tenant-id') || tenantSlug;
    const authToken = request.headers.get('authorization');

    console.log('🔍 [API PROXY] Request headers:', {
      hasTenantId: !!tenantId,
      hasAuthToken: !!authToken,
      tenantSlug: tenantSlug,
      tenantId: tenantId,
      authTokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'NULL'
    });

    // DEBUG: Log ALL headers to diagnose missing Authorization
    console.log('🔍 [API PROXY] All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${key.toLowerCase().includes('auth') ? value.substring(0, 20) + '...' : value}`);
    });

    if (!authToken) {
      console.error('❌ [API PROXY] Missing authorization header');
      console.error('❌ [API PROXY] Available headers:', Array.from(request.headers.keys()).join(', '));
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token',
          message: 'Authorization header is required'
        },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.tritechtechnologyllc.com';
    const fullEndpoint = `${apiUrl}/t/pos/orders`;

    console.log('🔄 [API PROXY] Forwarding order placement to backend:', {
      endpoint: fullEndpoint,
      branchId: body.branchId,
      posId: body.posId,
      tillSessionId: body.tillSessionId,
      itemCount: body.items?.length || 0,
      customerName: body.customerName,
      hasNotes: !!body.notes
    });

    // 🔍 DEBUG: Log complete request body
    console.log('📤 [API PROXY] Request body:', JSON.stringify(body, null, 2));

    // Forward the request to the backend API
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'Authorization': authToken,
      },
      body: JSON.stringify(body),
    });

    console.log('📡 [API PROXY] Backend response status:', response.status, response.statusText);

    // Get response text first for better error handling
    const responseText = await response.text();
    console.log('📄 [API PROXY] Raw response text:', responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [API PROXY] Failed to parse response as JSON:', parseError);
      console.error('❌ [API PROXY] Response text was:', responseText);
      throw new Error(`Backend returned invalid JSON: ${responseText.substring(0, 200)}`);
    }

    // 🔍 DEBUG: Log complete response
    console.log('📥 [API PROXY] Backend response data:', JSON.stringify(data, null, 2));

    console.log('📦 [API PROXY] Backend response summary:', {
      status: response.status,
      ok: response.ok,
      hasOrderId: !!(data.result?.orderId || data.orderId),
      success: data.success,
      error: data.error,
      message: data.message
    });

    console.log('🔄 [API PROXY] ===== ORDER PROXY END =====');

    // Return the backend response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [API PROXY] Error:', error);
    console.error('❌ [API PROXY] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
        message: 'Failed to connect to order service'
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
