/**
 * Next.js API Route Proxy for Till Status Check
 *
 * PURPOSE: Check if user has an active till session
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [API PROXY - TILL CHECK] ===== CHECK START =====');

    // Get headers from request
    const tenantId = request.headers.get('x-tenant-id') ||
                     process.env.NEXT_PUBLIC_TENANT_ID ||
                     'extraction';
    const authToken = request.headers.get('authorization');

    console.log('🔍 [API PROXY - TILL CHECK] Request headers:', {
      hasTenantId: !!tenantId,
      hasAuthToken: !!authToken,
      tenantId: tenantId,
    });

    if (!authToken) {
      console.error('❌ [API PROXY - TILL CHECK] Missing authorization header');
      return NextResponse.json(
        {
          success: false,
          hasActiveTill: false,
          error: 'No authentication token'
        },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tritechtechnologyllc.com';
    const fullEndpoint = `${apiUrl}/t/pos/till/check`;

    console.log('🔄 [API PROXY - TILL CHECK] Checking till status at:', fullEndpoint);

    // Forward the request to the backend API
    const response = await fetch(fullEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'Authorization': authToken,
      },
    });

    console.log('📡 [API PROXY - TILL CHECK] Backend response status:', response.status);

    // If endpoint doesn't exist (404), assume no active till
    if (response.status === 404) {
      console.log('ℹ️ [API PROXY - TILL CHECK] Endpoint not found - assuming no active till');
      return NextResponse.json({
        success: true,
        hasActiveTill: false
      });
    }

    const data = await response.json();

    console.log('📥 [API PROXY - TILL CHECK] Backend response:', JSON.stringify(data, null, 2));
    console.log('🔄 [API PROXY - TILL CHECK] ===== CHECK END =====');

    // Return the backend response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [API PROXY - TILL CHECK] Error:', error);

    return NextResponse.json(
      {
        success: false,
        hasActiveTill: false,
        error: error instanceof Error ? error.message : 'Proxy error'
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
