import { NextRequest } from 'next/server'
import { attendanceService } from '@/lib/server/school'
import { handleDelete, handleGet, handleUpdate } from '@/lib/server/route-handlers'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleGet(id, attendanceService)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleUpdate(request, id, attendanceService, 'Attendance updated successfully')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleUpdate(request, id, attendanceService, 'Attendance updated successfully')
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleDelete(id, attendanceService, 'Attendance deleted successfully')
}
