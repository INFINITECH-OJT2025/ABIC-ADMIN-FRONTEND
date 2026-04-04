import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_BASE = process.env.LARAVEL_INTERNAL_URL || 'http://127.0.0.1:8000'

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    const targetPath = '/' + path.join('/')

    // Preserve query string
    const searchParams = request.nextUrl.searchParams.toString()
    const targetUrl = `${LARAVEL_BASE}${targetPath}${searchParams ? '?' + searchParams : ''}`

    // Forward relevant headers (drop host)
    const headers: Record<string, string> = {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'Accept': request.headers.get('Accept') || 'application/json',
    }
    const auth = request.headers.get('Authorization')
    if (auth) headers['Authorization'] = auth

    // Read body for methods that support it
    let body: BodyInit | undefined
    if (!['GET', 'HEAD'].includes(request.method)) {
        body = await request.text()
    }

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body,
        })

        const responseBody = await response.text()

        return new NextResponse(responseBody, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (error) {
        console.error('[Laravel Proxy] Error:', error)
        return NextResponse.json(
            { success: false, message: 'Could not connect to Laravel backend at ' + targetUrl },
            { status: 502 }
        )
    }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
