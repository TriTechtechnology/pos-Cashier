/**
 * Next.js API Route Proxy for ME API (Get Current User)
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 *
 * PRODUCTION NOTE: Backend should configure CORS properly
 * This proxy is a development workaround
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract authorization header and tenant ID
    const authHeader = request.headers.get('Authorization');
    const tenantId = request.headers.get('x-tenant-id');

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing authorization header',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tritechtechnologyllc.com';

    console.log('🔄 [ME API PROXY] Forwarding ME request to backend:', {
      endpoint: `${apiUrl}/t/auth/me`,
      hasAuth: !!authHeader,
      tenantId,
    });

    // Forward the request to the backend API
    const response = await fetch(`${apiUrl}/t/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        ...(tenantId && { 'x-tenant-id': tenantId }),
      },
    });

    console.log('🔄 [ME API PROXY] Backend responded with status:', response.status);

    const data = await response.json();

    console.log('📦 [ME API PROXY] Backend response:', {
      status: response.status,
      ok: response.ok,
      hasData: !!data,
      hasUser: !!(data.result),
      hasBranchConfig: !!(data.result?.branchConfig),
      branchName: data.result?.branchConfig?.branchName,
    });

    // Log full response for debugging
    console.log('📦 [ME API PROXY] Full backend response:', JSON.stringify(data, null, 2));

    // Return the backend response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ [ME API PROXY] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
        message: 'Failed to connect to authentication server',
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
