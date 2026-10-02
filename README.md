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

The server stores event and participant data in `db_state.json` by default. Set `DB_FILE` to an absolute path on persistent storage when deploying. Keep regular backups and export participant results from the organizer dashboard.

JSON persistence is intended for one always-running Node.js server process with a durable disk. It is not safe to share across multiple server instances and is not durable on ephemeral serverless filesystems. Do not deploy only the Vite frontend to a static host and expect the Express API or JSON data to persist. A database or coordinated storage service would be needed for multi-instance deployment.

The JSON writes are serialized within one Node.js process and use an atomic temporary-file rename. This does not coordinate writes between separate server processes. No 100-participant concurrency/load test has been run, so capacity for that load is not claimed.

Registration uses name, college, and roll number to prevent duplicate attempts, but those fields alone do not verify a person's real-world identity.
