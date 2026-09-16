# Graph Report - cpsu-pdo-information-hub  (2026-09-16)

## Corpus Check
- 197 files · ~150,983 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1003 nodes · 2056 edges · 63 communities (61 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `81e31b21`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RepositoryResults.tsx
- repositoryStructureStore.ts
- devDependencies
- dependencies
- compilerOptions
- compilerOptions
- Graphify
- Cloudflare R2 File Repository
- AdminResourceInventory.tsx
- authenticateAdminRequest
- AppRouter.tsx
- SVG icon symbol sprite
- Central Philippines State University Seal
- Application favicon
- OpcrPublicPage.tsx
- parseResourceObjectKey.ts
- AdminOpcrPage.tsx
- Metadata Derived from R2 Object Keys
- Content Is the Design
- The Institutional Archive
- tsconfig.json
- accomplishmentResourceStore.ts
- adminOperationsApiPlugin.ts
- AdminAccomplishResourcePage.tsx
- contracts/resource.ts
- getR2Config
- design-qa.md
- contracts/resourceUpload.ts
- listResources.ts
- useRepositoryStructureQuery
- useAuth.ts
- contracts/adminResourceAccess.ts
- r2.ts
- AccomplishmentChart.tsx
- repositoryStructureHandler.ts
- useAdminResourcesQuery.ts
- AccomplishmentsPage.tsx
- Q: Analyze the whole codebase and change the whole UI to a soft aesthetic with Poppins and color-preserving modals.
- Q: Change the header by moving the contents of the menu dropdown to the header, with no hamburger menu unless it is mobile view.
- Q: Remove Excel files from upload so only images and PDF files can be uploaded.
- Q: remove the excess excel visualizations in the whole codebase please analyze it
- Q: please Identify the possible fix in this error since I am possitive my internet connection is fine though
- Q: this project not been deployed to vercel yet please let us fix the problem guide me
- Q: I am lost in the 2 buckets please give me full guide in those 2 buckets which is cpsu-pdo-information-hub and cpsu-pdo-audit
- Q: I have problem in this the name section files just make it under statistical profile or whatever and make sure to hierarchy in the categories please the no category first and so on whatever the arrangement of the categories please make it like that
- Q: look at the choose file button it's not consistent to others
- Q: check the whole codebase if everything is working, if there's a problem please list it and what is the possible fix in this system
- Q: in the admin/resources please fix this names it should be one line.
- Q: analyze the whole codebase of this app please.
- vercel.json
- adminResourceMutationHandler.ts
- accomplishments/reportAppearance.ts
- adminResourceAccessHandler.ts
- services/adminSession.ts
- ResourceUploadForm.tsx
- services/adminOperations.ts
- PublicHeader.tsx
- AdminLoginPage.tsx
- AdminRoutes.tsx
- App.tsx
- readJsonResponse

## God Nodes (most connected - your core abstractions)
1. `getR2Config()` - 27 edges
2. `createR2Client()` - 26 edges
3. `useAuth()` - 25 edges
4. `authenticateAdminRequest()` - 24 edges
5. `readJsonResponse()` - 19 edges
6. `compilerOptions` - 18 edges
7. `parseApiError()` - 17 edges
8. `R2Config` - 16 edges
9. `readRepositoryStructure()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `R2 Object Key Convention` --semantically_similar_to--> `Metadata Derived from R2 Object Keys`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `fetch()` --calls--> `handlePublicAccomplishmentResourceRequest()`  [EXTRACTED]
  api/accomplishments.ts → server/http/publicAccomplishmentResourceHandler.ts
- `fetch()` --calls--> `handleAccomplishmentResourceRequest()`  [EXTRACTED]
  api/admin/accomplishment-resource.ts → server/http/accomplishmentResourceHandler.ts
- `fetch()` --calls--> `handleAdminRepositoryStructureRequest()`  [EXTRACTED]
  api/admin/repository-structure.ts → server/http/repositoryStructureHandler.ts
- `fetch()` --calls--> `handleAdminResourcesRequest()`  [EXTRACTED]
  api/admin/resources.ts → server/http/adminResourcesHandler.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Extraction Pipeline** — _codex_skills_graphify_skill_persistent_knowledge_graph, _codex_skills_graphify_skill_structural_and_semantic_extraction, _codex_skills_graphify_references_extraction_spec_confidence_rubric [EXTRACTED 1.00]
- **CPSU Repository Architecture** — agents_firebase_authentication, agents_cloudflare_r2_repository, agents_vercel_server_apis, agents_react_application [EXTRACTED 1.00]
- **CPSU Institutional Design Signature** — design_aesthetics_institutional_archive, design_aesthetics_cpsu_visual_identity, design_aesthetics_archive_motifs [EXTRACTED 1.00]
- **Favicon emblem composition** — public_favicon_favicon, public_favicon_lightning_bolt, public_favicon_purple_palette, public_favicon_blue_highlights, public_favicon_blurred_glow, public_favicon_alpha_mask [EXTRACTED 1.00]
- **Social platform icon set** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_github_icon, public_icons_x_icon [INFERRED 0.95]
- **CPSU Seal Composition** — src_assets_cpsu_logo_transparent_torch_book_and_carabao, src_assets_cpsu_logo_transparent_philippines_map, src_assets_cpsu_logo_transparent_sunrise_and_mountains, src_assets_cpsu_logo_transparent_green_yellow_palette [EXTRACTED 1.00]

## Communities (63 total, 2 thin omitted)

### Community 0 - "RepositoryResults.tsx"
Cohesion: 0.11
Nodes (18): PublicResource, ResourceSort, groupResourcesByCategory(), ResourceCategoryGroup, StructureSection, PublicResourcePreviewDialog(), PublicResourcePreviewDialogProps, RepositoryResults() (+10 more)

### Community 1 - "repositoryStructureStore.ts"
Cohesion: 0.18
Nodes (17): createR2Client(), bodyText(), createRepositoryStructureWriteCommand(), defaults, mutateRepositoryStructure(), prefixHasFiles(), readRepositoryStructureSnapshot(), RepositoryStructureSnapshot (+9 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (42): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+34 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (37): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, firebase, firebase-admin, @fontsource/poppins, @hookform/resolvers (+29 more)

### Community 5 - "compilerOptions"
Cohesion: 0.08
Nodes (24): api/**/*.ts, node, server/**/*.ts, src/config/repository.ts, src/contracts/**/*.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions (+16 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 7 - "Graphify"
Cohesion: 0.14
Nodes (14): URL Ingestion and Folder Watch, Graph Export Formats and MCP Server, Extracted Inferred Ambiguous Confidence Rubric, Semantic Extraction Contract, GitHub Clone and Cross-Repository Merge, Post-Commit Hook and CLAUDE.md Integration, Constrained Query Expansion, Graph Query Path and Explain Traversal (+6 more)

### Community 8 - "Cloudflare R2 File Repository"
Cohesion: 0.19
Nodes (13): Architecture-First Brick-by-Brick Development, Cloudflare R2 File Repository, CPSU PDO Information Hub Architecture Contract, Firebase Administrator Authentication, Protected Administrator Authorization Flow, React Application, Least Privilege and Server-Side Authorization, Vercel Server APIs (+5 more)

### Community 10 - "AdminResourceInventory.tsx"
Cohesion: 0.14
Nodes (19): AdminResourceAccessMode, AdminResource, AdminResourceActions(), AdminResourceActionsProps, AdminResourceDeleteDialog(), AdminResourcePreviewDialog(), AdminResourceRenameDialog(), DeleteTarget (+11 more)

### Community 11 - "authenticateAdminRequest"
Cohesion: 0.05
Nodes (47): fetch(), fetch(), fetch(), AdminAuthenticationDependencies, AdminAuthenticationError, AdminAuthorizationError, AdministratorIdentity, authenticateAdminRequest() (+39 more)

### Community 12 - "AppRouter.tsx"
Cohesion: 0.19
Nodes (9): maximumCategoryCount, RepositoryStructureChart(), AboutPage(), officeFunctions, contactDetails, ContactPage(), NotFoundPage(), RepositoryPage() (+1 more)

### Community 13 - "SVG icon symbol sprite"
Cohesion: 0.39
Nodes (8): Bluesky icon, Discord icon, Documentation and code icon, GitHub icon, Social profile icon, Social platform links, SVG icon symbol sprite, X social network icon

### Community 14 - "Central Philippines State University Seal"
Cohesion: 0.25
Nodes (8): Foundation Year 1946, Green and Yellow Institutional Palette, Negros Occidental, Central Philippines State University Seal, Map of the Philippines, Sun Rays and Mountain Landscape, Torch, Open Book, and Carabao Emblem, Central Philippines State University

### Community 15 - "Application favicon"
Cohesion: 0.33
Nodes (7): Lightning-shaped alpha mask, Blue highlight accents, Blurred multicolor glow, Application favicon, Stylized lightning-bolt emblem, Purple color palette, Vite visual identity

### Community 16 - "OpcrPublicPage.tsx"
Cohesion: 0.16
Nodes (19): OpcrResourceData, AccomplishmentDataChart(), getComparisonStatus(), createOpcrAnnualIndicatorChartData(), createOpcrAnnualIndicatorSeriesChartData(), createOpcrComparisonChartData(), OpcrEntry, OpcrPeriodValues (+11 more)

### Community 17 - "parseResourceObjectKey.ts"
Cohesion: 0.24
Nodes (9): createFallbackDisplayName(), invalidKey(), InvalidResourceObjectKeyError, ParsedResourceObjectKey, parseResourceObjectKey(), StructureSection, resourceFileDefinitions, ResourceFileExtension (+1 more)

### Community 18 - "AdminOpcrPage.tsx"
Cohesion: 0.07
Nodes (35): dataRowEntrySchema, indicatorEntrySchema, nodeIdSchema, opcrResourceResponseSchema, periodEntrySchema, treeNodeSchema, valueSchema, reportAppearanceSchema (+27 more)

### Community 19 - "Metadata Derived from R2 Object Keys"
Cohesion: 0.67
Nodes (3): No Traditional Database, Metadata Derived from R2 Object Keys, R2 Object Key Convention

### Community 20 - "Content Is the Design"
Cohesion: 0.67
Nodes (3): PDO Repository Taxonomy, Archive Tabs Report Rules and Green Reference Line, Content Is the Design

### Community 21 - "The Institutional Archive"
Cohesion: 0.67
Nodes (3): Accessible Long-Term Institutional Interface, CPSU Institutional Visual Identity, The Institutional Archive

### Community 24 - "accomplishmentResourceStore.ts"
Cohesion: 0.23
Nodes (12): fetch(), Dependencies, handleAccomplishmentResourceRequest(), headers, json(), createAccomplishmentResourceWriteCommand(), defaults, readAccomplishmentResource() (+4 more)

### Community 25 - "adminOperationsApiPlugin.ts"
Cohesion: 0.19
Nodes (14): adminOperationsApiPlugin(), adminResourcesApiPlugin(), adminSessionApiPlugin(), createDevRequest(), requestBody(), requestHeaders(), writeDevResponse(), resourcesApiPlugin() (+6 more)

### Community 26 - "AdminAccomplishResourcePage.tsx"
Cohesion: 0.05
Nodes (47): fetch(), Dependencies, handlePublicAccomplishmentResourceRequest(), json(), publicHeaders, data, AccomplishmentResourceData, accomplishmentResourceResponseSchema (+39 more)

### Community 27 - "contracts/resource.ts"
Cohesion: 0.15
Nodes (14): RepositoryCategory, repositoryCategoryById, repositoryCategoryIds, RepositorySection, repositorySectionById, ApiErrorResponse, RepositorySectionId, repositorySectionIds (+6 more)

### Community 28 - "getR2Config"
Cohesion: 0.18
Nodes (16): getR2Config(), handleOpcrResourceRequest(), headers, json(), createOpcrResourceWriteCommand(), defaults, readBody(), readOpcrResource() (+8 more)

### Community 29 - "design-qa.md"
Cohesion: 0.14
Nodes (13): Annual Summary Copy and Alignment QA - 2026-09-15, Contact Strip QA — 2026-09-14, Contact Website-Style Revision — 2026-09-14, Design QA, Fidelity ledger, Fidelity surfaces, Findings and comparison history, Findings and correction history (+5 more)

### Community 30 - "contracts/resourceUpload.ts"
Cohesion: 0.22
Nodes (10): repositorySectionIdSchema, resourceYearSchema, ResourceUploadAuthorization, resourceUploadAuthorizationSchema, resourceUploadCompletionRequestSchema, resourceUploadCompletionResponseSchema, resourceUploadMimeTypeSchema, ResourceUploadRequest (+2 more)

### Community 31 - "listResources.ts"
Cohesion: 0.06
Nodes (47): fetch(), fetch(), AdminResourcesDependencies, handleAdminResourcesRequest(), privateJsonHeaders, testConfig, verifiedAdministrator, unauthorizedResponse() (+39 more)

### Community 32 - "useRepositoryStructureQuery"
Cohesion: 0.25
Nodes (9): AppDialog(), AppDialogProps, useRepositoryStructureQuery(), AdminRepositoryStructurePage(), DeleteState, EditorState, HomePage(), getRepositoryStructure() (+1 more)

### Community 33 - "useAuth.ts"
Cohesion: 0.21
Nodes (9): AuthenticationStatus, AuthProvider(), initializeAuthentication(), AuthContext, AuthContextValue, AuthenticationStatus, firebaseClientEnvironmentSchema, FirebaseConfigurationError (+1 more)

### Community 34 - "contracts/adminResourceAccess.ts"
Cohesion: 0.33
Nodes (5): adminResourceAccessModeSchema, adminResourceAccessRequestSchema, AdminResourceAccessResponse, adminResourceAccessResponseSchema, resourceObjectKeySchema

### Community 35 - "r2.ts"
Cohesion: 0.09
Nodes (27): optionalServerUrlSchema, R2Config, R2ConfigurationError, r2EnvironmentSchema, serverUrlSchema, validEnvironment, administrator, config (+19 more)

### Community 36 - "AccomplishmentChart.tsx"
Cohesion: 0.24
Nodes (15): BarChart(), ChartColorLegend(), chartDescription(), ChartInteraction, ChartType, chartValueLabel(), ColumnChart(), LineChart() (+7 more)

### Community 37 - "repositoryStructureHandler.ts"
Cohesion: 0.26
Nodes (9): fetch(), fetch(), handleAdminRepositoryStructureRequest(), handleRepositoryStructureRequest(), headers, json(), StructureHandlerDependencies, readRepositoryStructure() (+1 more)

### Community 38 - "useAdminResourcesQuery.ts"
Cohesion: 0.31
Nodes (7): ResourceFileType, useAdminResourcesQuery(), AdminHomePage(), formatSize(), getAdminResources(), formatResourceFileType(), resourceFileTypeLabels

### Community 39 - "AccomplishmentsPage.tsx"
Cohesion: 0.10
Nodes (30): AccomplishmentComparisonChart(), AccomplishmentIndicatorSeriesChart(), annualComparisonFields, AnnualIndicatorYearData, AnnualPerformanceEntry, AnnualPerformanceIndicator, ComparisonField, ComparisonStatus (+22 more)

### Community 40 - "Q: Analyze the whole codebase and change the whole UI to a soft aesthetic with Poppins and color-preserving modals."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze the whole codebase and change the whole UI to a soft aesthetic with Poppins and color-preserving modals., Source Nodes

### Community 41 - "Q: Change the header by moving the contents of the menu dropdown to the header, with no hamburger menu unless it is mobile view."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Change the header by moving the contents of the menu dropdown to the header, with no hamburger menu unless it is mobile view., Source Nodes

### Community 42 - "Q: Remove Excel files from upload so only images and PDF files can be uploaded."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Remove Excel files from upload so only images and PDF files can be uploaded., Source Nodes

### Community 43 - "Q: remove the excess excel visualizations in the whole codebase please analyze it"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: remove the excess excel visualizations in the whole codebase please analyze it, Source Nodes

### Community 44 - "Q: please Identify the possible fix in this error since I am possitive my internet connection is fine though"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: please Identify the possible fix in this error since I am possitive my internet connection is fine though, Source Nodes

### Community 45 - "Q: this project not been deployed to vercel yet please let us fix the problem guide me"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: this project not been deployed to vercel yet please let us fix the problem guide me, Source Nodes

### Community 46 - "Q: I am lost in the 2 buckets please give me full guide in those 2 buckets which is cpsu-pdo-information-hub and cpsu-pdo-audit"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I am lost in the 2 buckets please give me full guide in those 2 buckets which is cpsu-pdo-information-hub and cpsu-pdo-audit, Source Nodes

### Community 47 - "Q: I have problem in this the name section files just make it under statistical profile or whatever and make sure to hierarchy in the categories please the no category first and so on whatever the arrangement of the categories please make it like that"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have problem in this the name section files just make it under statistical profile or whatever and make sure to hierarchy in the categories please the no category first and so on whatever the arrangement of the categories please make it like that, Source Nodes

### Community 48 - "Q: look at the choose file button it's not consistent to others"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: look at the choose file button it's not consistent to others, Source Nodes

### Community 49 - "Q: check the whole codebase if everything is working, if there's a problem please list it and what is the possible fix in this system"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: check the whole codebase if everything is working, if there's a problem please list it and what is the possible fix in this system, Source Nodes

### Community 50 - "Q: in the admin/resources please fix this names it should be one line."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: in the admin/resources please fix this names it should be one line., Source Nodes

### Community 51 - "Q: analyze the whole codebase of this app please."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: analyze the whole codebase of this app please., Source Nodes

### Community 54 - "adminResourceMutationHandler.ts"
Cohesion: 0.32
Nodes (9): addDestinationMustNotExist(), authenticationFailure(), handleAdminResourceMutationRequest(), headers, json(), ResourceMutationDependencies, getR2ErrorStatus(), isR2NotFound() (+1 more)

### Community 56 - "accomplishments/reportAppearance.ts"
Cohesion: 0.14
Nodes (19): barColorKeySchema, barColorValueSchema, chartColorSchema, legendIdSchema, ReportAppearance, reportLegendCategories, ReportLegendCategory, ReportLegendItem (+11 more)

### Community 57 - "adminResourceAccessHandler.ts"
Cohesion: 0.24
Nodes (9): AdminResourceAccessDependencies, authenticationFailure(), createContentDisposition(), handleAdminResourceAccessRequest(), headers, json(), StructureSection, administrator (+1 more)

### Community 58 - "services/adminSession.ts"
Cohesion: 0.28
Nodes (7): AdminSession, adminSessionSchema, ProtectedAdminRoute(), useAdminSessionQuery(), AdminSessionRequestError, fetchAdminSession(), user

### Community 59 - "ResourceUploadForm.tsx"
Cohesion: 0.18
Nodes (11): schoolYearSchema, maximumResourceFileSize, resourceUploadFileExtensions, resourceUploadMimeTypes, currentDate, FormInput, formSchema, FormValues (+3 more)

### Community 60 - "services/adminOperations.ts"
Cohesion: 0.42
Nodes (9): useAdministratorsQuery(), AdminUsersPage(), createAdministrator(), deleteAdministrator(), deleteResource(), getAdministrators(), renameResource(), request() (+1 more)

### Community 61 - "PublicHeader.tsx"
Cohesion: 0.24
Nodes (5): PublicFooter(), PublicHeader(), NavigationItem, publicNavigation, PublicLayout()

### Community 62 - "AdminLoginPage.tsx"
Cohesion: 0.33
Nodes (7): authenticationMessages, getAuthenticationErrorMessage(), hasErrorCode(), loginSchema, LoginValues, AdminLoginPage(), getSafeDestination()

### Community 63 - "AdminRoutes.tsx"
Cohesion: 0.36
Nodes (5): useAuth(), AdminLayout(), AdminAccomplishResourcePage(), AdminOpcrPage(), AdminResourceUploadPage()

### Community 64 - "App.tsx"
Cohesion: 0.47
Nodes (3): App(), AppProviders(), AppRouter()

### Community 66 - "readJsonResponse"
Cohesion: 0.15
Nodes (17): publicResourceIdSchema, publicResourcePreviewRequestSchema, PublicResourcePreviewResponse, publicResourcePreviewResponseSchema, AdminResourceListResponse, adminResourceListResponseSchema, apiErrorResponseSchema, publicResourceListResponseSchema (+9 more)

## Knowledge Gaps
- **365 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+360 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Resource` (6× useful, score=3.696272977)
- `Protected Administrator Authorization Flow` (5× useful, score=3.080636341)
- `Cloudflare R2 File Repository` (3× useful, score=1.846516906)
- `repository.ts` (2× useful, score=1.232801005)
- `Vercel Server APIs` (2× useful, score=1.232441186)
- `R2Config` (2× useful, score=1.231077544)
- `PublicHeader()` (2× useful, score=1.230153108)
- `PublicLayout()` (2× useful, score=1.230153108) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `AdminRoutes.tsx` to `useRepositoryStructureQuery`, `useAuth.ts`, `AdminAccomplishResourcePage.tsx`, `useAdminResourcesQuery.ts`, `AdminResourceInventory.tsx`, `AdminOpcrPage.tsx`, `services/adminSession.ts`, `ResourceUploadForm.tsx`, `services/adminOperations.ts`, `AdminLoginPage.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `authenticateAdminRequest()` connect `authenticateAdminRequest` to `repositoryStructureHandler.ts`, `adminResourceMutationHandler.ts`, `accomplishmentResourceStore.ts`, `adminResourceAccessHandler.ts`, `getR2Config`, `listResources.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `getR2Config()` connect `getR2Config` to `repositoryStructureStore.ts`, `r2.ts`, `adminResourceMutationHandler.ts`, `accomplishmentResourceStore.ts`, `adminResourceAccessHandler.ts`, `listResources.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _365 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RepositoryResults.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._