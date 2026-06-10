import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { resultService } from '@/lib/server/school'

export async function GET() {
  return handleList(resultService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, resultService, 'Result created successfully')
}
