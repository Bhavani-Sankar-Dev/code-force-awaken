import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool, type PoolClient } from "pg";
import {
  ensurePostgresStateSchema,
  insertInitialPostgresState,
} from "../server/postgresState.ts";

async function migrateState(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Set DATABASE_URL to the target PostgreSQL connection string.");
  }

  const stateFile = path.resolve(
    process.env.DB_FILE || path.join(process.cwd(), "db_state.json"),
  );
  if (!existsSync(stateFile)) {
    throw new Error(`State file not found: ${stateFile}`);
  }

  const parsed: unknown = JSON.parse(readFileSync(stateFile, "utf-8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("db_state.json must contain a JSON object.");
  }
  const state = parsed as Record<string, unknown>;
  if (Array.isArray(state.participants)) {
    const identities = new Set<string>();
    for (const value of state.participants) {
      if (!value || typeof value !== "object") {
        throw new Error("db_state.json contains an invalid participant record.");
      }
      const participant = value as Record<string, unknown>;
      if (
        typeof participant.participantId !== "string" ||
        typeof participant.name !== "string" ||
        typeof participant.college !== "string" ||
        typeof participant.rollNumber !== "string"
      ) {
        throw new Error("db_state.json contains an invalid participant identity.");
      }
      const normalize = (input: string) =>
        input.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
      const college = normalize(participant.college);
      const roll = normalize(participant.rollNumber);
      const name = normalize(participant.name);
      const rollIdentity = `${college}\0${roll}`;
      const nameIdentity = `${college}\0${name}`;
      if (
        identities.has(`roll:${rollIdentity}`) ||
        identities.has(`name:${nameIdentity}`)
      ) {
        throw new Error(
          "db_state.json contains duplicate registration identities; resolve them in a separate verified copy before importing.",
        );
      }
      identities.add(`roll:${rollIdentity}`);
      identities.add(`name:${nameIdentity}`);
    }
  }
  if (
    Array.isArray(state.adminTokenHashes) &&
    state.adminTokenHashes.some((tokenHash) => typeof tokenHash !== "string")
  ) {
    throw new Error("db_state.json contains invalid admin token hashes.");
  }
  if (!Array.isArray(state.adminTokenHashes)) {
    state.adminTokenHashes = [];
  }
  if (
    state.participantSessions &&
    typeof state.participantSessions === "object" &&
    !Array.isArray(state.participantSessions)
  ) {
    for (const [tokenHash, value] of Object.entries(state.participantSessions)) {
      if (
        !/^[a-f0-9]{64}$/i.test(tokenHash) ||
        !value ||
        typeof value !== "object" ||
        typeof (value as Record<string, unknown>).participantId !== "string" ||
        !Number.isFinite((value as Record<string, unknown>).expiresAt)
      ) {
        throw new Error("db_state.json contains an invalid participant session.");
      }
    }
  }

  const pool = new Pool({ connectionString, max: 1 });
  let client: PoolClient | undefined;
  try {
    await ensurePostgresStateSchema(pool);
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(1396919117)");
    await insertInitialPostgresState(client, state);
    await client.query("COMMIT");
    console.log("Existing competition state was imported successfully.");
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        console.error("Database rollback failed; verify the database transaction.");
      }
    }
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

void migrateState().catch((error: unknown) => {
  const code =
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  console.error(
    "State migration failed; existing database state was not overwritten. Check the source file, DATABASE_URL, database connectivity, and uniqueness conflicts.",
    code ? `PostgreSQL error code: ${code}` : "",
  );
  process.exitCode = 1;
});
