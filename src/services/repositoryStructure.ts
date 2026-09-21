import type { User } from "firebase/auth";
import { fetchAuthenticatedJson } from "./authenticatedApi";
import { parseApiError } from "./apiResponse";
import { repositoryStructureSchema } from "../contracts/repositoryStructure";
export async function getRepositoryStructure() {
  const response = await fetch("/api/repository-structure");
  if (!response.ok) throw new Error("Repository structure is unavailable.");
  return repositoryStructureSchema.parse(await response.json()).data;
}
export async function mutateRepositoryStructure(user: User, body: unknown) {
  const { response, payload } = await fetchAuthenticatedJson(
    user,
    "/api/admin/repository-structure",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    const error = parseApiError(payload, "The structure operation failed.");
    throw new Error(error.message);
  }
  return repositoryStructureSchema.parse(payload).data;
}
