import { handleOpcrResourceRequest } from "../../server/http/opcrResourceHandler.ts";

export default {
  fetch(request: Request) {
    return handleOpcrResourceRequest(request);
  },
};
