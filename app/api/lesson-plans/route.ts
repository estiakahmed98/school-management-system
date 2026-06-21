import { NextRequest } from 'next/server'
import { handleCreate, handleList } from '@/lib/server/route-handlers'
import { lessonPlanService } from '@/lib/server/school'

export async function GET() {
  return handleList(lessonPlanService)
}

export async function POST(request: NextRequest) {
  return handleCreate(request, lessonPlanService, 'Lesson plan created successfully')
}
