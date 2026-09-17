---
type: "query"
date: "2026-09-17T02:49:33.448226+00:00"
question: "guide me to fix the recommended Vercel repair order"
contributor: "graphify"
outcome: "useful"
source_nodes: ["Vercel Server APIs", "vercel.json", "AdminRoutes.tsx", "handleAdminSessionRequest()", "handleResourcesRequest()", "R2Config"]
---

# Q: guide me to fix the recommended Vercel repair order

## Answer

Expanded from original query via graph vocab: [vercel, api, admin, routes, handler, build, firebase, authentication, repository, upload, session, config]. Preserved the single-function Vercel Hobby architecture by changing the generated function from api/[...path].js to api/handler.js, adding a first rewrite from /api/:path* to /api/handler?__apiPath=:path*, resolving that rewritten path inside server/apiEntry.ts, and adding the Vite SPA fallback afterward. Added regression tests for direct routes, rewritten nested upload/session routes, protected handler dispatch, and application JSON 404 behavior. Updated stale deployment troubleshooting. Production build, typecheck, lint, 34 test files/159 tests, rewritten public R2 request (200), and rewritten protected session request (401 application response) all pass.

## Outcome

- Signal: useful

## Source Nodes

- Vercel Server APIs
- vercel.json
- AdminRoutes.tsx
- handleAdminSessionRequest()
- handleResourcesRequest()
- R2Config