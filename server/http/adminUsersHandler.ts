import { getAuth, type Auth, type UserRecord } from 'firebase-admin/auth'
import { administratorCreateSchema, administratorDeleteSchema, administratorUpdateSchema } from '../../src/contracts/adminOperations.ts'
import {
  AdminAuthenticationError,
  AdminAuthorizationError,
  authenticateAdminRequest,
  hasAdministratorAccess,
  type AdminAuthenticationDependencies,
} from '../auth/authenticateAdminRequest.ts'
import { getFirebaseAdminApp } from '../auth/verifyFirebaseIdToken.ts'
import { getFirebaseAdminConfig } from '../config/firebaseAdmin.ts'
import { recordAuditEvent } from '../security/auditLog.ts'

const headers = { 'cache-control': 'private, no-store', 'content-type': 'application/json; charset=utf-8' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
const mapUser = (user: UserRecord) => ({
  uid: user.uid,
  email: user.email ?? '',
  displayName: user.displayName ?? '',
  disabled: user.disabled,
  createdAt: user.metadata.creationTime,
})

type AdminUsersDependencies = AdminAuthenticationDependencies & {
  auth?: Auth
  audit?: typeof recordAuditEvent
}

export async function handleAdminUsersRequest(
  request: Request,
  dependencies: AdminUsersDependencies = {},
) {
  let identity
  try {
    identity = await authenticateAdminRequest(request, dependencies)
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json({ error: { code: 'FORBIDDEN', message: error.message } }, 403)
    return json({ error: { code: 'UNAUTHORIZED', message: error instanceof AdminAuthenticationError ? error.message : 'Authentication is required.' } }, 401)
  }

  // When a bootstrap owner is configured, only that account may manage
  // administrator identities or mint additional admin claims.
  const ownerUid = (dependencies.environment ?? process.env).FIREBASE_BOOTSTRAP_ADMIN_UID?.trim()
  const canManage = !ownerUid || identity.uid === ownerUid
  if (!canManage && request.method !== 'GET') {
    return json({ error: { code: 'FORBIDDEN', message: 'Only the designated account owner can manage administrators.' } }, 403)
  }

  const auth = dependencies.auth ?? getAuth(getFirebaseAdminApp(getFirebaseAdminConfig(dependencies.environment)))
  const audit = dependencies.audit ?? recordAuditEvent
  try {
    if (request.method === 'GET') {
      const users = (await auth.listUsers(1000)).users
        .filter((user) => user.email && hasAdministratorAccess(user, dependencies.environment ?? process.env))
        .map(mapUser)
      return json({ data: users, canManage })
    }

    const payload: unknown = await request.json()
    if (request.method === 'POST') {
      const result = administratorCreateSchema.safeParse(payload)
      if (!result.success) return json({ error: { code: 'INVALID_REQUEST', message: 'Enter a valid name, email, and password of at least 12 characters.' } }, 400)
      await audit({ action: 'administrator.created', actor: identity, target: result.data.email, outcome: 'attempted' }, dependencies.environment)
      const user = await auth.createUser({ ...result.data, emailVerified: false, disabled: false })
      try {
        await auth.setCustomUserClaims(user.uid, { admin: true })
      } catch (error) {
        await auth.deleteUser(user.uid)
        throw error
      }
      return json({ data: mapUser(user) }, 201)
    }

    if (request.method === 'PATCH') {
      const result = administratorUpdateSchema.safeParse(payload)
      if (!result.success) return json({ error: { code: 'INVALID_REQUEST', message: 'The administrator update is invalid.' } }, 400)
      if (result.data.uid === identity.uid && result.data.disabled) return json({ error: { code: 'SELF_PROTECTION', message: 'You cannot disable your active account.' } }, 400)
      await audit({
        action: 'administrator.updated',
        actor: identity,
        target: result.data.uid,
        outcome: 'attempted',
        details: { disabled: result.data.disabled },
      }, dependencies.environment)
      return json({ data: mapUser(await auth.updateUser(result.data.uid, {
        displayName: result.data.displayName,
        disabled: result.data.disabled,
      })) })
    }

    if (request.method === 'DELETE') {
      const result = administratorDeleteSchema.safeParse(payload)
      if (!result.success) return json({ error: { code: 'INVALID_REQUEST', message: 'The administrator deletion is invalid.' } }, 400)
      if (result.data.uid === identity.uid) return json({ error: { code: 'SELF_PROTECTION', message: 'You cannot delete your active account.' } }, 400)
      await audit({ action: 'administrator.deleted', actor: identity, target: result.data.uid, outcome: 'attempted' }, dependencies.environment)
      await auth.deleteUser(result.data.uid)
      return json({ data: { uid: result.data.uid } })
    }

    return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Unsupported method.' } }, 405)
  } catch {
    return json({ error: { code: 'ADMIN_OPERATION_FAILED', message: 'The administrator operation could not be completed.' } }, 500)
  }
}
