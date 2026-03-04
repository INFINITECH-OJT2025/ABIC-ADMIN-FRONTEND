import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const toSignableValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(',')
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === null || value === undefined) return ''
  return String(value)
}

const buildSignature = (params: Record<string, unknown>, apiSecret: string): string => {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${toSignableValue(params[key])}`)
    .join('&')
  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ message: 'Cloudinary server credentials are not configured.' }, { status: 500 })
    }

    const body = await request.json()
    const fromPublicId = String(body?.fromPublicId || '').trim()
    const toPublicId = String(body?.toPublicId || '').trim()

    if (!fromPublicId || !toPublicId) {
      return NextResponse.json({ message: 'fromPublicId and toPublicId are required.' }, { status: 400 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const signatureParams = {
      from_public_id: fromPublicId,
      to_public_id: toPublicId,
      overwrite: false,
      invalidate: true,
      timestamp,
    }
    const signature = buildSignature(signatureParams, apiSecret)

    const formData = new URLSearchParams()
    formData.set('from_public_id', fromPublicId)
    formData.set('to_public_id', toPublicId)
    formData.set('overwrite', 'false')
    formData.set('invalidate', 'true')
    formData.set('timestamp', String(timestamp))
    formData.set('api_key', apiKey)
    formData.set('signature', signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/rename`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const payload = await response.json()
    if (!response.ok) {
      const message = payload?.error?.message || 'Cloudinary rename request failed.'
      return NextResponse.json({ message }, { status: response.status })
    }

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ message: 'Unable to rename Cloudinary image.' }, { status: 500 })
  }
}

