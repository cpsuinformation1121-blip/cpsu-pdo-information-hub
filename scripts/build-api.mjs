import { build } from "esbuild";

await build({
  entryPoints: ["server/apiEntry.ts"],
  outfile: "api/handler.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  legalComments: "none",
  logLevel: "info",
});
