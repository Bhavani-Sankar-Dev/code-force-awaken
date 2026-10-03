import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool, PoolClient } from "pg";
import {
  ensurePostgresStateSchema,
  insertInitialPostgresState,
  loadPostgresState,
  persistPostgresState,
} from "./postgresState.ts";
import { registrationKey } from "./registrationIdentity.ts";

type Query = { text: string; values?: readonly unknown[] };

function fakeClient(
  resultForQuery: (text: string) => { rows: Array<Record<string, unknown>> },
): { client: PoolClient; queries: Query[] } {
  const queries: Query[] = [];
  const client = {
    query: async (text: string, values?: readonly unknown[]) => {
      queries.push({ text, values });
      const result = resultForQuery(text);
      return {
        ...result,
        rowCount: text.startsWith("SELECT 1 FROM competition_state")
          ? result.rows.length
          : 1,
      };
    },
  } as unknown as PoolClient;
  return { client, queries };
}

test("registration keys normalize Unicode, whitespace, and case", () => {
  assert.equal(
    registrationKey("  Example   College ", "ＡＢ 123"),
    registrationKey("example college", "ab 123"),
  );
});

test("the PostgreSQL schema enforces unique registration and round attempts", async () => {
  const statements: string[] = [];
  const pool = {
    query: async (text: string) => {
      statements.push(text);
      return { rows: [], rowCount: 0 };
    },
  } as unknown as Pool;

  await ensurePostgresStateSchema(pool);

  assert.match(statements[1], /UNIQUE \(normalized_college, normalized_roll_number\)/);
  assert.match(statements[1], /UNIQUE \(normalized_college, normalized_name\)/);
  assert.match(statements[2], /PRIMARY KEY \(participant_id, round\)/);
});

test("initial migration refuses to overwrite existing competition state", async () => {
  const { client, queries } = fakeClient((text) =>
    text.startsWith("SELECT 1 FROM competition_state")
      ? { rows: [{ payload: { participants: [] } }] }
      : { rows: [] },
  );

  await assert.rejects(
    insertInitialPostgresState(client, { participants: [] }),
    /refusing to overwrite it/,
  );
  assert.equal(queries.length, 1);
  assert.match(queries[0].text, /SELECT 1 FROM competition_state/);
});

test("initial migration refuses to overwrite auxiliary indexed data", async () => {
  const { client, queries } = fakeClient((text) => {
    if (text.startsWith("SELECT 1 FROM competition_state")) {
      return { rows: [] };
    }
    if (text.includes("has_registrations")) {
      return {
        rows: [{ has_registrations: true, has_attempts: false }],
      };
    }
    return { rows: [] };
  });

  await assert.rejects(
    insertInitialPostgresState(client, { participants: [] }),
    /indexed registrations or attempts; refusing to overwrite it/,
  );
  assert.equal(queries.length, 2);
  assert.match(queries[1].text, /participant_registrations/);
  assert.match(queries[1].text, /participant_attempts/);
});

test("PostgreSQL state encoding preserves registration keys and orphan attempts", async () => {
  const state = {
    participants: [],
    registrationKeys: ["college\u0000roll", "literal\\u0000"],
    attempts: {
      historicalOwner: {
        rounds: {
          "1": { startedAt: "2026-01-01T00:00:00.000Z", durationSeconds: 30 },
        },
      },
    },
  };
  const { client, queries } = fakeClient(() => ({ rows: [] }));

  await insertInitialPostgresState(client, state);

  const insert = queries.find((query) =>
    query.text.startsWith("INSERT INTO competition_state"),
  );
  assert.ok(insert);
  const storedState = JSON.parse(String(insert.values?.[0]));
  assert.deepEqual(storedState.registrationKeys, {
    encoding: "utf16le-base64-v1",
    values: state.registrationKeys.map((key) =>
      Buffer.from(key, "utf16le").toString("base64"),
    ),
  });
  assert.equal(JSON.stringify(storedState).includes("\u0000"), false);

  const attemptIndexInsert = queries.find((query) =>
    query.text.includes("INSERT INTO participant_attempts"),
  );
  assert.ok(attemptIndexInsert);
  assert.equal(
    JSON.parse(String(attemptIndexInsert.values?.[0]))[0].participant_id,
    "historicalOwner",
  );

  const { client: readClient } = fakeClient((text) =>
    text.startsWith("SELECT payload")
      ? { rows: [{ payload: storedState }] }
      : { rows: [] },
  );
  assert.deepEqual(await loadPostgresState(readClient), state);

  const { client: malformedClient } = fakeClient((text) =>
    text.startsWith("SELECT payload")
      ? {
          rows: [
            {
              payload: {
                registrationKeys: {
                  encoding: "utf16le-base64-v1",
                  values: ["not valid base64"],
                },
              },
            },
          ],
        }
      : { rows: [] },
  );
  await assert.rejects(
    loadPostgresState(malformedClient),
    /registration key encoding is invalid/,
  );

  const { client: updateClient, queries: updateQueries } = fakeClient(() => ({
    rows: [],
  }));
  await persistPostgresState(updateClient, state);
  const update = updateQueries.find((query) =>
    query.text.includes("UPDATE competition_state"),
  );
  assert.ok(update);
  assert.deepEqual(
    JSON.parse(String(update.values?.[0])).registrationKeys,
    storedState.registrationKeys,
  );
});

test("state loading uses a locked database row", async () => {
  const storedState = { participants: [] };
  const { client, queries } = fakeClient((text) =>
    text.startsWith("SELECT payload")
      ? { rows: [{ payload: storedState }] }
      : { rows: [] },
  );

  assert.deepEqual(await loadPostgresState(client), storedState);
  assert.match(queries[0].text, /FOR UPDATE/);
});
