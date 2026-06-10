import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { teacherService } from '@/lib/server/school'

export async function GET() {
  return handleList(teacherService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, teacherService, 'Teacher created successfully')
}
