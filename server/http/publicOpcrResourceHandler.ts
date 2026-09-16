import type { OpcrResourceData } from "../../src/contracts/opcrResource.ts";
import { readOpcrResource } from "../repository/opcrResourceStore.ts";

const headers = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}
type Dependencies = { read?: (environment?: NodeJS.ProcessEnv) => Promise<OpcrResourceData> };

export async function handlePublicOpcrResourceRequest(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
  dependencies: Dependencies = {},
) {
  if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported." } }, 405);
  const year = new URL(request.url).searchParams.get("year");
  if (!year || !/^\d{4}$/u.test(year)) return json({ error: { code: "INVALID_YEAR", message: "Select a valid year." } }, 400);
  try {
    const data = await (dependencies.read ?? readOpcrResource)(environment);
    return json({ data: { ...data, entries: { [year]: data.entries[year] ?? {} } } });
  } catch {
    return json({ error: { code: "OPCR_RESOURCE_UNAVAILABLE", message: "OPCR data is temporarily unavailable." } }, 503);
  }
}
