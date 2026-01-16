/**
 * Next.js API Route Proxy for Print Receipt
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    console.log('🔄 [API PROXY - PRINT RECEIPT] ===== PROXY START =====');

    const { orderId } = await params;

    if (!orderId) {
      console.error('❌ [API PROXY - PRINT RECEIPT] Missing orderId parameter');
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
          message: 'Missing orderId in request'
        },
        { status: 400 }
      );
    }

    // Get tenant ID from request headers or env
    const tenantId = request.headers.get('x-tenant-id') ||
                     process.env.NEXT_PUBLIC_TENANT_ID ||
                     'extraction';
    const authToken = request.headers.get('authorization');

    console.log('🔍 [API PROXY - PRINT RECEIPT] Request details:', {
      orderId: orderId,
      hasTenantId: !!tenantId,
      hasAuthToken: !!authToken,
      tenantId: tenantId,
      authTokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'NULL'
    });

    // DEBUG: Log ALL headers to diagnose missing Authorization
    console.log('🔍 [API PROXY - PRINT RECEIPT] All request headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${key.toLowerCase().includes('auth') ? value.substring(0, 20) + '...' : value}`);
    });

    if (!authToken) {
      console.error('❌ [API PROXY - PRINT RECEIPT] Missing authorization header');
      console.error('❌ [API PROXY - PRINT RECEIPT] Available headers:', Array.from(request.headers.keys()).join(', '));
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
    const fullEndpoint = `${apiUrl}/t/pos/orders/${orderId}/print`;

    // Request body - thermal format as per Postman collection
    const requestBody = {
      format: 'thermal'
    };

    console.log('🔄 [API PROXY - PRINT RECEIPT] Forwarding print request to backend:', {
      endpoint: fullEndpoint,
      orderId: orderId,
      format: requestBody.format
    });

    // 🔍 DEBUG: Log complete request body
    console.log('📤 [API PROXY - PRINT RECEIPT] Request body:', JSON.stringify(requestBody, null, 2));

    // Forward the request to the backend API
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'Authorization': authToken,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 [API PROXY - PRINT RECEIPT] Backend response status:', response.status, response.statusText);

    // Get response text first for better error handling
    const responseText = await response.text();
    console.log('📄 [API PROXY - PRINT RECEIPT] Raw response text:', responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [API PROXY - PRINT RECEIPT] Failed to parse response as JSON:', parseError);
      console.error('❌ [API PROXY - PRINT RECEIPT] Response text was:', responseText);
      throw new Error(`Backend returned invalid JSON: ${responseText.substring(0, 200)}`);
    }

    // 🔍 DEBUG: Log complete response
    console.log('📥 [API PROXY - PRINT RECEIPT] Backend response data:', JSON.stringify(data, null, 2));

    console.log('📦 [API PROXY - PRINT RECEIPT] Backend response summary:', {
      status: response.status,
      ok: response.ok,
      success: data.success,
      error: data.error,
      message: data.message
    });

    console.log('🔄 [API PROXY - PRINT RECEIPT] ===== PROXY END =====');

    // Return the backend response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [API PROXY - PRINT RECEIPT] Error:', error);
    console.error('❌ [API PROXY - PRINT RECEIPT] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
        message: 'Failed to connect to print service'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
    },
  });
}
