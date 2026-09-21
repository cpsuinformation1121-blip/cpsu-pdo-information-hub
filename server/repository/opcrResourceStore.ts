import {
  opcrResourceDataSchema,
  type OpcrResourceData,
} from "../../src/contracts/opcrResource.ts";
import { createR2JsonResourceStore } from "./jsonResourceStore.ts";

const store = createR2JsonResourceStore<OpcrResourceData>({
  key: "_system/opcr-resource.json",
  defaults: {
    version: 1,
    nodes: [],
    entries: {},
    chartType: "column",
  },
  schema: opcrResourceDataSchema,
  invalidBodyMessage: "Invalid OPCR resource body.",
});

export const createOpcrResourceWriteCommand = store.createWriteCommand;
export const readOpcrResource = store.read;
export const writeOpcrResource = store.write;
