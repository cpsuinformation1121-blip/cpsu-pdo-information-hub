import { handlePublicOpcrResourceRequest } from "../server/http/publicOpcrResourceHandler.ts";

export default {
  fetch(request: Request) {
    return handlePublicOpcrResourceRequest(request);
  },
};
