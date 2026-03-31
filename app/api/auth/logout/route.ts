import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackendWithFallback, getBackendUnavailableMessage, isBackendNetworkError } from '@/lib/backend-url'

interface BackendResponse {
  success: boolean
  message: string
  data?: any
  errors?: Record<string, string[]>
}

export async function POST() {
  const pageUrl = ''

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      const res = NextResponse.json(
        { 
          success: false, 
          message: 'Not authenticated',
          errors: null
        }, 
        { status: 401 }
      )
      
      // Clear cookies anyway
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

    const backendRes = await fetchBackendWithFallback('/api/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ABIC-Frontend/1.0'
      }
    }, pageUrl)

    let data: BackendResponse
    try {
      data = await backendRes.json()
    } catch {
      data = { success: false, message: 'Invalid response from server' }
    }

    const res = NextResponse.json({ 
      success: backendRes.ok && data.success, 
      message: data.message || (backendRes.ok ? 'Logout successful' : 'Logout failed'),
      errors: data.errors || null
    })

    // Clear all authentication cookies
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

  } catch (err) {
    console.error('Logout API Error:', err)
    
    // Handle different types of errors
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (err instanceof Error) {
      if (isBackendNetworkError(err)) {
        errorMessage = getBackendUnavailableMessage(pageUrl)
        statusCode = 502
      } else if (err.name === 'AbortError') {
        errorMessage = 'Request timeout. Please try again.'
        statusCode = 408
      }
    }

    const res = NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        errors: null
      }, 
      { status: statusCode }
    )
    
    // Clear cookies even on error
    res.cookies.set('token', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, 
      path: '/',
      sameSite: 'lax'
    })
    res.cookies.set('user_info', '', { 
      maxAge: 0, 
      path: '/',
      sameSite: 'lax'
    })
    res.cookies.set('role', '', { 
      maxAge: 0, 
      path: '/',
      sameSite: 'lax'
    })
    
    return res
  }
}
