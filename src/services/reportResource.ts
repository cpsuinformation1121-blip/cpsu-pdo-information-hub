import type { User } from "firebase/auth";
import { fetchAuthenticatedJson } from "./authenticatedApi";
import { parseApiError, readJsonResponse } from "./apiResponse";

type ResponseSchema<Data> = {
  parse: (value: unknown) => { data: Data };
};

type ReportResourceClientOptions<Data> = {
  adminEndpoint: string;
  publicEndpoint: string;
  responseSchema: ResponseSchema<Data>;
  adminFailureMessage: string;
  publicFailureMessage: string;
};

export function createReportResourceClient<Data>(
  options: ReportResourceClientOptions<Data>,
) {
  async function requestAdmin(user: User, init?: RequestInit) {
    const { response, payload } = await fetchAuthenticatedJson(
      user,
      options.adminEndpoint,
      {
        ...init,
        headers: init?.body ? { "content-type": "application/json" } : undefined,
      },
    );

    if (!response.ok) {
      const error = parseApiError(payload, options.adminFailureMessage);
      throw new Error(error.message);
    }

    return options.responseSchema.parse(payload).data;
  }

  async function getPublic(year: number, signal?: AbortSignal) {
    const response = await fetch(
      `${options.publicEndpoint}?year=${encodeURIComponent(year)}`,
      {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal,
      },
    );
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      const error = parseApiError(payload, options.publicFailureMessage);
      throw new Error(error.message);
    }

    return options.responseSchema.parse(payload).data;
  }

  return {
    getAdmin: (user: User) => requestAdmin(user),
    saveAdmin: (user: User, data: Data) =>
      requestAdmin(user, { method: "PUT", body: JSON.stringify(data) }),
    getPublic,
  };
}
