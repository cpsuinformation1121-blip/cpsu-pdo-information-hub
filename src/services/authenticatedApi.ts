import type { User } from "firebase/auth";
import { readJsonResponse } from "./apiResponse";

export async function fetchAuthenticatedJson(
  user: User,
  input: RequestInfo | URL,
  init: RequestInit = {},
  idToken?: string,
) {
  const headers = new Headers(init.headers);
  headers.set("authorization", "Bearer " + (idToken ?? (await user.getIdToken())));

  const response = await fetch(input, { ...init, headers });
  return {
    response,
    payload: await readJsonResponse(response),
  };
}
