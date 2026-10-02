import { opcrResourceDataSchema } from "../../src/contracts/opcrResource.ts";
import {
  readOpcrResource,
  readOpcrResourceSnapshot,
  writeOpcrResourceSnapshot,
  writeOpcrResource,
} from "../repository/opcrResourceStore.ts";
import { createAdminReportResourceHandler } from "./adminReportResourceHandler.ts";

export const handleOpcrResourceRequest = createAdminReportResourceHandler({
  schema: opcrResourceDataSchema,
  read: readOpcrResource,
  readSnapshot: readOpcrResourceSnapshot,
  writeSnapshot: writeOpcrResourceSnapshot,
  write: writeOpcrResource,
  invalidRequestMessage: "The OPCR resource data is invalid.",
  unavailableCode: "OPCR_RESOURCE_UNAVAILABLE",
  unavailableMessage: "The OPCR resource is temporarily unavailable.",
  auditAction: "opcr-resource.saved",
  auditTarget: "opcr-resource",
});
