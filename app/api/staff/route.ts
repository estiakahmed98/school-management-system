import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { staffService } from '@/lib/server/school'

export async function GET() {
  return handleList(staffService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, staffService, 'Staff created successfully')
}
