/**
 * Returns the base API URL.
 * 
 * All browser-side requests go through the Next.js proxy at /api/laravel/*
 * which then forwards to Laravel at 127.0.0.1:8000 server-side.
 * 
 * This means the browser only needs port 3000, avoiding all firewall/binding issues.
 */
export function getApiUrl(): string {
  // Server-side (SSR/API routes): call Laravel directly
  if (typeof window === 'undefined') {
    return process.env.LARAVEL_INTERNAL_URL || 'http://127.0.0.1:8000'
  }

  // Client-side: use the Next.js proxy route (relative URL, always port 3000)
  return '/api/laravel'
}

