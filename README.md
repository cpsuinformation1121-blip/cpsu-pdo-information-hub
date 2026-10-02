# CPSU Planning and Development Office Information Hub

Web-based institutional information and document repository for the Central Philippines State University Planning and Development Office.

## Technology

- React, Vite, and TypeScript
- Tailwind CSS
- React Router and TanStack Query
- Zod validation
- Vercel server APIs
- Firebase Authentication for administrators
- Cloudflare R2 for repository files

Version 1 does not use a traditional database. Repository metadata is derived from R2 object keys, object properties, and stable application category configuration.

## Development

```bash
npm install
npm run dev
```

Available validation commands:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Cloudflare R2 configuration

Copy `.env.example` to `.env.local` and populate the server-only values:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_AUDIT_BUCKET_NAME=
R2_ENDPOINT=
```

Create an R2 API token with **Object Read & Write** permission and scope it only to the repository bucket and a separate private audit bucket. Both buckets are private: disable the repository bucket's `r2.dev` URL, remove any public custom domain, and do the same for the audit bucket. `R2_AUDIT_BUCKET_NAME` must refer to the separate audit bucket. The default S3-compatible endpoint is:

```text
https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

`R2_ENDPOINT` is optional and should be used for jurisdiction-specific endpoints when required. Production R2 API endpoints must use HTTPS. Plain HTTP is accepted only for a local development endpoint. There is deliberately no public repository URL environment variable.

These values are server-only. Never rename them with a `VITE_` prefix, commit `.env` files, or expose the R2 secret key to browser code.

## Repository object keys

Objects must follow this convention:

```text
section/category/[optional-subcategory/...]/year/filename.ext
```

Examples:

```text
statistical-profile/student-population/2026/student-population-2026.xlsx
higher-education-performance/accreditation/undergraduate/2026/accreditation-report-2026.pdf
```

Supported extensions are `.pdf`, `.xlsx`, `.jpg`, `.jpeg`, `.png`, and `.webp`.

## Architecture boundary

```text
Public client -> GET /api/resources -> metadata-only response
Admin client  -> authenticated Vercel API -> private Cloudflare R2 originals
```

The public resource API returns catalog metadata without R2 object keys, durable file URLs, or credentials. A separate public preview endpoint resolves an opaque resource ID server-side and issues a 60-second inline URL for supported PDFs and images. The public interface does not provide downloads. Authenticated administrator APIs verify the Firebase ID token before listing storage keys or issuing download access to an original file.

## Firebase administrator authentication

Create a Firebase web app, enable **Email/Password** under Authentication providers, and add an authorized Planning and Development Office user in the Firebase Console. Add the web app's public client configuration to `.env.local`:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Restart the development server after changing environment variables, then open `/admin/login`. Administrator accounts are provisioned in Firebase Console; the public application does not provide registration.

Client-side route protection improves the interface but is not the authorization boundary for repository mutations. Every protected server API must independently verify the Firebase ID token before accessing Cloudflare R2.

## Firebase Admin token verification

The protected `GET /api/admin/session` endpoint verifies Firebase ID tokens with the server-only Firebase Admin SDK. In Firebase Console, open **Project settings → Service accounts**, generate a new private key, and copy only the required JSON values into `.env.local`:

```text
FIREBASE_ADMIN_PROJECT_ID=<service-account project_id>
FIREBASE_ADMIN_CLIENT_EMAIL=<service-account client_email>
FIREBASE_ADMIN_PRIVATE_KEY=<service-account private_key with line breaks encoded as \n>
FIREBASE_BOOTSTRAP_ADMIN_UID=<initial administrator Firebase UID>
```

Never commit the downloaded service-account JSON file, place it under `src/` or `public/`, or prefix these variables with `VITE_`. Restart the local development server after configuring them. For Vercel, add the same three values as encrypted project environment variables.

The browser sends the current user's Firebase ID token in the standard `Authorization: Bearer <token>` header. The protected API verifies its signature, expiration, project audience, revocation status, and administrator permission before returning the administrator identity.

For the first administrator, open **Firebase Console → Authentication → Users**, select the existing staff account, and copy its **User UID** into `FIREBASE_BOOTSTRAP_ADMIN_UID`. This value is server-only and must also be added to the Vercel environment. The administrator then signs in normally with email and password—there is no separate claim command or browser-side authorization process.

The configured UID is the secure bootstrap account. Additional accounts created from the protected **Staff access** page receive administrator permission automatically. Never use an email address or a client-side flag as the authorization boundary.

## Administrator resource inventory

Authenticated administrators can open `/admin/resources` to review the live repository inventory. The page requests `GET /api/admin/resources` with the current Firebase ID token. The server verifies the token before reading Cloudflare R2, then applies the same validated search, section, file-type, sorting, and pagination contract used by the public repository.

The inventory includes each private R2 object key only after administrator authentication. Opening or downloading an original uses the protected `POST /api/admin/resource-access` endpoint. The server validates the requested key and returns a signed GET URL that expires after 60 seconds; it also writes an immutable access audit event.

## Administrator uploads

`/admin/resources/upload` accepts one PDF, JPG, PNG, or WebP file up to 25 MB. Excel resources already present in the repository remain visible as public metadata and available for authenticated staff download, but new XLSX uploads are rejected. The protected server validates the Firebase identity and upload metadata, derives a safe `section/category/year/filename` key, rejects duplicates, and returns a five-minute presigned PUT URL. The browser uploads directly to R2 without receiving R2 credentials.

The R2 API token must have **Object Read & Write** access to the repository and private audit buckets. Keep both buckets private. Configure the repository bucket CORS policy to allow `GET` and `PUT` from only the exact local and production application origins. Allow the request headers used by uploads, including `Content-Type` and `If-None-Match`, and expose only the response headers the interface needs. Do not use a wildcard production origin. Upload authorizations sign `If-None-Match: *`, so R2 rejects a concurrent upload instead of silently overwriting an existing key.

After the direct PUT succeeds, the client calls the protected upload-completion endpoint. The server reads the actual R2 object properties and verifies its key, content length, content type, and upload timestamp before the UI reports success.

Public resource rows provide a view action for PDFs and images without exposing an R2 key or permanent object URL. Public download controls are not provided. Excel files remain public metadata because Version 1 has no browser spreadsheet viewer; authenticated staff can download the original from the administrator inventory.

Public view mode is not digital-rights management. A browser must receive file bytes to display a PDF or image, so a technically capable visitor may still save content even though the application exposes no download action.

## Deployment security

`vercel.json` applies a Content Security Policy, clickjacking protection, MIME-sniffing protection, a strict referrer policy, a restricted permissions policy, and HSTS. Verify these response headers after every production deployment. HTTPS is mandatory for both the application and its configured R2 endpoints.

Cloudflare presigned URLs work on the R2 S3 API domain, not a public custom domain. Treat each signed URL as a temporary bearer credential: never log it, cache it, or place it in public metadata. The 60-second lifetime intentionally limits exposure. Before deployment, manually confirm that the repository and audit buckets have no enabled `r2.dev` URL or public custom domain.

Administrator mutations write immutable JSON audit events to the private audit bucket using create-only R2 writes. These records include the administrator UID, action, target, timestamp, and non-sensitive action details. They never include passwords, Firebase tokens, or R2 credentials.

## Editing resource details

In **Admin > Resources**, select **Edit** to change a file or link's display name, section, category, or year. Both calendar years (for example, `2026`) and consecutive school years (for example, `2026-2027`) are supported. Choose **No category** to place a resource directly under a section.

Editing preserves the original filename, file contents, and link destination. The exact display name is stored as encoded R2 object metadata; existing resources without this metadata keep their filename-derived names. Changes to the section, category, or year use a server-side R2 copy followed by removal of the source, with duplicate protection and an audit record. No browser re-upload is needed. Nested category paths are retained when their section and top-level category are unchanged.

Listings read object metadata with bounded concurrency and reuse the existing 60-second public cache. The current server cache is cleared after an edit, and the administrator interface refreshes its resource queries. Other server instances and already open public pages may show cached information until their next refresh. Moving a resource changes its opaque public ID; previews and links opened from refreshed listings use the new ID.

## Automatic year groups

The public repository and Admin > Resources automatically group resources whose display names match after removing their recorded year and normalizing case, spaces, hyphens, and underscores. Grouping stays within the same section, category, and resource type; unrelated numbers and years in names remain significant. Resources with no matching name keep their existing individual presentation.

Select a group's **View years** button to open a modal with its resources ordered by year, newest first. Public PDF/image previews, link opening, and XLSX staff-only metadata retain their existing behavior. Administrators can preview, download, edit, or delete each resource from the group modal. Files and links remain independent R2 objects.

List requests use the optional `groupBy=year` parameter. Pagination counts complete groups, so a group's years are returned together even when they exceed the page's group limit. The response keeps the existing resource array and total resource count, and adds `meta.groupTotal` for grouped requests. Search and filters apply before grouping.

## Website notices and concern reporting

Public routes /privacy-notice, /terms-of-use, and /report-a-concern are linked in the public footer. Their plain-language content applies to public visitors to this Information Hub. They do not describe administrator accounts, developer tools, or the technology stack, and do not link to the main university website or its policy PDFs. Concern links open the visitor's email application using the existing office address; no website form or automatic email transmission is introduced.

The office should review the notices when website practices change and confirm the handling and retention of visitor inquiries. The notices do not claim legal approval or guarantee protection from legal claims.
