import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/till/session
 *
 * Proxy to backend: GET /t/pos/till/session
 * Gets the current active till session for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tritechtechnologyllc.com';

    if (!backendUrl) {
      return NextResponse.json(
        { success: false, error: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    // Get headers from request
    const tenantId = request.headers.get('x-tenant-id') ||
                     process.env.NEXT_PUBLIC_TENANT_ID ||
                     'extraction';
    const authToken = request.headers.get('authorization');

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Forward to backend
    const backendEndpoint = `${backendUrl}/t/pos/till/session`;

    console.log('🔄 [TILL SESSION PROXY] Forwarding GET request to:', backendEndpoint);

    const backendResponse = await fetch(backendEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'Authorization': authToken,
      },
    });

    const responseData = await backendResponse.json();

    // Forward the response
    return NextResponse.json(responseData, {
      status: backendResponse.status,
    });

  } catch (error) {
    console.error('❌ [TILL SESSION PROXY] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
