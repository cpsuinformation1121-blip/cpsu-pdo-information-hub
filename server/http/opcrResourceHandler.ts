import { opcrResourceDataSchema } from "../../src/contracts/opcrResource.ts";
import { AdminAuthorizationError, authenticateAdminRequest } from "../auth/authenticateAdminRequest.ts";
import { readOpcrResource, writeOpcrResource } from "../repository/opcrResourceStore.ts";
import { recordAuditEvent } from "../security/auditLog.ts";

const headers = { "cache-control": "private, no-store", "content-type": "application/json; charset=utf-8" };
function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
}

export async function handleOpcrResourceRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
) {
  let identity;
  try {
    identity = await authenticateAdminRequest(request, { environment });
  } catch (error) {
    if (error instanceof AdminAuthorizationError)
      return json({ error: { code: "FORBIDDEN", message: error.message } }, 403);
    return json({ error: { code: "UNAUTHORIZED", message: "Authentication is required." } }, 401);
  }
  try {
    if (request.method === "GET") return json({ data: await readOpcrResource(environment) });
    if (request.method !== "PUT") {
      return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Only GET and PUT are supported." } }, 405, { allow: "GET, PUT" });
    }
    const parsed = opcrResourceDataSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: { code: "INVALID_REQUEST", message: "The OPCR resource data is invalid." } }, 400);
    await recordAuditEvent({ action: "opcr-resource.saved", actor: identity, target: "opcr-resource", outcome: "attempted" }, environment);
    return json({ data: await writeOpcrResource(parsed.data, environment) });
  } catch {
    return json({ error: { code: "OPCR_RESOURCE_UNAVAILABLE", message: "The OPCR resource is temporarily unavailable." } }, 503);
  }
}
