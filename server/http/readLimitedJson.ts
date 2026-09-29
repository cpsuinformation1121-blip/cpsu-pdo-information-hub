export class RequestBodyTooLargeError extends Error {}
export class InvalidJsonBodyError extends Error {}

export async function readLimitedJson(request: Request, maximumBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) throw new InvalidJsonBodyError();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteCount += value.byteLength;
      if (byteCount > maximumBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) throw error;
    throw new InvalidJsonBodyError();
  } finally {
    reader.releaseLock();
  }
}
