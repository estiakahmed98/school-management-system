import { NextRequest } from 'next/server'
import { attendanceService } from '@/lib/server/school'
import { handleCreate, handleList } from '@/lib/server/route-handlers'

export async function GET() {
  return handleList(attendanceService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, attendanceService, 'Attendance recorded successfully')
}
