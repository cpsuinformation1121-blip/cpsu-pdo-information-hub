import type { User } from "firebase/auth";
import { fetchAuthenticatedJson } from "./authenticatedApi";
import {
  adminResourceAccessResponseSchema,
  type AdminResourceAccessMode,
} from "../contracts/adminResourceAccess";
import { apiErrorResponseSchema } from "../contracts/resource";

export async function authorizeAdminResourceAccess(
  user: User,
  key: string,
  mode: AdminResourceAccessMode,
) {
  const { response, payload } = await fetchAuthenticatedJson(
    user,
    "/api/admin/resource-access",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ key, mode }),
    },
  );

  if (!response.ok) {
    const error = apiErrorResponseSchema.safeParse(payload);
    throw new Error(
      error.success
        ? error.data.error.message
        : "The file could not be opened. Please try again.",
    );
  }

  const result = adminResourceAccessResponseSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      "The file access response was not valid. Please try again.",
    );
  }

  const access = result.data.data;
  const accessUrl = new URL(access.url);
  const isLocalDevelopmentUrl =
    import.meta.env.DEV &&
    (accessUrl.hostname === "localhost" || accessUrl.hostname === "127.0.0.1");
  if (accessUrl.protocol !== "https:" && !isLocalDevelopmentUrl) {
    throw new Error("The file access link was not secure. Please try again.");
  }

  return access;
}
