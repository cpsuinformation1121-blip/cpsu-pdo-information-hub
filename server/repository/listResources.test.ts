import { describe, expect, it, vi } from 'vitest'
import { resourceQuerySchema } from '../../src/contracts/resource'
import type { R2Config } from '../config/r2'
import {
  InvalidResourceCursorError,
  listAdminResources,
  listResources,
} from './listResources'

const testConfig: R2Config = {
  accountId: 'test-account',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  bucketName: 'repository-bucket',
  endpoint: 'https://test-account.r2.cloudflarestorage.com',
}

const objects = [
  {
    Key: 'statistical-profile/student-population/2026/student population 2026.xlsx',
    Size: 2048,
    LastModified: new Date('2026-08-12T08:00:00.000Z'),
  },
  {
    Key: 'higher-education-performance/accreditation/undergraduate/2025/accreditation-report-2025.pdf',
    Size: 4096,
    LastModified: new Date('2026-08-11T08:00:00.000Z'),
  },
  {
    Key: 'statistical-profile/unknown-category/2026/ignored.pdf',
    Size: 512,
    LastModified: new Date('2026-08-10T08:00:00.000Z'),
  },
]

describe('listResources', () => {
  it('returns public metadata without storage keys or file URLs', async () => {
    const result = await listResources(resourceQuerySchema.parse({}), {
      config: testConfig,
      listObjects: async () => ({ Contents: objects, IsTruncated: false }),
    })

    expect(result.meta).toEqual({ total: 2, nextCursor: null })
    expect(result.data[0]).toMatchObject({
      fileType: 'xlsx',
      fileSize: 2048,
      filename: 'student population 2026.xlsx',
    })
    for (const resource of result.data) {
      expect(resource).not.toHaveProperty('key')
      expect(resource).not.toHaveProperty('downloadUrl')
      expect(resource).not.toHaveProperty('previewUrl')
    }
  })

  it('retains storage keys in the authenticated administrator inventory', async () => {
    const result = await listAdminResources(resourceQuerySchema.parse({}), {
      config: testConfig,
      listObjects: async () => ({ Contents: objects, IsTruncated: false }),
    })

    expect(result.data.map((resource) => resource.key)).toEqual([
      'statistical-profile/student-population/2026/student population 2026.xlsx',
      'higher-education-performance/accreditation/undergraduate/2025/accreditation-report-2025.pdf',
    ])
  })

  it('uses the narrowest available prefix and applies resource filters', async () => {
    const listObjects = vi.fn(async () => ({ Contents: objects, IsTruncated: false }))
    const result = await listResources(
      resourceQuerySchema.parse({
        section: 'statistical-profile',
        category: 'student-population',
        year: '2026',
        fileType: 'xlsx',
        q: 'population',
      }),
      { config: testConfig, listObjects },
    )

    expect(listObjects).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'repository-bucket',
        Prefix: 'statistical-profile/student-population/',
      }),
    )
    expect(result.meta.total).toBe(1)
    expect(result.data[0]?.categoryId).toBe('student-population')
  })

  it('follows R2 continuation tokens before applying deterministic pagination', async () => {
    const listObjects = vi
      .fn()
      .mockResolvedValueOnce({
        Contents: [objects[1]],
        IsTruncated: true,
        NextContinuationToken: 'r2-page-2',
      })
      .mockResolvedValueOnce({ Contents: [objects[0]], IsTruncated: false })

    const firstPage = await listResources(resourceQuerySchema.parse({ limit: 1 }), {
      config: testConfig,
      listObjects,
    })

    expect(firstPage.data[0]?.year).toBe(2026)
    expect(firstPage.meta.total).toBe(2)
    expect(firstPage.meta.nextCursor).not.toBeNull()
    expect(listObjects).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ ContinuationToken: 'r2-page-2' }),
    )

    const secondPage = await listResources(
      resourceQuerySchema.parse({ limit: 1, cursor: firstPage.meta.nextCursor }),
      {
        config: testConfig,
        listObjects: async () => ({ Contents: objects.slice(0, 2), IsTruncated: false }),
      },
    )

    expect(secondPage.data[0]?.year).toBe(2025)
    expect(secondPage.meta.nextCursor).toBeNull()
  })

  it('rejects cursors that cannot decode to a safe offset', async () => {
    await expect(
      listResources(resourceQuerySchema.parse({ cursor: 'invalid' }), {
        config: testConfig,
        listObjects: async () => ({ Contents: [], IsTruncated: false }),
      }),
    ).rejects.toBeInstanceOf(InvalidResourceCursorError)
  })
  it('lists link metadata publicly without exposing the R2 key or destination URL', async () => {
    const result = await listResources(resourceQuerySchema.parse({}), {
      config: testConfig,
      listObjects: async () => ({
        Contents: [{
          Key: 'forms/excel/2027-2028/MIS DPCR Evaluation Form.link',
          Size: 58,
          LastModified: new Date('2026-09-17T08:00:00.000Z'),
        }],
        IsTruncated: false,
      }),
    })

    expect(result.data).toEqual([
      expect.objectContaining({
        displayName: 'MIS DPCR Evaluation Form',
        filename: 'MIS DPCR Evaluation Form.link',
        fileType: 'link',
        mimeType: 'application/vnd.cpsu.repository-link+json',
      }),
    ])
    expect(result.data[0]).not.toHaveProperty('key')
    expect(JSON.stringify(result)).not.toContain('forms.example.edu')
  })
})
