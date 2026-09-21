import type { OpcrResourceData } from "../../src/contracts/opcrResource.ts";
import { readOpcrResource } from "../repository/opcrResourceStore.ts";
import { createPublicReportResourceHandler } from "./publicReportResourceHandler.ts";

export const handlePublicOpcrResourceRequest =
  createPublicReportResourceHandler<OpcrResourceData>({
    read: readOpcrResource,
    unavailableCode: "OPCR_RESOURCE_UNAVAILABLE",
    unavailableMessage: "OPCR data is temporarily unavailable.",
  });
