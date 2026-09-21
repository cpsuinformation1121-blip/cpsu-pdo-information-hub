import type { AccomplishmentResourceData } from "../../src/contracts/accomplishmentResource.ts";
import { readAccomplishmentResource } from "../repository/accomplishmentResourceStore.ts";
import { createPublicReportResourceHandler } from "./publicReportResourceHandler.ts";

export const handlePublicAccomplishmentResourceRequest =
  createPublicReportResourceHandler<AccomplishmentResourceData>({
    read: readAccomplishmentResource,
    unavailableCode: "ACCOMPLISHMENT_RESOURCE_UNAVAILABLE",
    unavailableMessage: "Accomplishment data is temporarily unavailable.",
  });
