import type { User } from "firebase/auth";
import { fetchAuthenticatedJson } from "./authenticatedApi";
import {
  adminResourceListResponseSchema,
  type AdminResourceListResponse,
  type ResourceQuery,
} from "../contracts/resource";
import { parseApiError } from "./apiResponse";
import { RepositoryApiError } from "./resources";

export async function getAdminResources(
  user: User,
  query: Partial<ResourceQuery> = {},
  signal?: AbortSignal,
): Promise<AdminResourceListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "")
      searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  const path =
    "/api/admin/resources" + (queryString ? "?" + queryString : "");
  const { response, payload } = await fetchAuthenticatedJson(user, path, {
    headers: { accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    const error = parseApiError(
      payload,
      "The administrator resource request failed.",
    );
    throw new RepositoryApiError(error.message, error.code, response.status);
  }

  return adminResourceListResponseSchema.parse(payload);
}
