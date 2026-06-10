import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { inventoryService } from '@/lib/server/school'

export async function GET() {
  return handleList(inventoryService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, inventoryService, 'Inventory item created successfully')
}
