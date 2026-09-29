import { resourceUploadCompletionRequestSchema } from '../../src/contracts/resourceUpload.ts'
import { AdminAuthenticationError, AdminAuthorizationError, authenticateAdminRequest, type AdminAuthenticationDependencies } from '../auth/authenticateAdminRequest.ts'
import { ResourceUploadVerificationError, verifyResourceUpload } from '../repository/verifyResourceUpload.ts'
import { recordAuditEvent } from '../security/auditLog.ts'

const headers = { 'cache-control': 'private, no-store', 'content-type': 'application/json; charset=utf-8' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

export async function handleUploadCompleteRequest(request: Request, dependencies: AdminAuthenticationDependencies & {
  verification?: Parameters<typeof verifyResourceUpload>[1]
  audit?: typeof recordAuditEvent
} = {}) {
  if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' } }, 405)
  let identity
  try { identity = await authenticateAdminRequest(request, dependencies) }
  catch (error) {
    if (error instanceof AdminAuthorizationError) return json({ error: { code: 'FORBIDDEN', message: error.message } }, 403)
    return json({ error: { code: 'UNAUTHORIZED', message: error instanceof AdminAuthenticationError ? error.message : 'Authentication is required.' } }, 401)
  }
  let payload: unknown
  try { payload = await request.json() } catch { return json({ error: { code: 'INVALID_REQUEST', message: 'The request body must be valid JSON.' } }, 400) }
  const result = resourceUploadCompletionRequestSchema.safeParse(payload)
  if (!result.success) return json({ error: { code: 'INVALID_UPLOAD_COMPLETION', message: 'The upload completion information is invalid.' } }, 400)
  try {
    const resource = await verifyResourceUpload(result.data, { environment: dependencies.environment, ...dependencies.verification })
    await (dependencies.audit ?? recordAuditEvent)({
      action: 'resource.uploaded',
      actor: identity,
      target: resource.key,
      outcome: 'succeeded',
      details: { fileSize: resource.fileSize, mimeType: resource.mimeType },
      idempotencyKey: `${resource.key}:${resource.uploadedAt}`,
    }, dependencies.environment)
    return json({ data: resource })
  }
  catch (error) { return json({ error: { code: 'UPLOAD_VERIFICATION_FAILED', message: error instanceof ResourceUploadVerificationError ? error.message : 'The upload could not be completed. Please try again.' } }, 422) }
}
