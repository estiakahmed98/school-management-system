import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { transportService } from '@/lib/server/school'

export async function GET() {
  return handleList(transportService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, transportService, 'Transport route created successfully')
}
