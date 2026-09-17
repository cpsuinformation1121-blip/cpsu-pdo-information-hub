import type { Plugin } from "vite";
import { handlePublicResourcePreviewRequest } from "../http/publicResourcePreviewHandler.ts";
import { handlePublicResourceLinkRequest } from "../http/publicResourceLinkHandler.ts";
import { handleResourcesRequest } from "../http/resourcesHandler.ts";
import { createDevRequest, writeDevResponse } from "./httpAdapter.ts";

export function resourcesApiPlugin(environment: NodeJS.ProcessEnv): Plugin {
  return {
    name: "cpsu-resources-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url) {
          next();
          return;
        }

        const path = new URL(request.url, "http://localhost").pathname;
        if (
          path !== "/api/resources" &&
          path !== "/api/resource-preview" &&
          path !== "/api/resource-link"
        ) {
          next();
          return;
        }

        const apiRequest = await createDevRequest(request);
        const apiResponse =
          path === "/api/resource-preview"
            ? await handlePublicResourcePreviewRequest(apiRequest, {
                environment,
              })
            : path === "/api/resource-link"
              ? await handlePublicResourceLinkRequest(apiRequest, {
                  environment,
                })
              : await handleResourcesRequest(apiRequest, { environment });

        await writeDevResponse(response, apiResponse);
      });
    },
  };
}
