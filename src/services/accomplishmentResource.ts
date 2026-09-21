import {
  accomplishmentResourceResponseSchema,
  type AccomplishmentResourceData,
} from "../contracts/accomplishmentResource";
import { createReportResourceClient } from "./reportResource";

const client = createReportResourceClient<AccomplishmentResourceData>({
  adminEndpoint: "/api/admin/accomplishment-resource",
  publicEndpoint: "/api/accomplishments",
  responseSchema: accomplishmentResourceResponseSchema,
  adminFailureMessage: "The accomplishment resource request failed.",
  publicFailureMessage: "The accomplishment data could not be loaded.",
});

export const getAccomplishmentResource = client.getAdmin;
export const saveAccomplishmentResource = client.saveAdmin;
export const getPublicAccomplishmentResource = client.getPublic;
