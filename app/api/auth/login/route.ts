import { NextResponse } from 'next/server'
import { fetchBackendWithFallback, getBackendUnavailableMessage, isBackendNetworkError } from '@/lib/backend-url'

interface LoginRequest {
  email: string
  password: string
}

interface BackendResponse {
  success: boolean
  message: string
  data?: {
    token: string
    token_type: string
    expires_in: number
    user: {
      id: number
      name: string
      email: string
      role: string
      email_verified_at?: string
      created_at: string
      updated_at: string
    }
  }
  errors?: Record<string, string[]>
  retry_after?: number
}

const ALLOWED_ROLES = new Set(['super_admin', 'super_admin_viewer', 'admin'])

function parseBackendMessage(raw: string, fallback: string): string {
  const text = raw.trim()
  if (!text) return fallback

  // Keep backend plain-text errors readable in UI (trim long HTML pages).
  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
    return 'Backend returned HTML instead of JSON. Please verify BACKEND_URL and API routes.'
  }

  return text.length > 300 ? `${text.slice(0, 300)}...` : text
}

export async function POST(req: Request) {
  let pageUrl = ''

  try {
    const body: LoginRequest = await req.json()

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required',
          errors: {
            credentials: ['Please provide both email and password']
          }
        }, 
        { status: 400 }
      )
    }

    pageUrl = req.headers.get('X-Page-URL') || req.headers.get('Referer') || ''

    const backendRes = await fetchBackendWithFallback('/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0',
        ...(pageUrl && { 'X-Page-URL': pageUrl })
      },
      body: JSON.stringify(body)
    }, pageUrl)

    const raw = await backendRes.text()
    let data: BackendResponse

    try {
      data = raw ? (JSON.parse(raw) as BackendResponse) : { success: false, message: 'Empty response from backend' }
    } catch {
      data = {
        success: false,
        message: parseBackendMessage(raw, 'Backend returned a non-JSON response'),
      }
    }

    if (!backendRes.ok || !data.success) {
      // Handle different error types
      const statusCode = backendRes.status
      let errorMessage = data.message || 'Login failed'
      
      // Handle rate limiting
      if (statusCode === 429 && data.retry_after) {
        errorMessage = `Too many login attempts. Please try again in ${data.retry_after} seconds.`
      }

      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          errors: data.errors || null,
          retry_after: data.retry_after || null
        }, 
        { status: statusCode }
      )
    }

    const token = data.data?.token
    const user = data.data?.user

    if (!token || !user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid response from server',
          errors: null
        }, 
        { status: 500 }
      )
    }

    if (!ALLOWED_ROLES.has(String(user.role || '').trim())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied for this account role.',
          errors: {
            role: ['Only super_admin, super_admin_viewer, and admin are allowed in this system.'],
          },
        },
        { status: 403 },
      )
    }

    const res = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      data: {
        user,
        token_type: data.data?.token_type || 'Bearer',
        expires_in: data.data?.expires_in || 604800 // 7 days default
      }
    })

    // Set secure HTTP-only cookie for token
    const maxAge = data.data?.expires_in || 60 * 60 * 24 * 7 // 7 days
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
      sameSite: 'lax',
      // Add additional security headers
      partitioned: process.env.NODE_ENV === 'production'
    })

    // Store user info in non-HTTP-only cookie for client-side access
    res.cookies.set('user_info', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }), {
      maxAge,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    // Store role separately for middleware convenience
    res.cookies.set('role', user.role || '', {
      maxAge,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    return res

  } catch (err) {
    console.error('Login API Error:', err)
    
    // Handle different types of errors
    if (err instanceof Error) {
      if (isBackendNetworkError(err)) {
        return NextResponse.json(
          {
            success: false,
            message: getBackendUnavailableMessage(pageUrl),
            errors: null,
          },
          { status: 502 },
        )
      }

      if (err.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Request timeout. Please try again.',
            errors: null
          }, 
          { status: 408 }
        )
      }
      
      if (err.message.includes('JSON')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid request payload format',
            errors: null
          }, 
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        errors: null
      }, 
      { status: 500 }
    )
  }
}
