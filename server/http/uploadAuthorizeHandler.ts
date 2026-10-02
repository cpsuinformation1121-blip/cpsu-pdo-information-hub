import { readLimitedJson, jsonBodyErrorResponse } from './readLimitedJson.ts'
import { resourceUploadRequestSchema } from '../../src/contracts/resourceUpload.ts'
import { AdminAuthenticationError, AdminAuthorizationError, authenticateAdminRequest, type AdminAuthenticationDependencies } from '../auth/authenticateAdminRequest.ts'
import { authorizeResourceUpload, DuplicateResourceError, InvalidResourceUploadError } from '../repository/authorizeResourceUpload.ts'

const headers = { 'cache-control': 'private, no-store', 'content-type': 'application/json; charset=utf-8' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

export async function handleUploadAuthorizeRequest(request: Request, dependencies: AdminAuthenticationDependencies & { upload?: Parameters<typeof authorizeResourceUpload>[1] } = {}) {
  if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' } }, 405)
  try { await authenticateAdminRequest(request, dependencies) }
  catch (error) {
    if (error instanceof AdminAuthorizationError) return json({ error: { code: 'FORBIDDEN', message: error.message } }, 403)
    return json({ error: { code: 'UNAUTHORIZED', message: error instanceof AdminAuthenticationError ? error.message : 'Authentication is required.' } }, 401)
  }

  let payload: unknown
  try { payload = await readLimitedJson(request, 16 * 1024) } catch (error) { return jsonBodyErrorResponse(error) ?? json({ error: { code: 'INVALID_REQUEST', message: 'The request body must be valid JSON.' } }, 400) }
  const result = resourceUploadRequestSchema.safeParse(payload)
  if (!result.success) return json({ error: { code: 'INVALID_UPLOAD', message: 'The upload information is invalid.', details: result.error.issues.map((issue) => ({ field: issue.path.join('.') || 'upload', message: issue.message })) } }, 400)

  try { return json({ data: await authorizeResourceUpload(result.data, { environment: dependencies.environment, ...dependencies.upload }) }) }
  catch (error) {
    if (error instanceof DuplicateResourceError) return json({ error: { code: 'DUPLICATE_RESOURCE', message: error.message } }, 409)
    if (error instanceof InvalidResourceUploadError) return json({ error: { code: 'INVALID_UPLOAD', message: error.message } }, 400)
    return json({ error: { code: 'UPLOAD_AUTHORIZATION_FAILED', message: 'Upload authorization is temporarily unavailable.' } }, 503)
  }
}
