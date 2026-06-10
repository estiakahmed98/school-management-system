import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { smsService } from '@/lib/server/school'

export async function GET() {
  return handleList(smsService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, smsService, 'SMS log created successfully')
}
