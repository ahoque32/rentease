import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Uniform JSON error responses for API routes. Internal details (database error
 * messages, stack traces) are logged server-side and never returned to clients.
 */
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function unauthorized() {
  return apiError('Unauthorized', 401)
}

export function forbidden() {
  return apiError('Forbidden', 403)
}

export function notFound(resource = 'Resource') {
  return apiError(`${resource} not found`, 404)
}

/** Log the underlying error server-side and return a sanitized 500. */
export function internalError(context: string, error: unknown) {
  console.error(`${context}:`, error)
  return apiError('Internal server error', 500)
}

/** Convert a thrown ZodError into a readable 400, otherwise a sanitized 500. */
export function handleRouteError(context: string, error: unknown) {
  if (error instanceof ZodError) {
    const detail = error.issues
      .map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
      })
      .join('; ')
    return apiError(`Invalid request: ${detail}`, 400)
  }
  return internalError(context, error)
}
