import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { sectionService } from '@/lib/server/school'

export async function GET() {
  return handleList(sectionService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, sectionService, 'Section created successfully')
}
