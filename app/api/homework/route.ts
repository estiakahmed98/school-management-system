import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { homeworkService } from '@/lib/server/school'

export async function GET() {
  return handleList(homeworkService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, homeworkService, 'Homework created successfully')
}
