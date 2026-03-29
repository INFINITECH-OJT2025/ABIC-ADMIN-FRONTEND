import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/adminndance/tardiness?month=February&year=2026
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')
        const year = searchParams.get('year')

        if (!month || !year) {
            return NextResponse.json(
                { success: false, message: 'Month and Year are required' },
                { status: 400 }
            )
        }

        const results = await query(
            'SELECT * FROM tardiness_entries WHERE month = ? AND year = ? ORDER BY date DESC, created_at DESC',
            [month, parseInt(year)]
        )

        return NextResponse.json({ success: true, data: results })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch tardiness entries' },
            { status: 500 }
        )
    }
}

// POST /api/adminndance/tardiness
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            employeeId,
            employeeName,
            date,
            actualIn,
            minutesLate,
            warningLevel,
            cutoffPeriod,
            month,
            year
        } = body

        // Simple validation
        if (!employeeId || !employeeName || !date || !actualIn || !month || !year) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            )
        }

        const result = await query(
            `INSERT INTO tardiness_entries 
      (employee_id, employee_name, date, actual_in, minutes_late, warning_level, cutoff_period, month, year) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [employeeId, employeeName, date, actualIn, minutesLate, warningLevel || 0, cutoffPeriod, month, year]
        )

        return NextResponse.json(
            { success: true, message: 'Tardiness entry saved successfully', data: result },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to save tardiness entry' },
            { status: 500 }
        )
    }
}
