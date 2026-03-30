const DEFAULT_BACKEND_BASE = 'http://127.0.0.1:8000'

const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'ETIMEDOUT',
])

type ErrorWithCode = Error & {
  code?: string
  cause?: {
    code?: string
  }
}

function normalizeBase(base: string | undefined | null): string | null {
  if (!base) return null
  const trimmed = base.trim()
  if (!trimmed) return null
  let normalized = trimmed.replace(/\/$/, '')

  // Allow env values like http://host:8000/api by converting to base host URL.
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4)
  }

  return normalized
}

function addLoopbackAlias(candidates: Set<string>, base: string) {
  try {
    const parsed = new URL(base)
    if (parsed.hostname === '127.0.0.1') {
      parsed.hostname = 'localhost'
      candidates.add(parsed.toString().replace(/\/$/, ''))
    } else if (parsed.hostname === 'localhost') {
      parsed.hostname = '127.0.0.1'
      candidates.add(parsed.toString().replace(/\/$/, ''))
    }
  } catch {
    // Ignore malformed URLs and keep existing candidates.
  }
}

function addPageDerivedCandidate(candidates: Set<string>, pageUrl?: string) {
  if (!pageUrl) return

  try {
    const parsed = new URL(pageUrl)
    const base = `${parsed.protocol}//${parsed.hostname}:8000`
    candidates.add(base)

    // Local dev often runs Laravel on plain HTTP even when pages are proxied.
    if (parsed.protocol === 'https:') {
      candidates.add(`http://${parsed.hostname}:8000`)
    }
  } catch {
    // Ignore invalid page URLs.
  }
}

export function getBackendBaseCandidates(pageUrl?: string): string[] {
  const candidates = new Set<string>()

  const configuredBases = [
    process.env.BACKEND_URL,
    process.env.LARAVEL_INTERNAL_URL,
    process.env.LARAVEL_API_URL,
    DEFAULT_BACKEND_BASE,
    'http://localhost:8000',
  ]

  for (const base of configuredBases) {
    const normalized = normalizeBase(base)
    if (!normalized) continue
    candidates.add(normalized)
    addLoopbackAlias(candidates, normalized)
  }

  addPageDerivedCandidate(candidates, pageUrl)
  return Array.from(candidates)
}

export function isBackendNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const err = error as ErrorWithCode
  const code = (err.code || err.cause?.code || '').toUpperCase()
  if (NETWORK_ERROR_CODES.has(code)) return true

  const message = err.message.toLowerCase()
  return (
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('network')
  )
}

export async function fetchBackendWithFallback(
  path: string,
  init: RequestInit,
  pageUrl?: string,
): Promise<Response> {
  const targetPath = path.startsWith('/') ? path : `/${path}`
  const candidates = getBackendBaseCandidates(pageUrl)

  let lastError: unknown = null

  for (const base of candidates) {
    try {
      return await fetch(`${base}${targetPath}`, init)
    } catch (error) {
      lastError = error
      if (!isBackendNetworkError(error)) {
        throw error
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error(`Cannot connect to backend. Tried: ${candidates.join(', ')}`)
}

export function getBackendUnavailableMessage(pageUrl?: string): string {
  const candidates = getBackendBaseCandidates(pageUrl)
  return `Backend service is unreachable. Tried: ${candidates.join(', ')}`
}
