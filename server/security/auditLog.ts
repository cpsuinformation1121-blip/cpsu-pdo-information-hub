import { randomUUID } from 'node:crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { z } from 'zod'
import { getR2Config } from '../config/r2.ts'
import { createR2Client } from '../repository/r2Client.ts'

export const auditActions = [
  'resource.uploaded',
  'resource.renamed',
  'resource.deleted',
  'resource.accessed',
  'structure.changed',
  'accomplishment-resource.saved',
  'opcr-resource.saved',
  'administrator.created',
  'administrator.updated',
  'administrator.deleted',
] as const

export type AuditAction = (typeof auditActions)[number]

export type AuditEventInput = {
  action: AuditAction
  actor: Pick<DecodedIdToken, 'uid' | 'email'>
  target: string
  outcome: 'attempted' | 'succeeded' | 'failed'
  details?: Record<string, string | number | boolean | null>
}

const auditEnvironmentSchema = z.object({
  R2_AUDIT_BUCKET_NAME: z.string().trim().min(1),
})

export async function recordAuditEvent(
  event: AuditEventInput,
  environment: NodeJS.ProcessEnv = process.env,
) {
  const occurredAt = new Date()
  const id = randomUUID()
  const date = occurredAt.toISOString().slice(0, 10).replaceAll('-', '/')
  const timestamp = occurredAt.toISOString().replaceAll(':', '-')
  const key = `_system/audit/${date}/${timestamp}-${id}.json`
  const config = getR2Config(environment)
  const auditEnvironment = auditEnvironmentSchema.safeParse(environment)
  if (!auditEnvironment.success) {
    throw new Error('The private audit bucket is not configured.')
  }

  await createR2Client(config).send(createAuditWriteCommand(
    auditEnvironment.data.R2_AUDIT_BUCKET_NAME,
    key,
    {
      id,
      occurredAt: occurredAt.toISOString(),
      action: event.action,
      outcome: event.outcome,
      actor: {
        uid: event.actor.uid,
        email: event.actor.email ?? null,
      },
      target: event.target,
      details: event.details ?? {},
    },
  ))

  return key
}

export function createAuditWriteCommand(
  bucketName: string,
  key: string,
  event: Record<string, unknown>,
) {
  return new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(event),
    ContentType: 'application/json',
    CacheControl: 'private, no-store',
    IfNoneMatch: '*',
  })
}
