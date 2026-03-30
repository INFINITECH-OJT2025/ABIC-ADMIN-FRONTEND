import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface BackendResponse {
  success: boolean
  message: string
  data?: {
    id: number
    name: string
    email: string
    role: string
    email_verified_at?: string
    created_at: string
    updated_at: string
  }
  errors?: Record<string, string[]>
}

const ALLOWED_ROLES = new Set(['super_admin', 'super_admin_viewer', 'admin'])

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Not authenticated',
          errors: null
        }, 
        { status: 401 }
      )
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    const backendRes = await fetch(`${backendUrl}/api/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0'
      }
    })

    let data: BackendResponse
    try {
      data = await backendRes.json()
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid response from server',
          errors: null
        }, 
        { status: 500 }
      )
    }

    if (!backendRes.ok || !data.success) {
      // If token is invalid/expired, clear cookies
      if (backendRes.status === 401) {
        const res = NextResponse.json(
          { 
            success: false, 
            message: data.message || 'Authentication failed',
            errors: data.errors || null
          }, 
          { status: 401 }
        )
        
        // Clear authentication cookies
        res.cookies.set('token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 0,
          path: '/',
          sameSite: 'lax',
        })
        res.cookies.set('user_info', '', {
          maxAge: 0,
          path: '/',
          sameSite: 'lax',
        })
        res.cookies.set('role', '', {
          maxAge: 0,
          path: '/',
          sameSite: 'lax',
        })
        
        return res
      }

      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Failed to fetch user',
          errors: data.errors || null
        }, 
        { status: backendRes.status }
      )
    }

    const user = data.data

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User data not found in response',
          errors: null
        }, 
        { status: 500 }
      )
    }

    if (!ALLOWED_ROLES.has(String(user.role || '').trim())) {
      const res = NextResponse.json(
        {
          success: false,
          message: 'Access denied for this account role.',
          errors: {
            role: ['Only super_admin, super_admin_viewer, and admin are allowed in this system.'],
          },
        },
        { status: 403 },
      )

      res.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
      })
      res.cookies.set('user_info', '', {
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
      })
      res.cookies.set('role', '', {
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
      })

      return res
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User retrieved successfully',
      user 
    })

  } catch (err) {
    console.error('Me API Error:', err)
    
    // Handle different types of errors
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        errorMessage = 'Request timeout. Please try again.'
        statusCode = 408
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        errors: null
      }, 
      { status: statusCode }
    )
  }
}
