import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import type { Auth, DecodedIdToken, UserRecord } from 'firebase-admin/auth'
import { describe, expect, it, vi } from 'vitest'
import { repositorySections } from '../../src/config/repository.ts'
import type { R2Config } from '../config/r2.ts'
import { handleAdminResourceMutationRequest } from './adminResourceMutationHandler.ts'
import { handleAdminUsersRequest } from './adminUsersHandler.ts'

const administrator = { uid: 'admin-1', email: 'admin@cpsu.edu.ph', admin: true } as unknown as DecodedIdToken
const config: R2Config = {
  accountId: 'account',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  bucketName: 'repository',
  endpoint: 'https://account.r2.cloudflarestorage.com',
}

function renameRequest() {
  return new Request('http://localhost/api/admin/resource', {
    method: 'PATCH',
    headers: { authorization: 'Bearer valid', 'content-type': 'application/json' },
    body: JSON.stringify({
      key: 'planning-documents/planning-documents/2026/report.pdf',
      filename: 'renamed-report.pdf',
    }),
  })
}

describe('administrator operation authorization', () => {
  it('rejects unauthenticated resource mutations before accessing R2', async () => {
    const response = await handleAdminResourceMutationRequest(new Request('http://localhost/api/admin/resource', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'planning-documents/planning-documents/2026/report.pdf', confirmation: 'report.pdf' }),
    }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'UNAUTHORIZED' } })
  })

  it('rejects unauthenticated administrator listing before accessing Firebase Admin', async () => {
    const response = await handleAdminUsersRequest(new Request('http://localhost/api/admin/users'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'UNAUTHORIZED' } })
  })

  it('lists only Firebase users carrying the administrator claim', async () => {
    const users = [
      {
        uid: 'admin-2',
        email: 'admin2@cpsu.edu.ph',
        displayName: 'Admin Two',
        disabled: false,
        customClaims: { admin: true },
        metadata: { creationTime: '2026-08-13T00:00:00.000Z' },
      },
      {
        uid: 'ordinary-user',
        email: 'user@cpsu.edu.ph',
        displayName: 'Ordinary User',
        disabled: false,
        metadata: { creationTime: '2026-08-13T00:00:00.000Z' },
      },
    ] as unknown as UserRecord[]
    const auth = { listUsers: async () => ({ users }) } as unknown as Auth
    const response = await handleAdminUsersRequest(new Request('http://localhost/api/admin/users', {
      headers: { authorization: 'Bearer valid' },
    }), { verifyIdToken: async () => administrator, auth })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ data: [{ uid: 'admin-2' }] })
  })

  it('includes the configured initial administrator without requiring a claim', async () => {
    const user = {
      uid: 'bootstrap-admin',
      email: 'initial-admin@cpsu.edu.ph',
      displayName: 'Initial Admin',
      disabled: false,
      metadata: { creationTime: '2026-08-13T00:00:00.000Z' },
    } as unknown as UserRecord
    const auth = { listUsers: async () => ({ users: [user] }) } as unknown as Auth
    const response = await handleAdminUsersRequest(new Request('http://localhost/api/admin/users', {
      headers: { authorization: 'Bearer valid' },
    }), {
      environment: { FIREBASE_BOOTSTRAP_ADMIN_UID: user.uid },
      verifyIdToken: async () => administrator,
      auth,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ data: [{ uid: user.uid }] })
  })

  it('grants the administrator claim to staff accounts created by an administrator', async () => {
    const user = {
      uid: 'admin-3',
      email: 'admin3@cpsu.edu.ph',
      displayName: 'Admin Three',
      disabled: false,
      metadata: { creationTime: '2026-08-13T00:00:00.000Z' },
    } as unknown as UserRecord
    const setCustomUserClaims = vi.fn(async () => undefined)
    const auth = {
      createUser: async () => user,
      setCustomUserClaims,
      deleteUser: async () => undefined,
    } as unknown as Auth
    const response = await handleAdminUsersRequest(new Request('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { authorization: 'Bearer valid', 'content-type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        displayName: user.displayName,
        password: 'a-secure-password-123',
      }),
    }), {
      verifyIdToken: async () => administrator,
      auth,
      audit: async () => '_system/audit/test.json',
    })

    expect(response.status).toBe(201)
    expect(setCustomUserClaims).toHaveBeenCalledWith(user.uid, { admin: true })
  })

  it('fails closed when checking the rename destination returns an unexpected error', async () => {
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(HeadObjectCommand)
      throw { $metadata: { httpStatusCode: 500 } }
    })
    const response = await handleAdminResourceMutationRequest(renameRequest(), {
      verifyIdToken: async () => administrator,
      config,
      structure: repositorySections,
      send,
      audit: async () => 'unused',
    })

    expect(response.status).toBe(500)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('does not delete the source when the conditional rename finds a concurrent duplicate', async () => {
    const commands: unknown[] = []
    const send = vi.fn(async (command: unknown) => {
      commands.push(command)
      if (command instanceof HeadObjectCommand) throw { $metadata: { httpStatusCode: 404 } }
      if (command instanceof CopyObjectCommand) throw { $metadata: { httpStatusCode: 412 } }
      return {}
    })
    const response = await handleAdminResourceMutationRequest(renameRequest(), {
      verifyIdToken: async () => administrator,
      config,
      structure: repositorySections,
      send,
      audit: async () => '_system/audit/test.json',
    })

    expect(response.status).toBe(409)
    expect(commands.some((command) => command instanceof DeleteObjectCommand)).toBe(false)
  })
  it('creates a private link object with a server-validated name and destination', async () => {
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(PutObjectCommand)
      return {}
    })
    const audit = vi.fn(async () => '_system/audit/test.json')
    const response = await handleAdminResourceMutationRequest(
      new Request('http://localhost/api/admin/resource', {
        method: 'POST',
        headers: { authorization: 'Bearer valid', 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'MIS DPCR Evaluation Form',
          url: 'https://forms.example.edu/dpcr',
          sectionId: 'forms',
          categoryId: 'excel',
          year: '2027-2028',
        }),
      }),
      {
        verifyIdToken: async () => administrator,
        config,
        structure: repositorySections,
        send,
        audit,
      },
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: { key: 'forms/excel/2027-2028/MIS DPCR Evaluation Form.link' },
    })
    const command = send.mock.calls[0]?.[0]
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect((command as PutObjectCommand).input).toMatchObject({
      Bucket: 'repository',
      Key: 'forms/excel/2027-2028/MIS DPCR Evaluation Form.link',
      ContentType: 'application/vnd.cpsu.repository-link+json',
      CacheControl: 'private, no-store',
      IfNoneMatch: '*',
    })
    expect((command as PutObjectCommand).input.Body).toBe(
      JSON.stringify({ url: 'https://forms.example.edu/dpcr' }),
    )
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'resource.uploaded',
        details: { resourceType: 'link' },
      }),
      undefined,
    )
  })

  it('rejects insecure link destinations before writing to R2', async () => {
    const send = vi.fn()
    const response = await handleAdminResourceMutationRequest(
      new Request('http://localhost/api/admin/resource', {
        method: 'POST',
        headers: { authorization: 'Bearer valid', 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Unsafe link',
          url: 'http://example.test/form',
          sectionId: 'forms',
          categoryId: 'excel',
          year: '2027-2028',
        }),
      }),
      {
        verifyIdToken: async () => administrator,
        config,
        structure: repositorySections,
        send,
      },
    )

    expect(response.status).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })
})
