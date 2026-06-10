import { NextRequest } from 'next/server'
import { feeService } from '@/lib/server/school'
import { handleCreate, handleList } from '@/lib/server/route-handlers'

export async function GET() {
  return handleList(feeService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, feeService, 'Fee created successfully')
}
