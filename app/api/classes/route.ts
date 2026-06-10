import { NextRequest } from 'next/server'
import { classService } from '@/lib/server/school'
import { handleCreate, handleList } from '@/lib/server/route-handlers'

export async function GET() {
  return handleList(classService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, classService, 'Class created successfully')
}
