# Architecture decisions

Short records of the decisions that shaped this project, and what each one costs.

## 1. Better Auth inside the API, with passkeys

**Context.** The backoffice needs password and passkey login for a small team. There is no public sign-up.

**Decision.** Run Better Auth inside the NestJS API, with sign-up disabled and accounts created only by an administrator. `role` and `mustChangePassword` are declared `input: false`, so a client cannot set them.

**Trade-off.** The app owns its auth tables and upgrades, and has to keep Better Auth's expectations satisfied. For example, credential accounts must use the user id as `accountId`.

## 2. Presigned uploads to object storage

**Context.** Editors upload images and PDFs. Passing those files through the API would tie up its memory and bandwidth.

**Decision.** The API validates the type, folder and size, then returns a short-lived presigned URL. The browser uploads directly to S3/R2. File names are random UUIDs, the size is part of the signature, and SVG is not allowed.

**Trade-off.** The API never sees the bytes, so the declared `Content-Type` is not checked against the file's real content. The risk is contained by the allowlist, because uploads are served from a separate media domain and only to known image types.

## 3. Two cache layers, invalidated on write

**Context.** The public site is read far more than it changes, but an edit in the backoffice has to appear immediately.

**Decision.** The API caches public responses in Redis and Next.js caches its fetches with tags. Every write clears the Redis keys and calls `/api/revalidate` with a shared secret, compared in constant time.

**Trade-off.** Each resource needs a mapping from cache keys to tags, and web and API must share `REVALIDATE_SECRET`. If that call fails, content is stale until the cache expires, so the failure is logged.

## 4. Strict CSP with per-request nonces

**Context.** The site collects children's enrolment requests, so script injection has to be hard.

**Decision.** Middleware creates a nonce for every request and sends `script-src 'nonce-…' 'strict-dynamic'`, with no `unsafe-inline` or `unsafe-eval` for scripts. Post content is rendered as text, never as HTML.

**Trade-off.** Pages need a nonce per request, so they are rendered dynamically and cannot be served as static HTML. Styles still allow `style=""` attributes, which `next/image` needs.

## 5. GDPR built into the product

**Context.** Contact messages hold personal data about families, sometimes about children.

**Decision.** Consent is required and recorded. Export and erasure are limited to the `ADMIN` role and logged with identifiers only. Messages are anonymised automatically after a configurable retention period, and erasure keeps the anonymised row.

**Trade-off.** Anonymising is not the same as deleting the row, and every new personal field must be added to the erasure list by hand. A unit test covers the fields in that list.

## 6. Redis failures degrade the service instead of stopping it

**Context.** Redis backs the cache, the rate limits and the email queue, but the site can still work without it.

**Decision.** The Redis client fails fast instead of queueing commands. A failed read counts as a cache miss, rate limits fall back to memory, and a contact message is saved even if its email cannot be queued. Rate limits use Lua scripts so that parallel requests cannot exceed them.

**Trade-off.** During an outage, in-memory limits apply per process and messages wait as "email pending" in the backoffice, with no automatic retry.
