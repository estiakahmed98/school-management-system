import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { parentService } from '@/lib/server/school'

export async function GET() {
  return handleList(parentService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, parentService, 'Parent created successfully')
}
