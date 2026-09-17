---
type: "query"
date: "2026-09-17T07:27:37.029917+00:00"
question: "fix the Forms section contents missing on Vercel"
contributor: "graphify"
outcome: "useful"
source_nodes: ["repository.ts", "navigation.ts", "resource.ts", "repositoryStructureStore.ts", "repositoryStructureStore.test.ts"]
---

# Q: fix the Forms section contents missing on Vercel

## Answer

Added Forms as a supported repository section and navigation filter, plus an additive server-side migration that injects Forms into repository structures saved by older deployments while preserving an existing administrator-managed Forms definition. Rebuilt the bundled Vercel API and added regression tests.

## Outcome

- Signal: useful

## Source Nodes

- repository.ts
- navigation.ts
- resource.ts
- repositoryStructureStore.ts
- repositoryStructureStore.test.ts