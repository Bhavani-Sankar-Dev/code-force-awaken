import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool, PoolClient } from "pg";
import {
  ensurePostgresStateSchema,
  insertInitialPostgresState,
  loadPostgresState,
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
