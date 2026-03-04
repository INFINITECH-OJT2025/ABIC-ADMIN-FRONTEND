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
        Accept: request.headers.get('Accept') || '*/*',
    }
    const reqContentType = request.headers.get('Content-Type')
    if (reqContentType) {
        headers['Content-Type'] = reqContentType
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

        const responseBuffer = await response.arrayBuffer()
        const outHeaders = new Headers()
        const contentType = response.headers.get('Content-Type') || 'application/json'
        outHeaders.set('Content-Type', contentType)
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) outHeaders.set('Content-Disposition', contentDisposition)
        const cacheControl = response.headers.get('Cache-Control')
        if (cacheControl) outHeaders.set('Cache-Control', cacheControl)
        outHeaders.set('Access-Control-Allow-Origin', '*')

        return new NextResponse(responseBuffer, {
            status: response.status,
            headers: outHeaders,
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
