import { handleAdminResourceAccessRequest } from "./http/adminResourceAccessHandler.ts";
import { handleAdminResourceMutationRequest } from "./http/adminResourceMutationHandler.ts";
import { handleAdminResourcesRequest } from "./http/adminResourcesHandler.ts";
import { handleAdminSessionRequest } from "./http/adminSessionHandler.ts";
import { handleAdminUsersRequest } from "./http/adminUsersHandler.ts";
import { handleAccomplishmentResourceRequest } from "./http/accomplishmentResourceHandler.ts";
import { handleOpcrResourceRequest } from "./http/opcrResourceHandler.ts";
import { handlePublicAccomplishmentResourceRequest } from "./http/publicAccomplishmentResourceHandler.ts";
import { handlePublicOpcrResourceRequest } from "./http/publicOpcrResourceHandler.ts";
import { handlePublicResourcePreviewRequest } from "./http/publicResourcePreviewHandler.ts";
import {
  handleAdminRepositoryStructureRequest,
  handleRepositoryStructureRequest,
} from "./http/repositoryStructureHandler.ts";
import { handleResourcesRequest } from "./http/resourcesHandler.ts";
import { handleUploadAuthorizeRequest } from "./http/uploadAuthorizeHandler.ts";
import { handleUploadCompleteRequest } from "./http/uploadCompleteHandler.ts";

type ApiHandler = (request: Request) => Response | Promise<Response>;

const rewrittenApiPathParameter = "__apiPath";

const routes: Record<string, ApiHandler> = {
  "/api/resources": handleResourcesRequest,
  "/api/resource-preview": handlePublicResourcePreviewRequest,
  "/api/repository-structure": handleRepositoryStructureRequest,
  "/api/accomplishments": handlePublicAccomplishmentResourceRequest,
  "/api/opcr": handlePublicOpcrResourceRequest,
  "/api/admin/session": handleAdminSessionRequest,
  "/api/admin/resources": handleAdminResourcesRequest,
  "/api/admin/resources/upload-authorize": handleUploadAuthorizeRequest,
  "/api/admin/resources/upload-complete": handleUploadCompleteRequest,
  "/api/admin/resource": handleAdminResourceMutationRequest,
  "/api/admin/resource-access": handleAdminResourceAccessRequest,
  "/api/admin/repository-structure": handleAdminRepositoryStructureRequest,
  "/api/admin/accomplishment-resource": handleAccomplishmentResourceRequest,
  "/api/admin/opcr-resource": handleOpcrResourceRequest,
  "/api/admin/users": handleAdminUsersRequest,
};

function notFound() {
  return new Response(
    JSON.stringify({
      error: {
        code: "NOT_FOUND",
        message: "The requested endpoint does not exist.",
      },
    }),
    {
      status: 404,
      headers: {
        "cache-control": "private, no-store",
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

export function resolveApiPath(request: Request) {
  const url = new URL(request.url);
  const rewrittenPath = url.searchParams.get(rewrittenApiPathParameter);

  if (rewrittenPath === null) return url.pathname;

  const normalizedPath = rewrittenPath.replace(/^\/+|\/+$/gu, "");
  return normalizedPath ? `/api/${normalizedPath}` : "/api";
}

export default {
  fetch(request: Request) {
    const handler = routes[resolveApiPath(request)];
    return handler ? handler(request) : notFound();
  },
};
