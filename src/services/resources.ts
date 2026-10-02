import {
  publicResourceListResponseSchema,
  type PublicResourceListResponse,
  type ResourceQuery,
} from "../contracts/resource";
import { parseApiError, readJsonResponse } from "./apiResponse";

export class RepositoryApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "RepositoryApiError";
    this.code = code;
    this.status = status;
  }
}

export async function getResources(
  query: Partial<ResourceQuery> = {},
  signal?: AbortSignal,
): Promise<PublicResourceListResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "")
      searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  const response = await fetch(
    `/api/resources${queryString ? `?${queryString}` : ""}`,
    {
      headers: { accept: "application/json" },
      signal,
    },
  );
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    const error = parseApiError(payload, "The repository request failed.");
    throw new RepositoryApiError(error.message, error.code, response.status);
  }

  return publicResourceListResponseSchema.parse(payload);
}

export async function getAllResources(
  query: Partial<ResourceQuery> = {},
  signal?: AbortSignal,
): Promise<PublicResourceListResponse> {
  let page = await getResources(query, signal);
  const data = [...page.data];
  const cursors = new Set<string>();
  while (page.meta.nextCursor) {
    const cursor = page.meta.nextCursor;
    if (cursors.has(cursor) || cursors.size >= 10_000) {
      throw new RepositoryApiError("The repository could not finish loading. Please try again.", "INVALID_PAGINATION", 502);
    }
    cursors.add(cursor);
    page = await getResources({ ...query, cursor }, signal);
    data.push(...page.data);
  }
  return { data, meta: page.meta };
}
