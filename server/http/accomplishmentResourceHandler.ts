import { accomplishmentResourceDataSchema } from "../../src/contracts/accomplishmentResource.ts";
import {
  readAccomplishmentResource,
  readAccomplishmentResourceSnapshot,
  writeAccomplishmentResourceSnapshot,
  writeAccomplishmentResource,
} from "../repository/accomplishmentResourceStore.ts";
import { createAdminReportResourceHandler } from "./adminReportResourceHandler.ts";

export const handleAccomplishmentResourceRequest =
  createAdminReportResourceHandler({
    schema: accomplishmentResourceDataSchema,
    read: readAccomplishmentResource,
    readSnapshot: readAccomplishmentResourceSnapshot,
    writeSnapshot: writeAccomplishmentResourceSnapshot,
    write: writeAccomplishmentResource,
    invalidRequestMessage: "The accomplishment resource data is invalid.",
    unavailableCode: "ACCOMPLISHMENT_RESOURCE_UNAVAILABLE",
    unavailableMessage: "The accomplishment resource could not be saved.",
    auditAction: "accomplishment-resource.saved",
    auditTarget: "accomplishment-resource",
  });
