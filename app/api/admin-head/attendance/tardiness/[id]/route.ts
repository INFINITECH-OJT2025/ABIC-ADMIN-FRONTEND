import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// PATCH /api/admin-head/attendance/tardiness/[id]
// Updates actual_in time and recalculates minutes_late for a tardiness entry
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { actualIn, minutesLate } = body

        if (!actualIn) {
            return NextResponse.json(
                { success: false, message: 'actualIn time is required' },
                { status: 400 }
            )
        }

        const result = await query(
            `UPDATE tardiness_entries SET actual_in = ?, minutes_late = ? WHERE id = ?`,
            [actualIn, minutesLate !== undefined && minutesLate !== null ? minutesLate : 0, id]
        )

        return NextResponse.json({
            success: true,
            message: 'Tardiness entry updated successfully',
            data: result,
        })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update tardiness entry' },
            { status: 500 }
        )
    }
}
