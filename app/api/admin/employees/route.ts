import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/api'

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    // All Admin API routes in Laravel are prefixed with /api/...
    // Based on routes/admin.php: Route::apiResource('employees', EmployeeController::class);
    const backendUrl = `${getApiUrl()}/api/employees${queryString ? `?${queryString}` : ''}`

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    // Forward Content-Type if present
    const contentType = request.headers.get('Content-Type')
    if (contentType) {
      headers['Content-Type'] = contentType
    }

    // Forward Authorization token from cookies if present
    const token = request.cookies.get('token')?.value
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      cache: 'no-store',
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      fetchOptions.body = await request.text()
    }

    const response = await fetch(backendUrl, fetchOptions)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error(`[Employee Proxy] ${request.method} Error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while connecting to backend',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

export const GET = handler
export const POST = handler
