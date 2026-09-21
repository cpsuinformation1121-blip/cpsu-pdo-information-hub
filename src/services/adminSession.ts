import type { User } from "firebase/auth";
import { fetchAuthenticatedJson } from "./authenticatedApi";
import { adminSessionSchema } from "../contracts/adminSession";
import { parseApiError } from "./apiResponse";

export class AdminSessionRequestError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(
    message = "Your administrator access could not be verified.",
    code = "UNKNOWN_ERROR",
    status?: number,
  ) {
    super(message);
    this.name = "AdminSessionRequestError";
    this.code = code;
    this.status = status;
  }
}

export async function fetchAdminSession(user: User) {
  const { response, payload } = await fetchAuthenticatedJson(
    user,
    "/api/admin/session",
  );
  if (!response.ok) {
    const error = parseApiError(
      payload,
      "Your administrator access could not be verified.",
    );
    throw new AdminSessionRequestError(error.message, error.code, response.status);
  }

  const result = adminSessionSchema.safeParse(payload);
  if (!result.success) throw new AdminSessionRequestError();
  return result.data.data;
}
