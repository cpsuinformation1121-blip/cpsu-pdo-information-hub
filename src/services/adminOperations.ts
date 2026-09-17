import type { User } from "firebase/auth";
import {
  administratorListSchema,
  administratorSchema,
  type Administrator,
} from "../contracts/adminOperations";
import { parseApiError, readJsonResponse } from "./apiResponse";
import {
  resourceLinkCreateResponseSchema,
  type ResourceLinkCreate,
} from "../contracts/resourceLink";

async function request(
  user: User,
  path: string,
  method = "GET",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers: {
      authorization: `Bearer ${await user.getIdToken()}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      parseApiError(payload, "The administrator operation failed.").message,
    );
  }
  return payload;
}
export async function getAdministrators(user: User) {
  return administratorListSchema.parse(await request(user, "/api/admin/users"))
    .data;
}
export async function createAdministrator(
  user: User,
  input: { email: string; password: string; displayName: string },
): Promise<Administrator> {
  const result = (await request(user, "/api/admin/users", "POST", input)) as {
    data: unknown;
  };
  return administratorSchema.parse(result.data);
}
export async function updateAdministrator(
  user: User,
  input: { uid: string; displayName: string; disabled: boolean },
) {
  return request(user, "/api/admin/users", "PATCH", input);
}
export async function deleteAdministrator(user: User, uid: string) {
  return request(user, "/api/admin/users", "DELETE", { uid });
}
export async function createResourceLink(
  user: User,
  input: ResourceLinkCreate,
) {
  return resourceLinkCreateResponseSchema.parse(
    await request(user, "/api/admin/resource", "POST", input),
  ).data.key;
}
export async function renameResource(
  user: User,
  key: string,
  filename: string,
) {
  return request(user, "/api/admin/resource", "PATCH", { key, filename });
}
export async function deleteResource(
  user: User,
  key: string,
  confirmation: string,
) {
  return request(user, "/api/admin/resource", "DELETE", { key, confirmation });
}
