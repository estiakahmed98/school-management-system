import { NextRequest } from 'next/server'
import { created, handleApiError, parseJson, success } from '@/lib/server/api'

export interface CrudService<TOutput> {
  list: () => Promise<TOutput[]>
  get: (id: string) => Promise<TOutput>
  create: (input: unknown) => Promise<TOutput>
  update: (id: string, input: unknown) => Promise<TOutput>
  remove: (id: string) => Promise<void>
}

export async function handleList<TOutput>(service: CrudService<TOutput>) {
  try {
    return success(await service.list())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function handleCreate<TOutput>(request: NextRequest, service: CrudService<TOutput>, message: string) {
  try {
    const body = await parseJson(request)
    return created(await service.create(body), message)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function handleGet<TOutput>(id: string, service: CrudService<TOutput>) {
  try {
    return success(await service.get(id))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function handleUpdate<TOutput>(
  request: NextRequest,
  id: string,
  service: CrudService<TOutput>,
  message: string
) {
  try {
    const body = await parseJson(request)
    return success(await service.update(id, body), message)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function handleDelete<TOutput>(id: string, service: CrudService<TOutput>, message: string) {
  try {
    await service.remove(id)
    return success(null as TOutput | null, message)
  } catch (error) {
    return handleApiError(error)
  }
}
