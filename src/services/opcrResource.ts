import type { User } from "firebase/auth";
import {
  opcrResourceResponseSchema,
  type OpcrResourceData,
} from "../contracts/opcrResource";
import { parseApiError, readJsonResponse } from "./apiResponse";

async function request(
  user: User,
  init?: RequestInit,
): Promise<OpcrResourceData> {
  const response = await fetch("/api/admin/opcr-resource", {
    ...init,
    headers: {
      authorization: `Bearer ${await user.getIdToken()}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error &&
      "message" in payload.error
        ? String(payload.error.message)
        : "The OPCR resource request failed.";
    throw new Error(message);
  }
  return opcrResourceResponseSchema.parse(payload).data;
}

export function getOpcrResource(user: User) {
  return request(user);
}

export function saveOpcrResource(user: User, data: OpcrResourceData) {
  return request(user, { method: "PUT", body: JSON.stringify(data) });
}

export async function getPublicOpcrResource(year: number, signal?: AbortSignal) {
  const response = await fetch(`/api/opcr?year=${year}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal,
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload, "The OPCR data could not be loaded.").message);
  }
  return opcrResourceResponseSchema.parse(payload).data;
}
