/**
 * Next.js API Route Proxy for PIN Login
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 *
 * PRODUCTION NOTE: Backend should configure CORS properly
 * This proxy is a development workaround
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tritechtechnologyllc.com';

    console.log('🔄 [API PROXY] Forwarding login request to backend:', {
      endpoint: `${apiUrl}/t/auth/login-pin`,
      hasPin: !!body.pin,
      pinLength: body.pin?.length,
      requestBody: body,
    });

    // Forward the request to the backend API
    const response = await fetch(`${apiUrl}/t/auth/login-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('🔄 [API PROXY] Backend responded with status:', response.status);

    const data = await response.json();

    console.log('📦 [API PROXY] Backend response:', {
      status: response.status,
      ok: response.ok,
      hasData: !!data,
      hasToken: !!(data.token || data.result?.token || data.access_token),
      hasUser: !!(data.user || data.result?.user),
      dataKeys: Object.keys(data),
    });

    // Log full response for debugging
    console.log('📦 [API PROXY] Full backend response:', JSON.stringify(data, null, 2));

    // Return the backend response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ [API PROXY] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
        message: 'Failed to connect to authentication server'
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
