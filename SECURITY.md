# Security

Security posture, audit findings, and reporting process for IdeaBoard.

**Last full audit:** August 8, 2026 (v0.11.0) — previous full audit August 6, 2026 (v0.6.0)
**Audit scope:** dependencies, authentication & session handling, authorization (RLS), storage, input validation, XSS/injection surfaces, HTTP headers, secret hygiene, and privacy/compliance obligations.

---

## Reporting a vulnerability

Please email **samuelworash@gmail.com** with the details and reproduction steps. Do not open a public issue for an unpatched vulnerability. We aim to acknowledge within 72 hours.

---

## Threat model in brief

IdeaBoard is a single-tenant-per-user web app. The browser talks **directly to Supabase** (auth, database, storage) using the anon key; there is no bespoke API layer for data access. This means:

- **Row Level Security is the primary authorization boundary.** Any gap in RLS is directly exploitable by an authenticated user with a REST client — client-side checks are advisory only.
- **Client-side validation is not a security control.** Anything enforced only in the browser (file size, MIME type) must be mirrored server-side.
- The single privileged server route (`/api/account/delete`) is the only place the service-role key is used, and it never leaves the server.

---

## Audit findings

All findings below were discovered during the v0.6.0 audit and are **fixed** unless noted. Severity uses CVSS-style qualitative bands.

### IDB-001 — Cross-tenant deletion/overwrite of note attachments · **High** · Fixed

**What:** Storage policies on the `note-attachments` bucket authorized writes with only `bucket_id = 'note-attachments' AND auth.role() = 'authenticated'`. Every other bucket (`avatars`, `attachments`, `thumbnails`) correctly enforced folder ownership via `auth.uid()::text = (storage.foldername(name))[1]`.

**Impact:** Any authenticated user could **delete or overwrite any other user's note images**, and upload arbitrary objects to any path in the bucket. Destructive, cross-tenant, and trivially exploitable via the Supabase JS client.

**Compounding factor:** uploads were pathed `<board_id>/<note_id>/<ts>.<ext>` — with no user segment, ownership could not be verified even if a policy had tried.

**Fix:**
- Upload path is now `<user_id>/<board_id>/<note_id>/<ts>.<ext>` (`src/components/board/canvas.tsx`).
- `INSERT`, `UPDATE`, and `DELETE` policies now require `auth.uid()::text = (storage.foldername(name))[1]`. `SELECT` remains public, which is intended — note images are rendered by URL.
- Applied in `docs/database/schema.sql` and in migration `001_security_hardening.sql`.

> **Action required:** run the migration against your live database. Code alone does not fix this — the policies live in Postgres.

### IDB-002 — No server-side upload limits · **Medium** · Fixed

**What:** File size and MIME validation existed only in the browser (`src/lib/upload.ts`). Buckets had `file_size_limit` and `allowed_mime_types` unset.

**Impact:** An attacker could bypass the UI and upload files of any size and any content type to a publicly readable bucket — storage exhaustion, cost abuse, and arbitrary file hosting under your domain. Uploading SVG (which can carry script) to a public bucket is a stored-XSS vector if ever rendered inline.

**Fix:** Migration sets `file_size_limit` (5 MB avatars, 10 MB attachments) and restricts `allowed_mime_types` to JPEG/PNG/WebP/GIF. **SVG is deliberately excluded.** `dangerouslyAllowSVG` is explicitly `false` in `next.config.mjs`.

### IDB-003 — Missing HTTP security headers · **Medium** · Fixed

**What:** No CSP, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`. `X-Powered-By` disclosed the framework.

**Impact:** No defense-in-depth against clickjacking, MIME sniffing, protocol downgrade, or referrer leakage; no mitigation layer if an XSS bug were ever introduced.

**Fix:** Full header set in `next.config.mjs`, including a CSP with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, and `form-action 'self'`. `poweredByHeader: false`. Verified live on every route.

### IDB-004 — Account deletion promised but not implemented · **Medium (compliance)** · Fixed

**What:** The Privacy Policy ("Delete your account and all associated data"), Terms ("You may terminate your account at any time by deleting it from the Settings page"), and the in-app Guide all stated account deletion was available. **No such feature existed anywhere in the codebase.**

**Impact:** Users had no way to exercise erasure (GDPR Art. 17 / CCPA), and the published legal documents made a false statement about the product.

**Fix:** `POST /api/account/delete`:
- Derives the target user from the **verified session**, never from the request body — the endpoint cannot be aimed at another account.
- Uses the service-role key server-side only; returns 503 if unconfigured rather than failing open.
- Deletes storage objects across all buckets (not covered by the DB cascade), then deletes the auth user, which cascades `profiles → stories → boards → notes/connections/components`.
- UI is a Danger Zone in Settings requiring the user to type `DELETE`.

> **Action required:** set `SUPABASE_SERVICE_ROLE_KEY` in Vercel (server-side env var — never prefix it with `NEXT_PUBLIC_`) or deletion returns 503.

### IDB-005 — CSRF hardening on destructive endpoint · **Low** · Fixed

**What:** `/api/account/delete` relied solely on Supabase's `SameSite=Lax` cookies to prevent cross-site invocation.

**Impact:** Low — `SameSite=Lax` already blocks cross-site POST. Treated as defense in depth given the irreversibility of the action.

**Fix:** The route rejects requests whose `Origin` host does not match the request host (403). Verified: cross-origin POST → `403 Invalid origin`; unauthenticated POST → `401`.

### IDB-006 — Incomplete `.gitignore` coverage for env files · **Low** · Fixed

**What:** `.gitignore` covered `.env` and `.env*.local` but not `.env.production` / `.env.development`.

**Impact:** A future `.env.production` containing the service-role key could be committed accidentally.

**Fix:** Broadened to `.env.*` with `!.env.example`.

### IDB-007 — Vulnerable dependencies · **High (aggregate)** · Fixed

**What:** `pnpm audit` reported **19 production** vulnerabilities (8 high) and **25 total**, spanning `postcss`, `picomatch`, `ws`, `yaml`, `sharp`, `uuid`, `@dicebear/*`, plus a dev chain of `vite`, `rollup`, `js-yaml`, `minimatch`, `brace-expansion`, `flatted`, and `ajv`.

**Fix:** Direct dependencies bumped (`uuid`, `@dicebear/core`, `@dicebear/collection`); transitive versions forced via `pnpm.overrides`; `vite` pinned explicitly because `vitest` resolved a vulnerable 7.3.0.

**Result: 0 vulnerabilities** in both the production and full dependency trees.

### IDB-008 — Container `board_id` not constrained to its story · **Low** · Fixed

**What:** `containers` carries both `story_id` and `board_id`, and RLS authorizes on `user_owns_story(story_id)` — but nothing enforced that the referenced board actually belongs to that story. A crafted insert could pass authorization while pointing `board_id` at a board in another user's story. The same gap existed for `notes.container_id`, which could reference a container on a different board.

**Impact:** Low, and **not** a disclosure issue — the row stays invisible to the other user, since their reads are filtered by their own story ownership. This is data integrity rather than access control.

**Fix:** Migration `003_container_integrity.sql` adds `BEFORE INSERT OR UPDATE` triggers enforcing that a container's board belongs to its story, and that a note's container is on the same board.

> **Action required:** run the migration. Existing rows aren't rewritten; the triggers apply from the next write onward.

### IDB-009 — Missing input length limits on new fields · **Informational** · Fixed

**What:** Container names (`VARCHAR(100)`) and board titles (`VARCHAR(255)`) had no client-side length cap, so over-long input produced a raw database error rather than being prevented.

**Impact:** Informational — the database rejected the write correctly; this was a UX and error-surface issue, not a bypass.

**Fix:** `maxLength` on both inputs, plus a new `src/lib/validations/container.ts` Zod schema mirroring the database constraints (name length, hex colour format, opacity range), bringing containers in line with every other entity.

---

## Verified secure (no action needed)

These were tested during the audit and found sound:

| Area | Finding |
| --- | --- |
| **RLS coverage** | Enabled on all 11 tables, 32 policies. Ownership chains (`notes → boards → stories → user_id`) verified correct, with `USING` **and** `WITH CHECK` on write paths. |
| **XSS via Markdown** | No `rehype-raw`, so raw HTML in note content is **not** rendered. `react-markdown` v10 sanitizes URLs (blocks `javascript:`). |
| **Dangerous APIs** | No `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`, or `document.write` anywhere in `src/`. |
| **SQL injection** | No raw SQL from user input; all access goes through the Supabase query builder (parameterized). |
| **Session validation** | Middleware uses `supabase.auth.getUser()` (server-verified) rather than trusting a decoded cookie. |
| **Open redirect** | OAuth callback passes `next` through `sanitizeRedirectPath()`, which rejects absolute URLs, protocol-relative URLs, and control characters. Unit-tested. |
| **Account enumeration** | Password reset always reports success regardless of whether the address exists; login errors are generic. |
| **Password policy** | Minimum 8 characters, requires upper, lower, and digit; 72-char cap (bcrypt limit). |
| **Secret hygiene** | No secrets committed. Only `NEXT_PUBLIC_*` values reach the browser; the service-role key is server-only. |
| **Image origins** | `next/image` restricted to `*.supabase.co` public storage paths; SVG optimization disabled. |

---

## Known limitations & planned hardening

Honest disclosure of what is *not* yet addressed:

1. **CSP uses `'unsafe-inline'` and `'unsafe-eval'` in `script-src`.** Next.js's inline bootstrap requires this without a nonce-based setup. Moving to per-request nonces via middleware is the main outstanding hardening item — it would make the CSP a real XSS mitigation rather than a partial one.
2. **Rate limiting has a real architectural gap.** Board/note/component mutations and Supabase auth calls (`supabase.auth.signInWithPassword`, `supabase.from('notes').insert(...)`) go **directly from the browser to Supabase** — they never pass through this Next.js server, so no server-side rate limiter (ours or anyone else's) can see or throttle them. What's implemented (`src/lib/rate-limit.ts`, Upstash Redis) covers only what's real to cover: a strict per-user limit on `/api/account/delete`, and a general per-IP throttle on all requests in middleware. Supabase's own auth rate limits (configurable in its dashboard) are the actual protection for login/signup abuse today. Closing this gap for board writes would require proxying mutations through Next.js API routes — a real architectural change, not a quick add.
3. **Dependency scanning is now automated.** CI runs `pnpm audit --prod --audit-level high` on every push/PR, and Dependabot (`​.github/dependabot.yml`) opens weekly PRs for outdated packages (patch/minor batched together; majors reviewed individually) and GitHub Actions versions.
4. **No error monitoring.** Server-side failures are `console.error` only. Sentry or similar would improve incident response.
5. **Undo/redo history is in-memory** and not persisted — not a security issue, but note that unsaved history is lost on reload.
6. **Public storage buckets.** `avatars`, `thumbnails`, and `note-attachments` are publicly readable by design (images are rendered by URL). Anyone with a URL can view the object. Do not treat uploaded images as confidential.

---

## Deployment security checklist

Before and after each deploy:

- [ ] Run every migration in `docs/database/migrations/` against the production database (`001_security_hardening.sql`, `002_conditional_notes.sql`, `003_container_integrity.sql`).
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel and is **not** prefixed `NEXT_PUBLIC_`.
- [ ] Confirm `NEXT_PUBLIC_APP_URL` includes the scheme (`https://…`).
- [ ] Confirm `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set (optional — the app runs without them, but rate limiting is disabled until they're set).
- [ ] Verify buckets show non-null `file_size_limit` and `allowed_mime_types`.
- [ ] Verify headers: `curl -I https://your-domain` should show CSP, HSTS, `X-Frame-Options`, and no `X-Powered-By`.
- [ ] Run `pnpm audit --prod` and confirm no known vulnerabilities.
- [ ] Confirm RLS is enabled on every table (Supabase dashboard flags tables without it).
