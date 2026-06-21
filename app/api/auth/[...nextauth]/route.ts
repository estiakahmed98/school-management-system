import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Auth.js endpoints are disabled in this project.' },
    { status: 404 }
  )
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Auth.js endpoints are disabled in this project.' },
    { status: 404 }
  )
}
