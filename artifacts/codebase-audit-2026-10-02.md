# Codebase bug and security review - 2026-10-02

Reviewed the repository graph, source organization, authentication and authorization boundaries, resource listing and metadata mutation paths, upload authorization/completion, public preview/link access, report persistence, client caching, dialog workflows, and dependency advisories. Changes extend existing components, contracts, services, and R2 stores; no database, architectural migration, or folder restructuring was introduced.

## Findings fixed

| Finding | Fix |
| --- | --- |
| Public browsing fetched only the first API page | Follow all cursors through the existing TanStack Query request, preserving filters and cancellation; errors do not silently return partial results. |
| Same category IDs could merge resources from different sections | Scope grouping and title lookups by both section and category. |
| Uploads, link creation, deletion, rename, and structure changes could leave local server caches stale | Invalidate the relevant process caches after successful mutations. Existing CDN caching can still serve metadata until its 60-second TTL. |
| Small metadata APIs read unbounded JSON bodies | Enforce a streamed 16 KiB limit, including requests with missing or false Content-Length; return safe 413/400 responses. Existing report-body limits remain in place. |
| Missing provider configuration or unexpected exceptions could escape safe response handling | Move provider initialization into protected try/catch blocks and add a safe API entrypoint fallback. |
| Invalid double-period filenames could be uploaded but then rejected as resource keys | Apply the same safety restriction before upload/link creation; also reject malformed Unicode before URI encoding. |
| School-year validation accepted years outside the calendar-year range | Apply the supported 1900-2200 start-year range. |
| Links could be created with URLs too large for the stored-link reader | Validate URL length and encoded JSON payload size before creation. |
| Filename/MIME checks trusted the stated type without checking bytes | Check PDF/JPEG/PNG/WebP signatures in the browser before upload and again against R2 bytes at completion, using a bounded range GET and the HEAD ETag. |
| Account listing stopped after one Firebase page | Traverse all account pages; repeated provider cursors fail safely. |
| Account mutation APIs could target ordinary Firebase users | Require the target account to qualify as an administrator, preserving owner and self-protection checks. |
| Legacy rename dropped nested category prefixes | Preserve the complete parsed category path and validate the destination. |
| Cached administrator data survived session changes | Cancel and remove private queries on authentication changes while preserving public caches. |
| Deleting the last resource on an admin page left an empty page | Reset pagination after deletion; reset prior mutation errors when opening another deletion. |
| Pending deletion/rename dialogs could be dismissed | Guard closing and disable Cancel until completion. |
| Native dialogs had no accessible name | Associate the title and optional description with the dialog. |
| Report editors could mark newer edits saved when an older request completed | Track edit/save revisions and confirm only the submitted revision. |
| OPCR saves invalidated the accomplishment query instead of OPCR | Invalidate the correct public OPCR query. |
| Concurrent report editors could overwrite each other's saves | Return R2 revision headers and use If-Match/If-None-Match writes; missing revisions return 428 and conflicting saves return 409 while keeping the draft. No historical file versions are created. |
| Time-based report item IDs could collide | Use browser-generated UUIDs for new items. |
| Malformed provider error metadata or repeated pagination tokens could cause secondary errors or endless requests | Narrow metadata types and reject repeated cursors. |
| Installed dependency versions had published advisories | Patch the gRPC transitive dependency and update Vitest/brace-expansion within compatible dependency ranges; Firebase's major version remains unchanged. |

## Validation

- TypeScript validation passed.
- ESLint passed.
- Vitest: **312 tests passed across 54 files** (61 additional tests compared with the pre-audit suite).
- Production frontend and Vercel API build passed.
- Full npm audit and production-only audit: **0 known vulnerabilities**.
- Browser checks with isolated fixtures passed for both report editors, pending-save edits, report revision request headers, public pagination and grouped modals, mobile width, and last-item admin deletion with pending-dialog protection.
- Temporary browser harness files were removed. Screenshots remain in codebase-audit-qa/.

## Scope and practical limits

Tests use fixtures and provider mocks; live Firebase/R2 configuration and production deployments were not changed or verified. Existing private-bucket, token-verification, short-lived access, and audit requirements remain in force. Header signatures verify the declared file family; they are not a complete document parser or malware scan. R2 resource moves continue to use the existing copy-then-delete flow, rather than an atomic multi-object transaction. Cache invalidation is local to the running process; existing edge-cache TTLs remain relevant.

Security references checked: [gRPC maintainer advisory](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j), [Cloudflare conditional operations](https://developers.cloudflare.com/r2/api/s3/api/), and [Cloudflare destination-copy conditions](https://developers.cloudflare.com/r2/api/s3/extensions/).

Knowledge graph refreshed with AST extraction: 1,346 nodes, 2,836 edges, 87 communities; LLM token cost: 0. The extractor reported no AST nodes for hooks.json, so that configuration file is outside the code graph. Source review and tests were used alongside graph queries.
