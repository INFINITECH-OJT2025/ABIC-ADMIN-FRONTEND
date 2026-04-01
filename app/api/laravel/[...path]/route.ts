import { NextRequest, NextResponse } from 'next/server'

function normalizeBase(base?: string | null): string | null {
    if (!base) return null
    const trimmed = base.trim()
    if (!trimmed) return null
    let normalized = trimmed.replace(/\/$/, '')
    if (normalized.endsWith('/api')) {
        normalized = normalized.slice(0, -4)
    }
    return normalized
}

function getCandidateBases() {
    const candidates = new Set<string>()
    const configuredBases = [
        process.env.LARAVEL_INTERNAL_URL,
        process.env.LARAVEL_API_URL,
        process.env.BACKEND_URL,
        'http://127.0.0.1:8000',
    ]

    for (const base of configuredBases) {
        const normalized = normalizeBase(base)
        if (normalized) {
            candidates.add(normalized)
        }
    }

    const firstBase = Array.from(candidates)[0] || 'http://127.0.0.1:8000'

    try {
        const parsed = new URL(firstBase)
        if (parsed.hostname === '127.0.0.1') {
            parsed.hostname = 'localhost'
            candidates.add(parsed.toString().replace(/\/$/, ''))
        } else if (parsed.hostname === 'localhost') {
            parsed.hostname = '127.0.0.1'
            candidates.add(parsed.toString().replace(/\/$/, ''))
        }
    } catch {
        // Keep defaults if URL parsing fails.
    }

    candidates.add('http://localhost:8000')

    return Array.from(candidates).map((base) => base.replace(/\/$/, ''))
}

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    const targetPath = '/' + path.join('/')

    // Preserve query string
    const searchParams = request.nextUrl.searchParams.toString()
    const targetSuffix = `${targetPath}${searchParams ? '?' + searchParams : ''}`

    // Forward relevant headers (drop host)
    const headers: Record<string, string> = {
        Accept: request.headers.get('Accept') || '*/*',
    }
    const reqContentType = request.headers.get('Content-Type')
    if (reqContentType) {
        headers['Content-Type'] = reqContentType
    }

    // Prefer explicit Authorization header, fallback to auth token cookie.
    const auth = request.headers.get('Authorization')
    if (auth) {
        headers['Authorization'] = auth
    } else {
        const tokenFromCookie = request.cookies.get('token')?.value
        if (tokenFromCookie) {
            headers['Authorization'] = `Bearer ${tokenFromCookie}`
        }
    }

    // Read body for methods that support it
    let body: BodyInit | undefined
    if (!['GET', 'HEAD'].includes(request.method)) {
        body = await request.text()
    }

    const candidateBases = getCandidateBases()
    let lastError: unknown = null
    let lastGatewayResponse: Response | null = null

    const forwardResponse = async (response: Response) => {
        const responseBuffer = await response.arrayBuffer()
        const outHeaders = new Headers()
        const contentType = response.headers.get('Content-Type') || 'application/json'
        outHeaders.set('Content-Type', contentType)
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) outHeaders.set('Content-Disposition', contentDisposition)
        const cacheControl = response.headers.get('Cache-Control')
        if (cacheControl) {
            outHeaders.set('Cache-Control', cacheControl)
        } else {
            outHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        }
        outHeaders.set('Pragma', 'no-cache')
        outHeaders.set('Expires', '0')
        outHeaders.set('Access-Control-Allow-Origin', '*')

        return new NextResponse(responseBuffer, {
            status: response.status,
            headers: outHeaders,
        })
    }

    for (const base of candidateBases) {
        const targetUrl = `${base}${targetSuffix}`

        try {
            let response = await fetch(targetUrl, {
                method: request.method,
                headers,
                body,
                cache: 'no-store',
            })

            // Retry once for transient upstream gateway responses.
            if (response.status === 502 || response.status === 503 || response.status === 504) {
                await new Promise((resolve) => setTimeout(resolve, 300))
                response = await fetch(targetUrl, {
                    method: request.method,
                    headers,
                    body,
                    cache: 'no-store',
                })

                if (response.status === 502 || response.status === 503 || response.status === 504) {
                    lastGatewayResponse = response
                    continue
                }
            }

            return await forwardResponse(response)
        } catch (error) {
            lastError = error
            console.error('[Laravel Proxy] Error connecting to:', targetUrl, error)
        }
    }

    if (lastGatewayResponse) {
        return await forwardResponse(lastGatewayResponse)
    }

    return NextResponse.json(
        {
            success: false,
            message: `Could not connect to Laravel backend. Tried: ${candidateBases.join(', ')}`,
            error: lastError instanceof Error ? lastError.message : 'Unknown error',
        },
        { status: 502 }
    )
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
