import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendWithFallback, getBackendUnavailableMessage, isBackendNetworkError } from '@/lib/backend-url'

export async function POST(request: NextRequest) {
  let pageUrl = ''

  try {
    const body = await request.json();

    pageUrl = request.headers.get('X-Page-URL') || request.headers.get('Referer') || ''

    const response = await fetchBackendWithFallback('/api/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(pageUrl && { 'X-Page-URL': pageUrl })
      },
      body: JSON.stringify(body),
    }, pageUrl);

    const raw = await response.text()
    let data: any

    try {
      data = raw ? JSON.parse(raw) : { success: false, message: 'Empty response from backend' }
    } catch {
      data = {
        success: false,
        message: raw?.trim() || 'Backend returned a non-JSON response',
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Forgot password API error:', error);
    if (isBackendNetworkError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: getBackendUnavailableMessage(pageUrl),
          errors: null,
        },
        { status: 502 },
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process forgot password request',
        errors: null 
      },
      { status: 500 }
    );
  }
}
