import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
const LARAVEL_BASE = process.env.LARAVEL_INTERNAL_URL || 'http://127.0.0.1:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const file = body.get('file')
    const sectionCodeRaw = String(body.get('sectionCode') || '').trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'A file is required.' }, { status: 400 })
    }
    if (!sectionCodeRaw) {
      return NextResponse.json({ message: 'sectionCode is required.' }, { status: 400 })
    }

    const uploadForm = new FormData()
    uploadForm.set('file', file, file.name || `directory-image-${Date.now()}`)
    uploadForm.set('section_code', sectionCodeRaw)

    const uploadResponse = await fetch(`${LARAVEL_BASE}/api/directory/images/upload`, {
      method: 'POST',
      body: uploadForm,
      headers: {
        Accept: 'application/json',
      },
    })

    const payloadText = await uploadResponse.text()
    if (!payloadText) {
      return new NextResponse(null, { status: uploadResponse.status })
    }

    return new NextResponse(payloadText, {
      status: uploadResponse.status,
      headers: {
        'Content-Type': uploadResponse.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('[Directory Upload Proxy] Upload failed', error)
    return NextResponse.json({ message: 'Unable to upload directory image.' }, { status: 500 })
  }
}

