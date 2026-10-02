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

  it('prevents a non-owner admin from creating administrator accounts when an owner UID is configured', async () => {
    const createUser = vi.fn()
    const response = await handleAdminUsersRequest(new Request('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { authorization: 'Bearer valid', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'other@cpsu.edu.ph', password: 'a-long-password-here', displayName: 'Other' }),
    }), {
      environment: { FIREBASE_BOOTSTRAP_ADMIN_UID: 'bootstrap-admin' },
      verifyIdToken: async () => administrator,
      auth: { createUser } as unknown as Auth,
    })

    expect(response.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
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
    await expect(response.json()).resolves.toMatchObject({ data: [{ uid: user.uid }], canManage: false })
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

it('includes administrators on later Firebase user pages', async () => {
  const user = { uid: 'later-admin', email: 'later@example.edu', displayName: 'Later', disabled: false, customClaims: { admin: true }, metadata: { creationTime: '2026-01-01T00:00:00Z' } } as unknown as UserRecord;
  const listUsers = vi.fn().mockResolvedValueOnce({ users: [], pageToken: 'page-two' }).mockResolvedValueOnce({ users: [user] });
  const response = await handleAdminUsersRequest(new Request('https://example.edu/api/admin/users', { headers: { authorization: 'Bearer valid' } }), { verifyIdToken: async () => administrator, auth: { listUsers } as unknown as Auth });
  expect(listUsers).toHaveBeenNthCalledWith(2, 1000, 'page-two');
  await expect(response.json()).resolves.toMatchObject({ data: [{ uid: 'later-admin' }] });
});
it('keeps nested category prefixes when renaming a legacy resource', async () => {
  const send = vi.fn(async (command: unknown) => { if (command instanceof HeadObjectCommand) throw { $metadata: { httpStatusCode: 404 } }; return {}; });
  const response = await handleAdminResourceMutationRequest(new Request('https://example.edu/api/admin/resource', { method: 'PATCH', headers: { authorization: 'Bearer valid' }, body: JSON.stringify({ key: 'higher-education-performance/accreditation/undergraduate/2026/report.pdf', filename: 'renamed.pdf' }) }), { verifyIdToken: async () => administrator, config, structure: repositorySections, send, audit: async () => 'audit' });
  expect(response.status).toBe(200);
  const copy = send.mock.calls.map(call => call[0]).find(command => command instanceof CopyObjectCommand) as CopyObjectCommand;
  expect(copy.input.Key).toBe('higher-education-performance/accreditation/undergraduate/2026/renamed.pdf');
});

it.each(['PATCH', 'DELETE'])('rejects modifying an ordinary Firebase account through %s', async method => {
  const updateUser = vi.fn(); const deleteUser = vi.fn();
  const auth = { getUser: async () => ({ uid: 'ordinary-user' }), updateUser, deleteUser } as unknown as Auth;
  const response = await handleAdminUsersRequest(new Request('https://example.edu/api/admin/users', { method, headers: { authorization: 'Bearer valid' }, body: JSON.stringify({ uid: 'ordinary-user', displayName: 'Changed', disabled: true }) }), { verifyIdToken: async () => administrator, auth });
  expect(response.status).toBe(400);
  expect(updateUser).not.toHaveBeenCalled(); expect(deleteUser).not.toHaveBeenCalled();
});

it('fails safely on repeated Firebase account pagination tokens', async () => {
  const listUsers = vi.fn(async () => ({ users: [], pageToken: 'same-page' }));
  const response = await handleAdminUsersRequest(new Request('https://example.edu/api/admin/users', { headers: { authorization: 'Bearer valid' } }), { verifyIdToken: async () => administrator, auth: { listUsers } as unknown as Auth });
  expect(response.status).toBe(500);
  expect(listUsers).toHaveBeenCalledTimes(2);
});
