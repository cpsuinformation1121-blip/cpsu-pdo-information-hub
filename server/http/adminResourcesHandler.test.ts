import { adminResourceListResponseSchema } from "../../src/contracts/resource";
import type { DecodedIdToken } from 'firebase-admin/auth'
import { describe, expect, it, vi } from 'vitest'
import type { R2Config } from '../config/r2'
import { handleAdminResourcesRequest } from './adminResourcesHandler'

const verifiedAdministrator = {
  uid: 'administrator-1',
  email: 'cpsu_pdo@cpsu.edu.ph',
  admin: true,
} as unknown as DecodedIdToken

const testConfig: R2Config = {
  accountId: 'test-account',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  bucketName: 'repository-bucket',
  endpoint: 'https://test-account.r2.cloudflarestorage.com',
}

describe('handleAdminResourcesRequest', () => {
  it('verifies the administrator before listing resources', async () => {
    const verifyIdToken = vi.fn(async () => verifiedAdministrator)
    const response = await handleAdminResourcesRequest(
      new Request('http://localhost/api/admin/resources?limit=25', {
        headers: { authorization: 'Bearer valid-token' },
      }),
      {
        verifyIdToken,
        resources: {
          config: testConfig,
          listObjects: async () => ({ Contents: [], IsTruncated: false }),
        },
      },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(verifyIdToken).toHaveBeenCalledWith('valid-token', undefined)
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: { total: 0, nextCursor: null },
    })
  })

  it('returns the storage key only after administrator authentication', async () => {
    const response = await handleAdminResourcesRequest(
      new Request('http://localhost/api/admin/resources', {
        headers: { authorization: 'Bearer valid-token' },
      }),
      {
        verifyIdToken: async () => verifiedAdministrator,
        resources: {
          config: testConfig,
          listObjects: async () => ({
            Contents: [{
              Key: 'planning-documents/planning-documents/2026/Annual Report.pdf',
              Size: 4096,
              LastModified: new Date('2026-08-12T08:00:00.000Z'),
            }],
            IsTruncated: false,
          }),
        },
      },
    )
    const body = await response.json() as { data: { key: string }[] }

    expect(response.status).toBe(200)
    expect(body.data[0]?.key).toBe(
      'planning-documents/planning-documents/2026/Annual Report.pdf',
    )
  })

  it('does not access R2 when authentication is missing', async () => {
    const listObjects = vi.fn(async () => ({ Contents: [], IsTruncated: false }))
    const response = await handleAdminResourcesRequest(
      new Request('http://localhost/api/admin/resources'),
      { resources: { config: testConfig, listObjects } },
    )

    expect(response.status).toBe(401)
    expect(listObjects).not.toHaveBeenCalled()
  })

  it('does not access R2 when token verification fails', async () => {
    const listObjects = vi.fn(async () => ({ Contents: [], IsTruncated: false }))
    const response = await handleAdminResourcesRequest(
      new Request('http://localhost/api/admin/resources', {
        headers: { authorization: 'Bearer invalid-token' },
      }),
      {
        verifyIdToken: async () => { throw new Error('private provider detail') },
        resources: { config: testConfig, listObjects },
      },
    )

    expect(response.status).toBe(401)
    expect(listObjects).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'The administrator session is invalid or expired.',
      },
    })
  })

  it('preserves resource query validation behind authentication', async () => {
    const response = await handleAdminResourcesRequest(
      new Request('http://localhost/api/admin/resources?limit=1000', {
        headers: { authorization: 'Bearer valid-token' },
      }),
      {
        verifyIdToken: async () => verifiedAdministrator,
        resources: {
          config: testConfig,
          listObjects: async () => ({ Contents: [], IsTruncated: false }),
        },
      },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'INVALID_QUERY' },
    })
  })
})

describe('authenticated year-group requests', () => {
  it('returns whole groups through the protected handler with private caching', async () => {
    const response = await handleAdminResourcesRequest(new Request('http://localhost/api/admin/resources?groupBy=year&limit=1', {
      headers: { authorization: 'Bearer valid-token' },
    }), {
      verifyIdToken: async () => verifiedAdministrator,
      resources: {
        config: testConfig,
        listObjects: async () => ({ Contents: [2024, 2026].map((year) => ({
          Key: `forms/${year}/annual-report-${year}.pdf`, Size: 100, LastModified: new Date('2026-01-01'),
        })) }),
      },
    });
    const result = adminResourceListResponseSchema.parse(await response.json());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(result.meta).toEqual({ total: 2, groupTotal: 1, nextCursor: null });
    expect(result.data).toHaveLength(2);
    expect(result.data[0].key).toBe('forms/2026/annual-report-2026.pdf');
  });
});
