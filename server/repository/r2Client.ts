import { ListObjectsV2Command, S3Client, type ListObjectsV2CommandInput } from '@aws-sdk/client-s3'
import type { R2Config } from '../config/r2.ts'

export type R2ObjectSummary = {
  Key?: string
  LastModified?: Date
  Size?: number
  Metadata?: Record<string, string>
}

export type R2ObjectPage = {
  Contents?: R2ObjectSummary[]
  IsTruncated?: boolean
  NextContinuationToken?: string
}

export type ListR2Objects = (input: ListObjectsV2CommandInput) => Promise<R2ObjectPage>

export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export function createR2ObjectLister(client: S3Client): ListR2Objects {
  return async (input) => client.send(new ListObjectsV2Command(input))
}
