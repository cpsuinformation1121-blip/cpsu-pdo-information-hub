# Deployment Guide

Complete, ordered steps to deploy the CPSU Planning and Development Office
Information Hub to Vercel. Follow the phases in order and confirm each
checkpoint before moving on.

---

## Phase 0 — Pre-flight

Accounts required (all under CPSU/PDO ownership where possible):

- GitHub
- Vercel
- Cloudflare (R2)
- Firebase

Local requirements: Node.js 20 or newer.

Confirm the project is clean before deploying:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Checkpoint: all four commands pass with no errors.

---

## Phase 1 — Commit and push

```bash
git status
git add -A
git commit -m "chore: prepare production deployment"
git push origin main
```

Checkpoint: `git status` is clean and the push succeeds.

---

## Phase 2 — Cloudflare R2

Do this before Vercel so the values are ready.

1. Create two **private** buckets:
   - `cpsu-pdo-information-hub` → `R2_BUCKET_NAME`
   - `cpsu-pdo-audit` → `R2_AUDIT_BUCKET_NAME`
2. For each bucket, disable the `r2.dev` public URL and remove any public
   custom domain.
3. Create an R2 API token with **Object Read & Write**, scoped to both buckets.
   Record `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and the account's
   `R2_ACCOUNT_ID`.
4. The default endpoint is:

   ```text
   https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
   ```

   Leave `R2_ENDPOINT` blank unless a jurisdiction-specific endpoint is needed.
5. CORS is finished in Phase 5 once the Vercel domain is known.

Checkpoint: two private buckets exist, the token has Object Read & Write, and
no public URLs are enabled.

---

## Phase 3 — Firebase

1. Create or select the Firebase project.
2. Enable **Email/Password** under Authentication providers.
3. Create the initial administrator user (email + password). Copy its **User
   UID** for `FIREBASE_BOOTSTRAP_ADMIN_UID`.
4. Register a Web app and record the public client configuration for
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`.
5. Project settings → Service accounts → generate a new private key. From the
   downloaded JSON record `FIREBASE_ADMIN_PROJECT_ID` (`project_id`),
   `FIREBASE_ADMIN_CLIENT_EMAIL` (`client_email`), and
   `FIREBASE_ADMIN_PRIVATE_KEY` (`private_key`).

Checkpoint: all Firebase values are recorded. Keep the service-account JSON out
of the repository.

---

## Phase 4 — Vercel

1. Import the GitHub repository. Framework Preset: **Vite**. Build Command:
   `npm run build`. Output Directory: `dist`. Root Directory: `./`.
2. Add the environment variables below to **Production** and **Preview**:

   | Variable | Notes |
   | --- | --- |
   | `R2_ACCOUNT_ID` | Phase 2 |
   | `R2_ACCESS_KEY_ID` | Phase 2 |
   | `R2_SECRET_ACCESS_KEY` | Phase 2 |
   | `R2_BUCKET_NAME` | repository bucket |
   | `R2_AUDIT_BUCKET_NAME` | audit bucket |
   | `R2_ENDPOINT` | leave empty |
   | `FIREBASE_ADMIN_PROJECT_ID` | Phase 3 |
   | `FIREBASE_ADMIN_CLIENT_EMAIL` | Phase 3 |
   | `FIREBASE_ADMIN_PRIVATE_KEY` | one line with literal `\n` |
   | `FIREBASE_BOOTSTRAP_ADMIN_UID` | Phase 3 |
   | `VITE_FIREBASE_API_KEY` | Phase 3 |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Phase 3 |
   | `VITE_FIREBASE_PROJECT_ID` | Phase 3 |
   | `VITE_FIREBASE_APP_ID` | Phase 3 |

3. Deploy.

Checkpoint: the build succeeds and the public Home page loads.

`VITE_*` values are baked in at build time; changing them requires a redeploy.

---

## Phase 5 — Connect the domains

1. Firebase → Authentication → Settings → Authorized domains → add the
   `*.vercel.app` domain (and any custom domain later).
2. R2 bucket `cpsu-pdo-information-hub` → Settings → CORS Policy:

   ```json
   [
     {
       "AllowedOrigins": [
         "https://your-app.vercel.app",
         "http://127.0.0.1:5173"
       ],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["Content-Type", "If-None-Match"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Replace the Vercel URL with the exact production domain.
3. Redeploy if any environment variable changed.

Checkpoint: the authorized domain is added and CORS is saved.

---

## Phase 6 — Verification checklist

Public site:

- [ ] Home, Repository, Accomplishment Report, OPCR, About, Contact load
- [ ] Repository lists files; PDF and image preview opens
- [ ] OPCR shows the empty state when no data has been entered

Administrator:

- [ ] `/admin/login` signs in with the bootstrap administrator
- [ ] Overview loads (session verified server-side)
- [ ] Upload a small PDF or image (confirms R2, CORS, and CSP)
- [ ] Save an OPCR (MFO → PAP → indicator) and an accomplishment report
- [ ] Open or download an uploaded file

Security:

- [ ] Response headers include `Content-Security-Policy`,
      `Strict-Transport-Security`, `X-Content-Type-Options`,
      `X-Frame-Options`, and `Referrer-Policy`
- [ ] Both R2 buckets still have no public URL or domain
- [ ] No console errors during the checks above

---

## Phase 7 — Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Admin login fails | Vercel domain not authorized in Firebase | Phase 5.1 |
| Upload fails immediately | CSP or R2 CORS | Confirm `https://*.r2.cloudflarestorage.com` in CSP and the origin in CORS |
| OPCR returns 404 | API function not deployed | Confirm `api/opcr.ts` and `api/admin/opcr-resource.ts` are pushed |
| `FIREBASE_ADMIN_*` error | Private key formatting | Re-paste on one line with literal `\n` |
| 500 on protected APIs | Missing or invalid env vars | Recheck Phase 4.2 and redeploy |
| Stale interface | Cached lazy chunk | Hard refresh (Ctrl+Shift+R) |

---

## Phase 8 — After testing

- If OPCR or accomplishment data was saved to the R2 bucket during development,
  delete `_system/opcr-resource.json` and
  `_system/accomplishment-resource.json` to start clean.
- Add the production custom domain in Vercel, then repeat Phase 5.
- Plan ownership transfer (Vercel, Firebase, Cloudflare, GitHub) to CPSU/PDO.
