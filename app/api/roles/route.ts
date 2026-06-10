import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { roleService } from '@/lib/server/school'

export async function GET() {
  return handleList(roleService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, roleService, 'Role created successfully')
}
