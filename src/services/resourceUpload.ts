import { hasResourceFileSignature } from "../utils/hasResourceFileSignature";
import type { User } from "firebase/auth";
import { fetchAuthenticatedJson } from "./authenticatedApi";
import {
  resourceUploadAuthorizationSchema,
  type ResourceUploadRequest,
} from "../contracts/resourceUpload";
import { resourceUploadCompletionResponseSchema } from "../contracts/resourceUpload";
import { RepositoryApiError } from "./resources";
import { parseApiError } from "./apiResponse";

export async function uploadResource(
  user: User,
  file: File,
  input: Omit<ResourceUploadRequest, "filename" | "mimeType" | "fileSize">,
) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasResourceFileSignature(bytes, file.name.split(".").pop() ?? "")) {
    throw new RepositoryApiError("The file contents do not match the selected file type.", "INVALID_FILE_CONTENT", 400);
  }
  const token = await user.getIdToken();
  const {
    response: authorizationResponse,
    payload,
  } = await fetchAuthenticatedJson(
    user,
    "/api/admin/resources/upload-authorize",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...input,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }),
    },
    token,
  );
  if (!authorizationResponse.ok) {
    const error = parseApiError(
      payload,
      "The file could not be prepared for upload.",
    );
    throw new RepositoryApiError(
      error.message,
      error.code,
      authorizationResponse.status,
    );
  }
  const authorization = resourceUploadAuthorizationSchema.parse(payload).data;
  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(authorization.uploadUrl, {
      method: "PUT",
      headers: authorization.headers,
      body: file,
    });
  } catch {
    throw new RepositoryApiError(
      "The file could not be uploaded. Please check your connection and try again.",
      "UPLOAD_NETWORK_FAILED",
      0,
    );
  }
  if (!uploadResponse.ok)
    throw new RepositoryApiError(
      "The file could not be uploaded. Please try again.",
      "UPLOAD_FAILED",
      uploadResponse.status,
    );
  const {
    response: completionResponse,
    payload: completionPayload,
  } = await fetchAuthenticatedJson(
    user,
    "/api/admin/resources/upload-complete",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key: authorization.key,
        mimeType: file.type,
        fileSize: file.size,
      }),
    },
    token,
  );
  if (!completionResponse.ok) {
    const error = parseApiError(
      completionPayload,
      "The upload could not be completed.",
    );
    throw new RepositoryApiError(
      error.message,
      error.code,
      completionResponse.status,
    );
  }
  return resourceUploadCompletionResponseSchema.parse(completionPayload).data
    .key;
}
