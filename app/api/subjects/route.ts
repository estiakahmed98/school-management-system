import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { subjectService } from '@/lib/server/school'

export async function GET() {
  return handleList(subjectService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, subjectService, 'Subject created successfully')
}
