/**
 * Next.js API Route Proxy for POS Menu
 *
 * PURPOSE: Bypass CORS restrictions during development
 * - Frontend calls this route (same origin, no CORS)
 * - This route calls backend API (server-to-server, no CORS)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from URL
    const { searchParams } = request.url ? new URL(request.url) : { searchParams: new URLSearchParams() };

    // Get headers from request
    const authToken = request.headers.get('authorization');

    if (!authToken) {
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

    console.log('🔄 [API PROXY] Forwarding menu request to backend:', {
      endpoint: `${apiUrl}/t/pos/menu`,
      branchId: searchParams.get('branchId'),
    });

    // Build URL with query params
    const url = `${apiUrl}/t/pos/menu?${searchParams.toString()}`;

    // Forward the request to the backend API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
    });

    const data = await response.json();

    console.log('📦 [API PROXY] Backend response:', {
      status: response.status,
      ok: response.ok,
      categories: data.result?.categories?.length || 0,
    });

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
        message: 'Failed to connect to menu service'
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
