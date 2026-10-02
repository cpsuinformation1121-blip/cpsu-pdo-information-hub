import { describe, expect, it } from 'vitest'
import type { ResourceUploadCompletionRequest } from '../../src/contracts/resourceUpload'
import type { R2Config } from '../config/r2'
import { ResourceUploadVerificationError, verifyResourceUpload } from './verifyResourceUpload'

const config: R2Config = { accountId: 'account', accessKeyId: 'key', secretAccessKey: 'secret', bucketName: 'bucket', endpoint: 'https://account.r2.cloudflarestorage.com' }
const input: ResourceUploadCompletionRequest = { key: 'statistical-profile/student-population/2026/student-population-2026-test.pdf', mimeType: 'application/pdf', fileSize: 2048 }

describe('verifyResourceUpload', () => {
  it('returns actual R2 object properties after verification', async () => {
    await expect(verifyResourceUpload(input, { config, readPrefix: async () => new TextEncoder().encode("%PDF-1.7"), headObject: async () => ({ ContentLength: 2048, ContentType: 'application/pdf', LastModified: new Date('2026-08-12T05:00:00.000Z') }) })).resolves.toEqual({ ...input, uploadedAt: '2026-08-12T05:00:00.000Z' })
  })
  it('rejects a size mismatch', async () => {
    await expect(verifyResourceUpload(input, { config, readPrefix: async () => new TextEncoder().encode("%PDF-1.7"), headObject: async () => ({ ContentLength: 4096, ContentType: 'application/pdf', LastModified: new Date() }) })).rejects.toBeInstanceOf(ResourceUploadVerificationError)
  })
  it('rejects a content-type mismatch', async () => {
    await expect(verifyResourceUpload(input, { config, readPrefix: async () => new TextEncoder().encode("%PDF-1.7"), headObject: async () => ({ ContentLength: 2048, ContentType: 'image/png', LastModified: new Date() }) })).rejects.toBeInstanceOf(ResourceUploadVerificationError)
  })
  it('rejects completion for an Excel repository key', async () => {
    await expect(verifyResourceUpload({
      ...input,
      key: 'statistical-profile/student-population/2026/statistics.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' as ResourceUploadCompletionRequest['mimeType'],
    }, { config })).rejects.toBeInstanceOf(ResourceUploadVerificationError)
  })
  it('verifies a school-year upload in an administrator-created section', async () => {
    const dynamicInput = { ...input, key: 'student-data/others/2026-2027/Sipalay - Research Plan.pdf' }
    const structure = [{ id: 'student-data', title: 'Student Data', categories: [{ id: 'others', title: 'Others' }] }]
    await expect(verifyResourceUpload(dynamicInput, { config, structure, readPrefix: async () => new TextEncoder().encode("%PDF-1.7"), headObject: async () => ({ ContentLength: 2048, ContentType: 'application/pdf', LastModified: new Date('2026-08-12T05:00:00.000Z') }) })).resolves.toMatchObject({ key: dynamicInput.key, fileSize: 2048 })
  })
})

it("rejects forged PDF metadata when the R2 bytes are HTML", async () => {
  await expect(verifyResourceUpload(input, { config,
    headObject: async () => ({ ContentLength: 2048, ContentType: "application/pdf", LastModified: new Date(), ETag: '"revision"' }),
    readPrefix: async (_bucket, _key, etag) => { expect(etag).toBe('"revision"'); return new TextEncoder().encode("<html>"); },
  })).rejects.toBeInstanceOf(ResourceUploadVerificationError);
});
