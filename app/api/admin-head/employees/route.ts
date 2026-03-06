import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Split name into first and last name (simple split)
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    // Insert employee using actual columns
    const result = await query(
      'INSERT INTO employees (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    )

    return NextResponse.json(
      { success: true, message: 'Employee created successfully', data: result },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 409 }
      )
    }

    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let sqlQuery = "SELECT id, first_name, last_name, CONCAT(first_name, ' ', last_name) AS name, email, department, position, gender, created_at FROM employees"
    const values: any[] = []

    if (status) {
      const statusArray = status.split(',')
      const placeholders = statusArray.map(() => '?').join(', ')
      sqlQuery += ` WHERE status IN (${placeholders})`
      values.push(...statusArray)
    }

    sqlQuery += " ORDER BY created_at DESC"

    const results = await query(sqlQuery, values)
    return NextResponse.json({ success: true, data: results })
  } catch (error: any) {
    console.error('API Error in GET /api/admin-head/employees:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch employees', error: error.message },
      { status: 500 }
    )
  }
}
