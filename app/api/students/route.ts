import { NextRequest } from 'next/server'
import { studentService } from '@/lib/server/school'
import { handleCreate, handleList } from '@/lib/server/route-handlers'

export async function GET() {
  return handleList(studentService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, studentService, 'Student created successfully')
}
