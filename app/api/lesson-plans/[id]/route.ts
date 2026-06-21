import { NextRequest } from 'next/server'
import { handleDelete, handleGet, handleUpdate } from '@/lib/server/route-handlers'
import { lessonPlanService } from '@/lib/server/school'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handleGet(id, lessonPlanService)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handleUpdate(request, id, lessonPlanService, 'Lesson plan updated successfully')
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handleUpdate(request, id, lessonPlanService, 'Lesson plan updated successfully')
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handleDelete(id, lessonPlanService, 'Lesson plan deleted successfully')
}
