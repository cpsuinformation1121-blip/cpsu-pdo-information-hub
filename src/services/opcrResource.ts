import {
  opcrResourceResponseSchema,
  type OpcrResourceData,
} from "../contracts/opcrResource";
import { createReportResourceClient } from "./reportResource";

const client = createReportResourceClient<OpcrResourceData>({
  adminEndpoint: "/api/admin/opcr-resource",
  publicEndpoint: "/api/opcr",
  responseSchema: opcrResourceResponseSchema,
  adminFailureMessage: "The OPCR resource request failed.",
  publicFailureMessage: "The OPCR data could not be loaded.",
});

export const getOpcrResource = client.getAdmin;
export const saveOpcrResource = client.saveAdmin;
export const getPublicOpcrResource = client.getPublic;
export const getAllPublicOpcrResources = client.getPublicAll;
