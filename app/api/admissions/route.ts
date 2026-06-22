import { NextRequest } from 'next/server'
import { admissionService } from '@/lib/server/school'
import { handleCreate, handleList } from '@/lib/server/route-handlers'

export async function GET() {
  return handleList(admissionService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, admissionService, 'Admission application created successfully')
}
