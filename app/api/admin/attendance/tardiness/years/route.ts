import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/adminndance/tardiness/years
export async function GET() {
    try {
        const results = await query(
            'SELECT year FROM tardiness_years ORDER BY year ASC'
        )
        // @ts-ignore
        const years = results.map((r: any) => r.year)
        return NextResponse.json({ success: true, data: years })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch years' },
            { status: 500 }
        )
    }
}

// POST /api/adminndance/tardiness/years
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { year } = body

        if (!year) {
            return NextResponse.json(
                { success: false, message: 'Year is required' },
                { status: 400 }
            )
        }

        const result = await query(
            'INSERT INTO tardiness_years (year) VALUES (?)',
            [year]
        )

        return NextResponse.json(
            { success: true, message: 'Year added successfully', data: result },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('API Error:', error)
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { success: false, message: 'Year already exists' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { success: false, message: 'Failed to add year' },
            { status: 500 }
        )
    }
}
// DELETE /api/adminndance/tardiness/years
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const year = searchParams.get('year')

        if (!year) {
            return NextResponse.json(
                { success: false, message: 'Year is required' },
                { status: 400 }
            )
        }

        await query(
            'DELETE FROM tardiness_years WHERE year = ?',
            [year]
        )

        return NextResponse.json({ success: true, message: 'Year removed' })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to remove year' },
            { status: 500 }
        )
    }
}
