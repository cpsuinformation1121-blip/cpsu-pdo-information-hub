import { handleAdminResourceAccessRequest } from "../server/http/adminResourceAccessHandler.ts";
import { handleAdminResourceMutationRequest } from "../server/http/adminResourceMutationHandler.ts";
import { handleAdminResourcesRequest } from "../server/http/adminResourcesHandler.ts";
import { handleAdminSessionRequest } from "../server/http/adminSessionHandler.ts";
import { handleAdminUsersRequest } from "../server/http/adminUsersHandler.ts";
import { handleAccomplishmentResourceRequest } from "../server/http/accomplishmentResourceHandler.ts";
import { handleOpcrResourceRequest } from "../server/http/opcrResourceHandler.ts";
import { handlePublicAccomplishmentResourceRequest } from "../server/http/publicAccomplishmentResourceHandler.ts";
import { handlePublicOpcrResourceRequest } from "../server/http/publicOpcrResourceHandler.ts";
import { handlePublicResourcePreviewRequest } from "../server/http/publicResourcePreviewHandler.ts";
import {
  handleAdminRepositoryStructureRequest,
  handleRepositoryStructureRequest,
} from "../server/http/repositoryStructureHandler.ts";
import { handleResourcesRequest } from "../server/http/resourcesHandler.ts";
import { handleUploadAuthorizeRequest } from "../server/http/uploadAuthorizeHandler.ts";
import { handleUploadCompleteRequest } from "../server/http/uploadCompleteHandler.ts";

type ApiHandler = (request: Request) => Response | Promise<Response>;

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

export default {
  fetch(request: Request) {
    const handler = routes[new URL(request.url).pathname];
    return handler ? handler(request) : notFound();
  },
};
