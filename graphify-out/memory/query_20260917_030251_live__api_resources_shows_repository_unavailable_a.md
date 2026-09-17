---
type: "query"
date: "2026-09-17T03:02:51.678041+00:00"
question: "Live /api/resources shows REPOSITORY_UNAVAILABLE after deployment"
contributor: "graphify"
outcome: "useful"
source_nodes: ["R2Config", "getR2Config()", "listResources()", "resourcesHandler.ts", "Vercel Server APIs", "Cloudflare R2 File Repository"]
---

# Q: Live /api/resources shows REPOSITORY_UNAVAILABLE after deployment

## Answer

Expanded from original query via graph vocab: [repository, unavailable, cloudflare, config, environment, vercel, error, list, resources, server]. Live checks confirm the repaired deployment is active: /admin/login returns HTML 200, /api/admin/session returns application JSON 401, and /api/handler?__apiPath=admin/session returns the same JSON 401. /api/resources still returns application JSON 503 REPOSITORY_UNAVAILABLE. Because the same generated handler lists R2 successfully with local .env.local and the live route is now correct, the remaining failure is isolated to Vercel Production R2 runtime configuration or credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, or an invalid R2_ENDPOINT.

## Outcome

- Signal: useful

## Source Nodes

- R2Config
- getR2Config()
- listResources()
- resourcesHandler.ts
- Vercel Server APIs
- Cloudflare R2 File Repository