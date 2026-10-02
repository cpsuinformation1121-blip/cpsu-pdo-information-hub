import type { DecodedIdToken } from 'firebase-admin/auth'
import { describe, expect, it } from 'vitest'
import type { R2Config } from '../config/r2'
import { handleUploadCompleteRequest } from './uploadCompleteHandler'

const identity = { uid: 'admin', email: 'admin@cpsu.edu.ph', admin: true } as unknown as DecodedIdToken
const config: R2Config = { accountId: 'account', accessKeyId: 'key', secretAccessKey: 'secret', bucketName: 'bucket', endpoint: 'https://account.r2.cloudflarestorage.com' }
const body = { key: 'statistical-profile/student-population/2026/student-population-2026-test.pdf', mimeType: 'application/pdf', fileSize: 2048 }

describe('handleUploadCompleteRequest', () => {
  it('requires authentication', async () => {
    const response = await handleUploadCompleteRequest(new Request('http://localhost/api/admin/resources/upload-complete', { method: 'POST', body: JSON.stringify(body) }))
    expect(response.status).toBe(401)
  })
  it('confirms a matching R2 object', async () => {
    const response = await handleUploadCompleteRequest(new Request('http://localhost/api/admin/resources/upload-complete', { method: 'POST', headers: { authorization: 'Bearer valid' }, body: JSON.stringify(body) }), { verifyIdToken: async () => identity, verification: { config, readPrefix: async () => new TextEncoder().encode("%PDF-1.7"), headObject: async () => ({ ContentLength: 2048, ContentType: 'application/pdf', LastModified: new Date('2026-08-12T05:00:00.000Z') }) }, audit: async () => '_system/audit/test.json' })
    expect(response.status).toBe(200)
  })
  it('rejects mismatched uploaded metadata', async () => {
    const response = await handleUploadCompleteRequest(new Request('http://localhost/api/admin/resources/upload-complete', { method: 'POST', headers: { authorization: 'Bearer valid' }, body: JSON.stringify(body) }), { verifyIdToken: async () => identity, verification: { config, readPrefix: async () => new TextEncoder().encode("%PDF-1.7"), headObject: async () => ({ ContentLength: 999, ContentType: 'application/pdf', LastModified: new Date() }) }, audit: async () => '_system/audit/test.json' })
    expect(response.status).toBe(422)
  })
  it('rejects Excel upload completion metadata', async () => {
    const response = await handleUploadCompleteRequest(new Request('http://localhost/api/admin/resources/upload-complete', { method: 'POST', headers: { authorization: 'Bearer valid' }, body: JSON.stringify({ ...body, key: 'statistical-profile/student-population/2026/statistics.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) }), { verifyIdToken: async () => identity })
    expect(response.status).toBe(400)
  })
})
