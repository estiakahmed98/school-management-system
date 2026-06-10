import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { payrollService } from '@/lib/server/school'

export async function GET() {
  return handleList(payrollService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, payrollService, 'Payroll created successfully')
}
