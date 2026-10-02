import {
  accomplishmentResourceDataSchema,
  type AccomplishmentResourceData,
} from "../../src/contracts/accomplishmentResource.ts";
import { createR2JsonResourceStore } from "./jsonResourceStore.ts";

const store = createR2JsonResourceStore<AccomplishmentResourceData>({
  key: "_system/accomplishment-resource.json",
  defaults: {
    version: 2,
    nodes: [],
    entries: {},
    chartType: "column",
  },
  schema: accomplishmentResourceDataSchema,
  invalidBodyMessage: "Invalid accomplishment resource body.",
});

export const createAccomplishmentResourceWriteCommand =
  store.createWriteCommand;
export const readAccomplishmentResource = store.read;
export const writeAccomplishmentResource = store.write;

export const readAccomplishmentResourceSnapshot = store.readSnapshot;
export const writeAccomplishmentResourceSnapshot = store.writeSnapshot;
