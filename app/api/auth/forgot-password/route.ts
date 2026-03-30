import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pageUrl = request.headers.get('X-Page-URL') || request.headers.get('Referer') || ''

    const response = await fetch(`${BACKEND_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(pageUrl && { 'X-Page-URL': pageUrl })
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Forgot password API error:', error);
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
