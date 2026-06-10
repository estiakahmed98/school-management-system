import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { permissionService } from '@/lib/server/school'

export async function GET() {
  return handleList(permissionService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, permissionService, 'Permission created successfully')
}
