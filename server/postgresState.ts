import type { Pool, PoolClient } from "pg";
import { normalizeIdentityPart } from "./registrationIdentity.ts";

export async function ensurePostgresStateSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS competition_state (
      singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS participant_registrations (
      participant_id text PRIMARY KEY,
      normalized_name text NOT NULL,
      normalized_college text NOT NULL,
      normalized_roll_number text NOT NULL,
      UNIQUE (normalized_college, normalized_roll_number),
      UNIQUE (normalized_college, normalized_name)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS participant_attempts (
      participant_id text NOT NULL,
      round smallint NOT NULL CHECK (round BETWEEN 1 AND 4),
      attempt jsonb NOT NULL,
      PRIMARY KEY (participant_id, round)
    )
  `);
}

export async function loadPostgresState(
  client: PoolClient,
): Promise<Record<string, unknown> | undefined> {
  const result = await client.query<{ payload: unknown }>(
    "SELECT payload FROM competition_state WHERE singleton = true FOR UPDATE",
  );
  const payload = result.rows[0]?.payload;
  if (payload === undefined) return undefined;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Persistent competition state must be a JSON object.");
  }
  return payload as Record<string, unknown>;
}

export async function hasPostgresState(client: PoolClient): Promise<boolean> {
  const result = await client.query(
    "SELECT 1 FROM competition_state WHERE singleton = true",
  );
  return result.rowCount === 1;
}

export async function insertInitialPostgresState(
  client: PoolClient,
  state: Record<string, unknown>,
): Promise<void> {
  if (await hasPostgresState(client)) {
    throw new Error(
      "The database already has competition state; refusing to overwrite it.",
    );
  }
  const indexedState = await client.query<{
    has_registrations: boolean;
    has_attempts: boolean;
  }>(`
    SELECT
      EXISTS (SELECT 1 FROM participant_registrations) AS has_registrations,
      EXISTS (SELECT 1 FROM participant_attempts) AS has_attempts
  `);
  if (
    indexedState.rows[0]?.has_registrations ||
    indexedState.rows[0]?.has_attempts
  ) {
    throw new Error(
      "The database contains indexed registrations or attempts; refusing to overwrite it.",
    );
  }
  await client.query(
    "INSERT INTO competition_state (singleton, payload) VALUES (true, $1::jsonb)",
    [JSON.stringify(state)],
  );
  await synchronizeIndexedState(client, state);
}

export async function persistPostgresState(
  client: PoolClient,
  state: Record<string, unknown>,
): Promise<void> {
  const result = await client.query(
    `UPDATE competition_state
     SET payload = $1::jsonb, updated_at = now()
     WHERE singleton = true`,
    [JSON.stringify(state)],
  );
  if (result.rowCount !== 1) {
    throw new Error(
      "Persistent competition state is not initialized; import db_state.json first.",
    );
  }
  await synchronizeIndexedState(client, state);
}

async function synchronizeIndexedState(
  client: PoolClient,
  state: Record<string, unknown>,
): Promise<void> {
  const participants = Array.isArray(state.participants)
    ? state.participants.map((participant: unknown) => {
        if (!participant || typeof participant !== "object") {
          throw new Error("A stored participant record is invalid.");
        }
        const record = participant as Record<string, unknown>;
        if (
          typeof record.participantId !== "string" ||
          typeof record.name !== "string" ||
          typeof record.college !== "string" ||
          typeof record.rollNumber !== "string"
        ) {
          throw new Error("A stored participant identity is invalid.");
        }
        return {
          participant_id: record.participantId,
          normalized_name: normalizeIdentityPart(record.name),
          normalized_college: normalizeIdentityPart(record.college),
          normalized_roll_number: normalizeIdentityPart(record.rollNumber),
        };
      })
    : [];

  const attempts: Array<{
    participant_id: string;
    round: number;
    attempt: unknown;
  }> = [];
  if (state.attempts && typeof state.attempts === "object") {
    for (const [participantId, value] of Object.entries(state.attempts)) {
      if (!value || typeof value !== "object") continue;
      const rounds = (value as Record<string, unknown>).rounds;
      if (!rounds || typeof rounds !== "object" || Array.isArray(rounds))
        continue;
      for (const [roundValue, attempt] of Object.entries(rounds)) {
        const round = Number(roundValue);
        if (!Number.isInteger(round) || round < 1 || round > 4) {
          throw new Error("A stored round attempt has an invalid round.");
        }
        attempts.push({ participant_id: participantId, round, attempt });
      }
    }
  }

  await client.query("DELETE FROM participant_attempts");
  await client.query("DELETE FROM participant_registrations");
  await client.query(
    `INSERT INTO participant_registrations (
       participant_id, normalized_name, normalized_college, normalized_roll_number
     )
     SELECT participant_id, normalized_name, normalized_college, normalized_roll_number
     FROM jsonb_to_recordset($1::jsonb) AS row_data(
       participant_id text, normalized_name text, normalized_college text,
       normalized_roll_number text
     )`,
    [JSON.stringify(participants)],
  );
  await client.query(
    `INSERT INTO participant_attempts (participant_id, round, attempt)
     SELECT participant_id, round, attempt
     FROM jsonb_to_recordset($1::jsonb) AS row_data(
       participant_id text, round smallint, attempt jsonb
     )`,
    [JSON.stringify(attempts)],
  );
}
