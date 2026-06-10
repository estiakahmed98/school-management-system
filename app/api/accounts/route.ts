import { NextRequest } from 'next/server'
import { accountService } from '@/lib/server/school'
import { handleCreate, handleList } from '@/lib/server/route-handlers'

export async function GET() {
  return handleList(accountService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, accountService, 'Account transaction created successfully')
}
