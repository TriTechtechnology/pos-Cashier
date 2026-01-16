/**
 * Next.js API Route Proxy for Till Close
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API PROXY - TILL CLOSE] ===== PROXY START =====');

    const body = await request.json();

    // Get tenant slug from env.local (used in URL path)
    const tenantSlug = process.env.NEXT_PUBLIC_TENANT_ID || 'extraction';

    // Get tenant ID from headers (for backward compatibility)
    const tenantId = request.headers.get('x-tenant-id') || tenantSlug;
    const authToken = request.headers.get('authorization');

    // Add tenantSlug to request body since JWT doesn't have it
    const requestBody = {
      ...body,
      tenantSlug: tenantSlug
    };

    console.log('🔍 [API PROXY - TILL CLOSE] Request headers:', {
      hasTenantId: !!tenantId,
      hasAuthToken: !!authToken,
      tenantSlug: tenantSlug,
      tenantId: tenantId,
      authTokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'NULL'
    });

    // DEBUG: Log ALL headers to diagnose missing Authorization
    console.log('🔍 [API PROXY - TILL CLOSE] All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${key.toLowerCase().includes('auth') ? value.substring(0, 20) + '...' : value}`);
    });

    if (!authToken) {
      console.error('❌ [API PROXY - TILL CLOSE] Missing authorization header');
      console.error('❌ [API PROXY - TILL CLOSE] Available headers:', Array.from(request.headers.keys()).join(', '));
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
    const fullEndpoint = `${apiUrl}/t/pos/till/close`;

    console.log('🔄 [API PROXY - TILL CLOSE] Forwarding till close request to backend:', {
      endpoint: fullEndpoint,
      posId: requestBody.posId,
      branchId: requestBody.branchId,
      tillSessionId: requestBody.tillSessionId,
      declaredClosingAmount: requestBody.declaredClosingAmount,
      systemClosingAmount: requestBody.systemClosingAmount,
      tenantSlug: requestBody.tenantSlug,
      hasCashCounts: !!requestBody.cashCounts,
      hasNotes: !!requestBody.notes
    });

    // 🔍 DEBUG: Log complete request body
    console.log('📤 [API PROXY - TILL CLOSE] Request body:', JSON.stringify(requestBody, null, 2));

    // Forward the request to the backend API
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-tenant-slug': tenantSlug,
        'Authorization': authToken,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 [API PROXY - TILL CLOSE] Backend response status:', response.status, response.statusText);

    // Get response text first for better error handling
    const responseText = await response.text();
    console.log('📄 [API PROXY - TILL CLOSE] Raw response text:', responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [API PROXY - TILL CLOSE] Failed to parse response as JSON:', parseError);
      console.error('❌ [API PROXY - TILL CLOSE] Response text was:', responseText);
      throw new Error(`Backend returned invalid JSON: ${responseText.substring(0, 200)}`);
    }

    // 🔍 DEBUG: Log complete response
    console.log('📥 [API PROXY - TILL CLOSE] Backend response data:', JSON.stringify(data, null, 2));

    console.log('📦 [API PROXY - TILL CLOSE] Backend response summary:', {
      status: response.status,
      ok: response.ok,
      success: data.success,
      hasToken: !!(data.result?.token || data.token),
      error: data.error,
      message: data.message
    });

    console.log('🔄 [API PROXY - TILL CLOSE] ===== PROXY END =====');

    // Return the backend response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [API PROXY - TILL CLOSE] Error:', error);
    console.error('❌ [API PROXY - TILL CLOSE] Error details:', {
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
