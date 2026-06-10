import { NextRequest } from 'next/server'
import { examService } from '@/lib/server/school'
import { handleCreate, handleList } from '@/lib/server/route-handlers'

export async function GET() {
  return handleList(examService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, examService, 'Exam created successfully')
}
