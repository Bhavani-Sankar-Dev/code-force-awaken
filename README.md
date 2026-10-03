<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CODE FORCE AWAKEN

React + TypeScript + Vite frontend with an Express/TypeScript server. The server owns participant sessions, timers, qualification, scoring, and JSON persistence.

## Run Locally

**Prerequisite:** Node.js

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env`; set a private `ADMIN_PASSCODE`.
3. Run the combined frontend and backend with `npm run dev`.
4. Run `npm run lint` and `npm run build` before deployment.

## Competition answer checking

Participant Python is not compiled or executed. Round 2 accepts the expected output for each published sample input; Round 3 accepts configured code fragments; Round 4 accepts outputs for its displayed DSA inputs. These predefined-answer checks are intentionally limited and do not establish that a complete program works for arbitrary or hidden test cases.

Answer keys are kept in the server-only `server/answerKeys.ts`; do not import that file or `src/data/competitionData.ts` from frontend code.

## Persistence and deployment

Local development stores event and participant data in `db_state.json`. Netlify Functions use PostgreSQL through `DATABASE_URL`; the serverless function filesystem is not used for participant state. A PostgreSQL row lock serializes state-changing API requests across function instances, and SQL unique constraints reject duplicate participant identities.

Before deploying a live competition:

1. Create a PostgreSQL database on a free tier, such as Neon. Use its pooled connection string if available; keep it private.
2. Back up `db_state.json` and verify the backup. Put `DATABASE_URL` in the local untracked `.env`, then run `npm run migrate:state` once. The importer validates identities and sessions, initializes the schema, and refuses to overwrite an initialized database.
3. In Netlify site environment variables, set `DATABASE_URL`, a private `ADMIN_PASSCODE`, and `FRONTEND_ORIGINS` to the exact canonical site origin (for example, `https://your-site.netlify.app`, without a trailing slash). For deploy previews, configure that deploy context with the exact preview origin if browser testing there is needed.
4. Deploy from the repository root. `netlify.toml` builds the Vite frontend, publishes `dist`, builds the Express function, and rewrites `/api/*` to it. Leave `VITE_API_BASE_URL` unset so frontend requests remain same-origin.
5. Confirm `/api/state` returns JSON, then exercise participant registration/session restore, admin login, duplicate rejection, and all four rounds before opening registration.

The migration preserves participants, scores, qualification, timers, registration keys, recovery-code hashes, sessions, and event configuration. It leaves the source JSON file unchanged. Keep the backup and arrange regular database backups. Netlify function and database free-tier quotas, connection limits, and cold-start behavior have not been load-tested for the expected competition traffic; run a realistic load test before relying on this deployment.

Local JSON writes use an atomic temporary-file rename but do not coordinate separate server processes. Do not run more than one local JSON-backed server against the same file.

Registration uses name, college, and roll number to prevent duplicate attempts, but those fields alone do not verify a person's real-world identity.
