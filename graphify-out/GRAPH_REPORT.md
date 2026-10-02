# Graph Report - cpsu-pdo-information-hub  (2026-10-02)

## Corpus Check
- 263 files · ~889,980 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1372 nodes · 2882 edges · 91 communities (90 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e91a7d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ResourceCategoryPanel.tsx
- repositoryStructureStore.ts
- devDependencies
- fetchAuthenticatedJson
- dependencies
- compilerOptions
- compilerOptions
- Graphify
- Cloudflare R2 File Repository
- resource.ts
- AdminResourceInventory.tsx
- adminUsersHandler.ts
- handler.js
- SVG icon symbol sprite
- Central Philippines State University Seal
- Application favicon
- ReportIndicatorDataTable.tsx
- contracts/adminOperations.ts
- AdminOpcrPage.tsx
- Metadata Derived from R2 Object Keys
- Content Is the Design
- The Institutional Archive
- compilerOptions
- apiEntry.ts
- adminReportResourceHandler.ts
- apiRateLimit.ts
- uploadCompleteHandler.ts
- adminResourceEdit.test.ts
- design-qa.md
- vite.config.ts
- listResources.ts
- adminResourceMutationHandler.ts
- AdminRoutes.tsx
- RepositoryToolbar.tsx
- contracts/resourceUpload.ts
- publicResourceLinkHandler.ts
- resourcesHandler.ts
- r2.ts
- chartData.ts
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
- AuthContext.tsx
- AdminLoginPage.tsx
- accomplishments/reportAppearance.ts
- adminResourceAccessHandler.ts
- useGestureZoom.ts
- AccomplishmentChart.tsx
- contracts/accomplishmentResource.ts
- AppRouter.tsx
- services/adminOperations.ts
- contracts/adminResourceAccess.ts
- publicResourcePreviewHandler.ts
- verifyFirebaseIdToken.ts
- useAdminResourcesQuery.ts
- accomplishments/reportCalculations.ts
- useRepositoryStructureQuery
- adminResourcesHandler.ts
- Deployment Guide
- OpcrPublicPage.tsx
- Codebase bug and security review - 2026-10-02
- Q: check the wholecode base I just deployed this in vercel but the cloudflare r2 and firebase auth won't work maybe we need to make some reviews.
- Q: guide me to fix the recommended Vercel repair order
- Q: Live /api/resources shows REPOSITORY_UNAVAILABLE after deployment
- Q: Change the browser tab Vite logo to the official CPSU logo
- Q: I have modifications in the image view section, it's not resizable. please optimized that.
- Q: in the raw data please accept special characters input please implement that
- Q: I have some adjustments in the data graph presentation, some data's inputted only raw data but the graph visualization is only prioritizing the percentage, make an instances that if it's only the raw data inputted the graph will also show but it indicates as raw data just indicate all the graphs shown what is it, whether it is accomplishment or raw graph, then if the data was inputted in percentage and raw the graph shown will be prioritizing the percentage not the raw, raw graph only shows when the inputted data is only in raw.
- Q: this annual summarization is only resizing not side scroller please fix that not just in the opcr but also in the accomplishment report. and also in the due to the effect of the special characters the data is not showing please fix that as well making sure it still showing the graph even with special characters.
- Q: fix the Forms section contents missing on Vercel
- Q: the forms contents still not showing; excel is the category name, not the file type
- Q: why pdf cannot preview in the mobile phone website; fix it
- Q: fix mobile PDF page rendering, rename Accomplishment Report to Physical Performance, and prevent administrators from deleting Forms
- Q: the pdf viewing problem is still there please fix it well.
- Q: in this section please change the sequence like into ascending order 2021, 2022, 2023...... not decending
- pdfjs-worker.d.ts
- Mobile layout review - 2 October 2026
- RepositoryResults.tsx

## God Nodes (most connected - your core abstractions)
1. `getR2Config()` - 25 edges
2. `useAuth()` - 25 edges
3. `createR2Client()` - 23 edges
4. `authenticateAdminRequest()` - 22 edges
5. `handleAdminResourceMutationRequest()` - 19 edges
6. `listResourceRecords()` - 18 edges
7. `R2Config` - 18 edges
8. `readLimitedJson()` - 18 edges
9. `listResourceRecords()` - 18 edges
10. `compilerOptions` - 18 edges

## Surprising Connections (you probably didn't know these)
- `R2 Object Key Convention` --semantically_similar_to--> `Metadata Derived from R2 Object Keys`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `handleAdminUsersRequest()` --indirect_call--> `mapUser()`  [INFERRED]
  api/handler.js → server/http/adminUsersHandler.ts
- `createAdminReportResourceHandler()` --indirect_call--> `request()`  [INFERRED]
  api/handler.js → src/services/adminOperations.ts
- `createAdminReportResourceHandler()` --indirect_call--> `request()`  [INFERRED]
  server/http/adminReportResourceHandler.ts → src/services/adminOperations.ts
- `listResourceRecords()` --calls--> `groupResourcesByYear()`  [EXTRACTED]
  server/repository/listResources.ts → src/utils/groupResourcesByYear.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Extraction Pipeline** — _codex_skills_graphify_skill_persistent_knowledge_graph, _codex_skills_graphify_skill_structural_and_semantic_extraction, _codex_skills_graphify_references_extraction_spec_confidence_rubric [EXTRACTED 1.00]
- **CPSU Repository Architecture** — agents_firebase_authentication, agents_cloudflare_r2_repository, agents_vercel_server_apis, agents_react_application [EXTRACTED 1.00]
- **CPSU Institutional Design Signature** — design_aesthetics_institutional_archive, design_aesthetics_cpsu_visual_identity, design_aesthetics_archive_motifs [EXTRACTED 1.00]
- **Favicon emblem composition** — public_favicon_favicon, public_favicon_lightning_bolt, public_favicon_purple_palette, public_favicon_blue_highlights, public_favicon_blurred_glow, public_favicon_alpha_mask [EXTRACTED 1.00]
- **Social platform icon set** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_github_icon, public_icons_x_icon [INFERRED 0.95]
- **CPSU Seal Composition** — src_assets_cpsu_logo_transparent_torch_book_and_carabao, src_assets_cpsu_logo_transparent_philippines_map, src_assets_cpsu_logo_transparent_sunrise_and_mountains, src_assets_cpsu_logo_transparent_green_yellow_palette [EXTRACTED 1.00]

## Communities (91 total, 1 thin omitted)

### Community 0 - "ResourceCategoryPanel.tsx"
Cohesion: 0.12
Nodes (15): PublicResource, groupResourcesByCategory(), ResourceCategoryGroup, StructureSection, LazyPdfPreview(), PdfPreview, PublicResourcePreviewDialog(), PublicResourcePreviewDialogProps (+7 more)

### Community 1 - "repositoryStructureStore.ts"
Cohesion: 0.09
Nodes (36): getR2Config(), data, handler, writeSnapshot, handleAdminRepositoryStructureRequest(), handleRepositoryStructureRequest(), headers, json() (+28 more)

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (45): esbuild, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, esbuild (+37 more)

### Community 3 - "fetchAuthenticatedJson"
Cohesion: 0.23
Nodes (11): user, parseApiError(), readJsonResponse(), fetchAuthenticatedJson(), authorizePublicResourcePreview(), ReportResourceClientOptions, ResponseSchema, getResources() (+3 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (39): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, class-variance-authority, clsx, firebase, firebase-admin, @fontsource/poppins, @hookform/resolvers (+31 more)

### Community 5 - "compilerOptions"
Cohesion: 0.08
Nodes (24): api/**/*.ts, server/**/*.ts, src/config/repository.ts, src/contracts/**/*.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly (+16 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 7 - "Graphify"
Cohesion: 0.14
Nodes (14): URL Ingestion and Folder Watch, Graph Export Formats and MCP Server, Extracted Inferred Ambiguous Confidence Rubric, Semantic Extraction Contract, GitHub Clone and Cross-Repository Merge, Post-Commit Hook and CLAUDE.md Integration, Constrained Query Expansion, Graph Query Path and Explain Traversal (+6 more)

### Community 8 - "Cloudflare R2 File Repository"
Cohesion: 0.19
Nodes (13): Architecture-First Brick-by-Brick Development, Cloudflare R2 File Repository, CPSU PDO Information Hub Architecture Contract, Firebase Administrator Authentication, Protected Administrator Authorization Flow, React Application, Least Privilege and Server-Side Authorization, Vercel Server APIs (+5 more)

### Community 9 - "resource.ts"
Cohesion: 0.10
Nodes (23): createFallbackDisplayName(), invalidKey(), InvalidResourceObjectKeyError, ParsedResourceObjectKey, StructureSection, protectedRepositorySectionIds, RepositoryCategory, repositoryCategoryById (+15 more)

### Community 10 - "AdminResourceInventory.tsx"
Cohesion: 0.24
Nodes (13): AdminResource, AdminResourceDeleteDialog(), AdminResourcePreviewDialog(), AdminResourceRenameDialog(), DeleteTarget, DialogStateProps, PreviewTarget, RenameTarget (+5 more)

### Community 11 - "adminUsersHandler.ts"
Cohesion: 0.12
Nodes (22): AdminAuthenticationDependencies, AdminAuthenticationError, AdminAuthorizationError, AdministratorIdentity, authenticateAdminRequest(), hasAdministratorAccess(), request, parseBearerToken() (+14 more)

### Community 12 - "handler.js"
Cohesion: 0.06
Nodes (83): addDestinationMustNotExist(), applyRequiredStructureMigrations(), assertRepositorySectionCanBeDeleted(), authenticateAdminRequest(), authenticationFailure(), authenticationFailure2(), authorizeResourceUpload(), bodyText() (+75 more)

### Community 13 - "SVG icon symbol sprite"
Cohesion: 0.39
Nodes (8): Bluesky icon, Discord icon, Documentation and code icon, GitHub icon, Social profile icon, Social platform links, SVG icon symbol sprite, X social network icon

### Community 14 - "Central Philippines State University Seal"
Cohesion: 0.25
Nodes (8): Foundation Year 1946, Green and Yellow Institutional Palette, Negros Occidental, Central Philippines State University Seal, Map of the Philippines, Sun Rays and Mountain Landscape, Torch, Open Book, and Carabao Emblem, Central Philippines State University

### Community 15 - "Application favicon"
Cohesion: 0.33
Nodes (7): Lightning-shaped alpha mask, Blue highlight accents, Blurred multicolor glow, Application favicon, Stylized lightning-bolt emblem, Purple color palette, Vite visual identity

### Community 16 - "ReportIndicatorDataTable.tsx"
Cohesion: 0.31
Nodes (7): formatPercentageValue(), displayValue(), ReportDataRow, ReportDataTableEntry, ReportIndicatorDataTable(), ReportValueGroup, rows

### Community 17 - "contracts/adminOperations.ts"
Cohesion: 0.09
Nodes (22): Administrator, administratorCreateSchema, administratorDeleteSchema, administratorListSchema, administratorSchema, administratorUpdateSchema, resourceDeleteSchema, resourceDisplayNameSchema (+14 more)

### Community 18 - "AdminOpcrPage.tsx"
Cohesion: 0.07
Nodes (39): AppDialog(), AppDialogProps, opcrResourceResponseSchema, FloatingSaveAction(), reportChildType(), ReportDataRowType, ReportEditorState, reportNodeName() (+31 more)

### Community 19 - "Metadata Derived from R2 Object Keys"
Cohesion: 0.67
Nodes (3): No Traditional Database, Metadata Derived from R2 Object Keys, R2 Object Key Convention

### Community 20 - "Content Is the Design"
Cohesion: 0.67
Nodes (3): PDO Repository Taxonomy, Archive Tabs Report Rules and Green Reference Line, Content Is the Design

### Community 21 - "The Institutional Archive"
Cohesion: 0.67
Nodes (3): Accessible Long-Term Institutional Interface, CPSU Institutional Visual Identity, The Institutional Archive

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, skipLibCheck (+7 more)

### Community 24 - "apiEntry.ts"
Cohesion: 0.13
Nodes (15): ApiHandler, routes, handleAccomplishmentResourceRequest, handleOpcrResourceRequest, handlePublicOpcrResourceRequest, createR2JsonResourceStore(), JsonResourceStoreOptions, RuntimeSchema (+7 more)

### Community 25 - "adminReportResourceHandler.ts"
Cohesion: 0.29
Nodes (9): AdminReportDependencies, AdminReportHandlerOptions, createAdminReportResourceHandler(), json(), privateHeaders, RuntimeSchema, InvalidJsonBodyError, readLimitedJson() (+1 more)

### Community 26 - "apiRateLimit.ts"
Cohesion: 0.24
Nodes (7): fetch(), notFound(), resolveApiPath(), checkApiRateLimit(), Counter, counters, requestLimit()

### Community 27 - "uploadCompleteHandler.ts"
Cohesion: 0.14
Nodes (17): handleUploadCompleteRequest(), headers, json(), body, config, identity, invalidatePublicResourceCache(), ResourceUploadVerificationError (+9 more)

### Community 28 - "adminResourceEdit.test.ts"
Cohesion: 0.12
Nodes (11): config, identity, source, structure, values, objects, testConfig, adminResourceSchema (+3 more)

### Community 29 - "design-qa.md"
Cohesion: 0.14
Nodes (13): Annual Summary Copy and Alignment QA - 2026-09-15, Contact Strip QA — 2026-09-14, Contact Website-Style Revision — 2026-09-14, Design QA, Fidelity ledger, Fidelity surfaces, Findings and comparison history, Findings and correction history (+5 more)

### Community 30 - "vite.config.ts"
Cohesion: 0.27
Nodes (10): adminOperationsApiPlugin(), adminResourcesApiPlugin(), adminSessionApiPlugin(), createDevRequest(), requestBody(), requestHeaders(), writeDevResponse(), resourcesApiPlugin() (+2 more)

### Community 31 - "listResources.ts"
Cohesion: 0.17
Nodes (20): compareByKey(), decodeCursor(), encodeCursor(), getAllObjectSummaries(), getCachedPublicObjectSummaries(), getListPrefix(), listResourceRecords(), listResources() (+12 more)

### Community 32 - "adminResourceMutationHandler.ts"
Cohesion: 0.21
Nodes (15): addDestinationMustNotExist(), authenticationFailure(), handleAdminResourceMutationRequest(), headers, json(), ResourceMutationDependencies, getR2ErrorStatus(), isR2NotFound() (+7 more)

### Community 33 - "AdminRoutes.tsx"
Cohesion: 0.16
Nodes (13): AdminSession, adminSessionSchema, ResourceUploadForm(), ProtectedAdminRoute(), useAdminSessionQuery(), useAuth(), AdminLayout(), AdminAccomplishResourcePage() (+5 more)

### Community 34 - "RepositoryToolbar.tsx"
Cohesion: 0.39
Nodes (6): ResourceFileType, ResourceSort, emptyFilters, RepositoryToolbarProps, resourceFileTypeOptions, resourceSortOptions

### Community 35 - "contracts/resourceUpload.ts"
Cohesion: 0.12
Nodes (18): schoolYearSchema, maximumResourceFileSize, ResourceUploadAuthorization, resourceUploadAuthorizationSchema, resourceUploadCompletionRequestSchema, resourceUploadCompletionResponseSchema, resourceUploadFileExtensions, resourceUploadMimeTypes (+10 more)

### Community 36 - "publicResourceLinkHandler.ts"
Cohesion: 0.15
Nodes (12): handlePublicResourceLinkRequest(), json(), PublicResourceLinkDependencies, responseHeaders, config, linkResource, ListResourcesDependencies, publicResourceIdSchema (+4 more)

### Community 37 - "resourcesHandler.ts"
Cohesion: 0.20
Nodes (9): handleResourcesRequest(), jsonHeaders, jsonResponse(), emptyRepository, testR2Config, InvalidResourceCursorError, AdminResourceListResponse, PublicResourceListResponse (+1 more)

### Community 38 - "r2.ts"
Cohesion: 0.09
Nodes (23): optionalServerUrlSchema, R2Config, R2ConfigurationError, r2EnvironmentSchema, serverUrlSchema, validEnvironment, administrator, config (+15 more)

### Community 39 - "chartData.ts"
Cohesion: 0.11
Nodes (31): AccomplishmentComparisonChart(), ChartColorLegend(), annualComparisonFields, AnnualIndicatorYearData, AnnualPerformanceEntry, AnnualPerformanceIndicator, ChartDataRow, ChartEntry (+23 more)

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

### Community 52 - "vercel.json"
Cohesion: 0.50
Nodes (3): headers, rewrites, $schema

### Community 54 - "AuthContext.tsx"
Cohesion: 0.22
Nodes (9): AuthenticationStatus, AuthProvider(), initializeAuthentication(), AuthContext, AuthContextValue, AuthenticationStatus, firebaseClientEnvironmentSchema, FirebaseConfigurationError (+1 more)

### Community 55 - "AdminLoginPage.tsx"
Cohesion: 0.33
Nodes (7): authenticationMessages, getAuthenticationErrorMessage(), hasErrorCode(), loginSchema, LoginValues, AdminLoginPage(), getSafeDestination()

### Community 56 - "accomplishments/reportAppearance.ts"
Cohesion: 0.14
Nodes (20): barColorKeySchema, barColorValueSchema, chartColorSchema, legendIdSchema, ReportAppearance, reportLegendCategories, ReportLegendCategory, ReportLegendItem (+12 more)

### Community 57 - "adminResourceAccessHandler.ts"
Cohesion: 0.39
Nodes (8): AdminResourceAccessDependencies, authenticationFailure(), createContentDisposition(), handleAdminResourceAccessRequest(), headers, json(), StructureSection, parseResourceObjectKey()

### Community 58 - "useGestureZoom.ts"
Cohesion: 0.10
Nodes (21): GestureZoomRenderState, GestureZoomViewport(), calculateAnchoredScroll(), calculatePinchZoom(), calculateWheelZoom(), clampPreviewZoom(), distanceBetween(), GestureZoomOptions (+13 more)

### Community 59 - "AccomplishmentChart.tsx"
Cohesion: 0.20
Nodes (17): BarChart(), chartDescription(), ChartInteraction, ChartSourceBadge(), ChartType, chartValueLabel(), ColumnChart(), LineChart() (+9 more)

### Community 60 - "contracts/accomplishmentResource.ts"
Cohesion: 0.05
Nodes (43): handlePublicAccomplishmentResourceRequest, data, createPublicReportResourceHandler(), json(), publicHeaders, PublicReportData, PublicReportDependencies, PublicReportHandlerOptions (+35 more)

### Community 61 - "AppRouter.tsx"
Cohesion: 0.08
Nodes (25): App(), AppProviders(), PublicFooter(), PublicHeader(), NavigationItem, publicNavigation, officeEmail, officeEmailHref (+17 more)

### Community 62 - "services/adminOperations.ts"
Cohesion: 0.39
Nodes (10): AdminResourceInventory(), AdminUsersPage(), createAdministrator(), createResourceLink(), deleteAdministrator(), deleteResource(), editResource(), renameResource() (+2 more)

### Community 63 - "contracts/adminResourceAccess.ts"
Cohesion: 0.19
Nodes (10): AdminResourceAccessMode, adminResourceAccessModeSchema, adminResourceAccessRequestSchema, AdminResourceAccessResponse, adminResourceAccessResponseSchema, apiErrorResponseSchema, resourceObjectKeySchema, AdminResourceActions() (+2 more)

### Community 64 - "publicResourcePreviewHandler.ts"
Cohesion: 0.18
Nodes (11): handlePublicResourcePreviewRequest(), headers, inlineContentDisposition(), json(), PreviewResource, PublicResourcePreviewDependencies, config, pdfResource (+3 more)

### Community 65 - "verifyFirebaseIdToken.ts"
Cohesion: 0.33
Nodes (6): getFirebaseAdminApp(), verifyFirebaseIdToken(), FirebaseAdminConfig, FirebaseAdminConfigurationError, firebaseAdminEnvironmentSchema, getFirebaseAdminConfig()

### Community 66 - "useAdminResourcesQuery.ts"
Cohesion: 0.28
Nodes (8): useAdministratorsQuery(), useAdminResourcesQuery(), AdminHomePage(), formatSize(), getAdministrators(), getAdminResources(), formatResourceFileType(), resourceFileTypeLabels

### Community 67 - "accomplishments/reportCalculations.ts"
Cohesion: 0.22
Nodes (14): calculatePeriodTotal(), getAccomplishmentReportYears(), isQuarterInputValid(), quarterFields, QuarterlyValues, calculateHalfYearTotal(), halfYearFields, HalfYearValues (+6 more)

### Community 68 - "useRepositoryStructureQuery"
Cohesion: 0.29
Nodes (8): RepositoryToolbar(), useRepositoryStructureQuery(), AdminRepositoryStructurePage(), DeleteState, EditorState, HomePage(), getRepositoryStructure(), mutateRepositoryStructure()

### Community 69 - "adminResourcesHandler.ts"
Cohesion: 0.27
Nodes (8): AdminResourcesDependencies, handleAdminResourcesRequest(), privateJsonHeaders, testConfig, verifiedAdministrator, unauthorizedResponse(), listAdminResources(), adminResourceListResponseSchema

### Community 70 - "Deployment Guide"
Cohesion: 0.17
Nodes (11): Billing and abuse controls (required before opening the site publicly), Deployment Guide, Phase 0 — Pre-flight, Phase 1 — Commit and push, Phase 2 — Cloudflare R2, Phase 3 — Firebase, Phase 4 — Vercel, Phase 5 — Connect the domains (+3 more)

### Community 71 - "OpcrPublicPage.tsx"
Cohesion: 0.13
Nodes (20): OpcrResourceData, AccomplishmentDataChart(), AccomplishmentIndicatorSeriesChart(), ChartDataSource, ReportOverviewGroup, createOpcrAnnualIndicatorChartData(), createOpcrAnnualIndicatorSeriesChartData(), createOpcrComparisonChartData() (+12 more)

### Community 74 - "Codebase bug and security review - 2026-10-02"
Cohesion: 0.40
Nodes (4): Codebase bug and security review - 2026-10-02, Findings fixed, Scope and practical limits, Validation

### Community 76 - "Q: check the wholecode base I just deployed this in vercel but the cloudflare r2 and firebase auth won't work maybe we need to make some reviews."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: check the wholecode base I just deployed this in vercel but the cloudflare r2 and firebase auth won't work maybe we need to make some reviews., Source Nodes

### Community 77 - "Q: guide me to fix the recommended Vercel repair order"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: guide me to fix the recommended Vercel repair order, Source Nodes

### Community 78 - "Q: Live /api/resources shows REPOSITORY_UNAVAILABLE after deployment"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Live /api/resources shows REPOSITORY_UNAVAILABLE after deployment, Source Nodes

### Community 79 - "Q: Change the browser tab Vite logo to the official CPSU logo"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Change the browser tab Vite logo to the official CPSU logo, Source Nodes

### Community 80 - "Q: I have modifications in the image view section, it's not resizable. please optimized that."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have modifications in the image view section, it's not resizable. please optimized that., Source Nodes

### Community 81 - "Q: in the raw data please accept special characters input please implement that"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: in the raw data please accept special characters input please implement that, Source Nodes

### Community 82 - "Q: I have some adjustments in the data graph presentation, some data's inputted only raw data but the graph visualization is only prioritizing the percentage, make an instances that if it's only the raw data inputted the graph will also show but it indicates as raw data just indicate all the graphs shown what is it, whether it is accomplishment or raw graph, then if the data was inputted in percentage and raw the graph shown will be prioritizing the percentage not the raw, raw graph only shows when the inputted data is only in raw."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have some adjustments in the data graph presentation, some data's inputted only raw data but the graph visualization is only prioritizing the percentage, make an instances that if it's only the raw data inputted the graph will also show but it indicates as raw data just indicate all the graphs shown what is it, whether it is accomplishment or raw graph, then if the data was inputted in percentage and raw the graph shown will be prioritizing the percentage not the raw, raw graph only shows when the inputted data is only in raw., Source Nodes

### Community 83 - "Q: this annual summarization is only resizing not side scroller please fix that not just in the opcr but also in the accomplishment report. and also in the due to the effect of the special characters the data is not showing please fix that as well making sure it still showing the graph even with special characters."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: this annual summarization is only resizing not side scroller please fix that not just in the opcr but also in the accomplishment report. and also in the due to the effect of the special characters the data is not showing please fix that as well making sure it still showing the graph even with special characters., Source Nodes

### Community 84 - "Q: fix the Forms section contents missing on Vercel"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: fix the Forms section contents missing on Vercel, Source Nodes

### Community 85 - "Q: the forms contents still not showing; excel is the category name, not the file type"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: the forms contents still not showing; excel is the category name, not the file type, Source Nodes

### Community 86 - "Q: why pdf cannot preview in the mobile phone website; fix it"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: why pdf cannot preview in the mobile phone website; fix it, Source Nodes

### Community 87 - "Q: fix mobile PDF page rendering, rename Accomplishment Report to Physical Performance, and prevent administrators from deleting Forms"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: fix mobile PDF page rendering, rename Accomplishment Report to Physical Performance, and prevent administrators from deleting Forms, Source Nodes

### Community 88 - "Q: the pdf viewing problem is still there please fix it well."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: the pdf viewing problem is still there please fix it well., Source Nodes

### Community 89 - "Q: in this section please change the sequence like into ascending order 2021, 2022, 2023...... not decending"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: in this section please change the sequence like into ascending order 2021, 2022, 2023...... not decending, Source Nodes

### Community 93 - "Mobile layout review - 2 October 2026"
Cohesion: 0.50
Nodes (3): Findings fixed, Mobile layout review - 2 October 2026, Verification

### Community 94 - "RepositoryResults.tsx"
Cohesion: 0.23
Nodes (9): ResourceQuery, RepositoryResults(), RepositoryFilters, resourceQueryKeys, useResourcesQuery(), RepositoryPage(), getAllResources(), page() (+1 more)

## Knowledge Gaps
- **473 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+468 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Cloudflare R2 File Repository` (6× useful, score=4.234649175)
- `Protected Administrator Authorization Flow` (6× useful, score=3.22016758)
- `Vercel Server APIs` (5× useful, score=3.955059181)
- `R2Config` (5× useful, score=3.95398311)
- `navigation.ts` (3× useful, score=2.483131383)
- `AppDialog()` (2× useful, score=1.994088423) _(code changed — re-verify)_
- `AccomplishmentsPage.tsx` (2× useful, score=1.99363674) _(code changed — re-verify)_
- `OpcrPublicPage.tsx` (2× useful, score=1.99363674) _(code changed — re-verify)_
- `vercel.json` (2× useful, score=1.988131651)
- `listResources()` (2× useful, score=1.479932278) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `request()` connect `services/adminOperations.ts` to `adminReportResourceHandler.ts`, `useAdminResourcesQuery.ts`, `fetchAuthenticatedJson`, `handler.js`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `createAdminReportResourceHandler()` connect `handler.js` to `services/adminOperations.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `mapUser()` connect `adminUsersHandler.ts` to `handler.js`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _473 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ResourceCategoryPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11692307692307692 - nodes in this community are weakly interconnected._
- **Should `repositoryStructureStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08985200845665962 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._