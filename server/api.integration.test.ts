import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  round1AnswerKeys,
  round2AnswerKeys,
  round3AnswerKeys,
  round4AnswerRubrics,
} from "./answerKeys.ts";
import { round1Questions } from "../src/data/competitionData.ts";
import type { Participant } from "../src/types.ts";
import { resolveFrontendOrigins } from "./frontendOrigins.ts";

test("production Netlify site URL supplies the same-origin CORS allowlist", () => {
  const origins = resolveFrontendOrigins(
    undefined,
    "https://aikya-code-force-awaken.netlify.app/",
    true,
  );

  assert.deepEqual([...origins], ["https://aikya-code-force-awaken.netlify.app"]);
});

test("production frontend origin configuration retains additional allowed origins", () => {
  const origins = resolveFrontendOrigins(
    "https://aikya-code-force-awaken.netlify.app, https://preview.example.net",
    "https://aikya-code-force-awaken.netlify.app",
    true,
  );

  assert.deepEqual(
    [...origins],
    [
      "https://aikya-code-force-awaken.netlify.app",
      "https://preview.example.net",
    ],
  );
});

test("production origin resolution fails closed without a configured or Netlify URL", () => {
  assert.throws(
    () => resolveFrontendOrigins(undefined, undefined, true),
    /FRONTEND_ORIGINS or Netlify's URL/,
  );
});

async function availablePort(): Promise<number> {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not reserve an integration-test port.");
  }
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}

function startServer(port: number, stateFile: string): ChildProcess {
  return spawn(
    process.execPath,
    ["--import", "tsx", "server/localServer.ts"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(port),
        DB_FILE: stateFile,
        ADMIN_PASSCODE: "integration-test-passcode",
        NETLIFY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
}

async function stopServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

async function waitForApi(baseUrl: string, child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 15000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Integration server exited with ${child.exitCode}.`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/state`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Integration server did not start: ${String(lastError)}`);
}

async function jsonRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<{ response: Response; data: T }> {
  const response = await fetch(url, init);
  return { response, data: (await response.json()) as T };
}

test(
  "JSON-backed API preserves registration, sessions, all-round scoring, concurrency, and restart recovery",
  { timeout: 120000 },
  async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "cfa-api-test-"));
    const stateFile = path.join(directory, "db_state.json");
    const port = await availablePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    let child = startServer(port, stateFile);

    try {
      await waitForApi(baseUrl, child);

      const invalid = await jsonRequest<{ error: string }>(
        `${baseUrl}/api/register`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "", college: "Test College", rollNumber: "BAD" }),
        },
      );
      assert.equal(invalid.response.status, 400);

      const adminLogin = await jsonRequest<{ token: string }>(
        `${baseUrl}/api/admin/login`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ passcode: "integration-test-passcode" }),
        },
      );
      assert.equal(adminLogin.response.status, 200);
      const adminHeaders = {
        "content-type": "application/json",
        authorization: `Bearer ${adminLogin.data.token}`,
      };
      const activateSlots = await jsonRequest<{ success: boolean }>(
        `${baseUrl}/api/admin/test-mode-action`,
        {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({ action: "force_active_slots" }),
        },
      );
      assert.equal(activateSlots.data.success, true);

      const registration = await jsonRequest<{
        participant: Participant;
        participantCode: string;
      }>(`${baseUrl}/api/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Integration Participant",
          college: "Integration College",
          rollNumber: "TEST-ONE",
        }),
      });
      assert.equal(registration.response.status, 200);
      assert.ok(registration.data.participantCode);
      const cookie = registration.response.headers
        .get("set-cookie")
        ?.split(";")[0];
      assert.ok(cookie, "registration should issue a participant session cookie");

      const restoredSession = await jsonRequest<{
        participant: Participant;
      }>(`${baseUrl}/api/session`, {
        headers: { cookie: cookie! },
      });
      assert.equal(
        restoredSession.data.participant.participantId,
        registration.data.participant.participantId,
      );

      const duplicate = await jsonRequest<{ error: string }>(
        `${baseUrl}/api/register`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Different Name",
            college: "Integration College",
            rollNumber: "test-one",
          }),
        },
      );
      assert.equal(duplicate.response.status, 409);

      const concurrentRegistrations = await Promise.all(
        Array.from({ length: 100 }, (_, index) =>
          jsonRequest<{ participant: Participant }>(
            `${baseUrl}/api/register`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name: `Concurrent Participant ${index}`,
                college: "Integration College",
                rollNumber: `CONCURRENT-${index}`,
              }),
            },
          ),
        ),
      );
      assert.ok(concurrentRegistrations.every(({ response }) => response.status === 200));
      await Promise.all(
        concurrentRegistrations.map(async ({ response, data }) => {
          const sessionCookie = response.headers.get("set-cookie")?.split(";")[0];
          assert.ok(sessionCookie);
          const session = await jsonRequest<{ participant: Participant }>(
            `${baseUrl}/api/session`,
            { headers: { cookie: sessionCookie! } },
          );
          assert.equal(
            session.data.participant.participantId,
            data.participant.participantId,
          );
        }),
      );

      const duplicateRace = await Promise.all(
        Array.from({ length: 8 }, () =>
          fetch(`${baseUrl}/api/register`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: "Race Participant",
              college: "Integration College",
              rollNumber: "RACE-ONE",
            }),
          }),
        ),
      );
      assert.equal(
        duplicateRace.filter((response) => response.status === 200).length,
        1,
      );
      assert.equal(
        duplicateRace.filter((response) => response.status === 409).length,
        7,
      );

      const thresholdRegistration = await jsonRequest<{
        participant: Participant;
      }>(`${baseUrl}/api/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Threshold Participant",
          college: "Integration College",
          rollNumber: "THRESHOLD",
        }),
      });
      const thresholdCookie = thresholdRegistration.response.headers
        .get("set-cookie")
        ?.split(";")[0];
      assert.ok(thresholdCookie);
      await jsonRequest(`${baseUrl}/api/timer/start`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: thresholdCookie!,
        },
        body: JSON.stringify({ round: 1 }),
      });
      const thresholdResult = await jsonRequest<{
        score: number;
        isQualified: boolean;
      }>(`${baseUrl}/api/round1/submit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: thresholdCookie!,
        },
        body: JSON.stringify({
          answers: {
            q1: "B",
            q2: "A",
            q3: "A",
            q4: ["line-C", "line-B", "line-A"],
          },
        }),
      });
      assert.equal(thresholdResult.data.score, 12);
      assert.equal(thresholdResult.data.isQualified, true);

      const failingRegistration = await jsonRequest<{
        participant: Participant;
      }>(`${baseUrl}/api/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Failing Participant",
          college: "Integration College",
          rollNumber: "FAIL-ONE",
        }),
      });
      const failingCookie = failingRegistration.response.headers
        .get("set-cookie")
        ?.split(";")[0];
      assert.ok(failingCookie);
      await jsonRequest(`${baseUrl}/api/timer/start`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: failingCookie!,
        },
        body: JSON.stringify({ round: 1 }),
      });
      const failingRound1 = await jsonRequest<{ isQualified: boolean }>(
        `${baseUrl}/api/round1/submit`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: failingCookie!,
          },
          body: JSON.stringify({ answers: {} }),
        },
      );
      assert.equal(failingRound1.data.isQualified, false);
      const rejectedRound2 = await jsonRequest<{ error: string }>(
        `${baseUrl}/api/timer/start`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: failingCookie!,
          },
          body: JSON.stringify({ round: 2 }),
        },
      );
      assert.equal(rejectedRound2.response.status, 403);

      const participantId = registration.data.participant.participantId;
      const authHeaders = {
        "content-type": "application/json",
        cookie: cookie!,
      };
      const startRound = async (round: number) => {
        const result = await jsonRequest<{ round: number }>(
          `${baseUrl}/api/timer/start`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ round }),
          },
        );
        assert.equal(result.response.status, 200);
      };

      await startRound(1);
      const round1Answers = Object.fromEntries(
        Object.entries(round1AnswerKeys).map(([questionId, answer]) => [
          questionId,
          answer.accepted[0],
        ]),
      );
      const round1 = await jsonRequest<{
        score: number;
        isQualified: boolean;
        participant: Participant;
      }>(`${baseUrl}/api/round1/submit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ answers: round1Answers }),
      });
      assert.equal(round1.response.status, 200);
      assert.equal(
        round1.data.score,
        round1Questions.reduce((total, question) => total + question.points, 0),
      );
      assert.equal(round1.data.isQualified, true);
      assert.equal(round1.data.participant.currentRound, 2);
      const repeatedRound1 = await fetch(`${baseUrl}/api/round1/submit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ answers: round1Answers }),
      });
      assert.equal(repeatedRound1.status, 409);

      await startRound(2);
      const round2Challenge = await jsonRequest<{
        problems: Array<{ problemId: string; traceCode: string }>;
      }>(`${baseUrl}/api/round2/problems`, { headers: authHeaders });
      assert.equal(round2Challenge.response.status, 200);
      assert.equal(round2Challenge.data.problems.length, 3);
      assert.ok(round2Challenge.data.problems.every(problem => problem.traceCode.length > 0));
      assert.ok(round2Challenge.data.problems.every(problem => !("sampleOutput" in problem)));
      const round2 = await jsonRequest<{
        score: number;
        isQualified: boolean;
        participant: Participant;
      }>(`${baseUrl}/api/round2/submit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          answers: Object.fromEntries(
            Object.entries(round2AnswerKeys).map(([problemId, answers]) => [
              problemId,
              answers[0],
            ]),
          ),
        }),
      });
      assert.equal(round2.response.status, 200);
      assert.equal(round2.data.isQualified, true);
      assert.equal(round2.data.participant.currentRound, 3);

      await startRound(3);
      const round3Answers = Object.fromEntries(
        Object.entries(round3AnswerKeys).map(([problemId, problem]) => [
          problemId,
          Object.fromEntries(
            problem.blanks.map((blank) => [blank.id, blank.accepted[0]]),
          ),
        ]),
      );
      const round3 = await jsonRequest<{
        score: number;
        isQualified: boolean;
        participant: Participant;
      }>(`${baseUrl}/api/round3/submit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ answers: round3Answers }),
      });
      assert.equal(round3.response.status, 200);
      assert.equal(round3.data.isQualified, true);
      assert.equal(round3.data.participant.currentRound, 4);

      await startRound(4);
      const round4Challenge = await jsonRequest<{
        problems: Array<{ problemId: string; answerPrompt: string }>;
      }>(`${baseUrl}/api/round4/challenge`, { headers: authHeaders });
      assert.equal(round4Challenge.response.status, 200);
      assert.equal(round4Challenge.data.problems.length, 1);
      assert.ok(round4Challenge.data.problems[0].answerPrompt);
      assert.equal("rubric" in round4Challenge.data.problems[0], false);
      const [problemId] = Object.keys(round4AnswerRubrics);
      const incompleteAnswer = await jsonRequest<{ success: boolean }>(
        `${baseUrl}/api/round4/verify-problem`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ problemId, answer: "I look for repeated characters with a window." }),
        },
      );
      assert.equal(incompleteAnswer.response.status, 200);
      assert.equal(incompleteAnswer.data.success, false);

      const lastVerified = await jsonRequest<{
        success: boolean;
        allProblemsSolved: boolean;
        marksEarned: number;
        participant: Participant;
      }>(`${baseUrl}/api/round4/verify-problem`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          problemId,
          answer: "Use a sliding window with left and right pointers. Keep a dictionary of each character's last seen index. If a repeated character is inside the window, move the left boundary to one after its prior index. Update the maximum length on each step. Each character is processed once, so this is O(n) linear time.",
        }),
      });
      assert.equal(lastVerified.response.status, 200);
      assert.equal(lastVerified.data.success, true);
      assert.equal(lastVerified.data.allProblemsSolved, true);
      assert.equal(lastVerified.data.marksEarned, 15);
      assert.equal(lastVerified.data.participant.currentRound, 5);
      assert.equal(lastVerified.data.participant.round4Score, 15);

      const forbiddenAdmin = await fetch(`${baseUrl}/api/admin/data`);
      assert.equal(forbiddenAdmin.status, 401);

      await stopServer(child);
      child = startServer(port, stateFile);
      await waitForApi(baseUrl, child);
      const afterRestart = await jsonRequest<{
        participant: Participant;
      }>(`${baseUrl}/api/session`, {
        headers: { cookie: cookie! },
      });
      assert.equal(afterRestart.response.status, 200);
      assert.equal(afterRestart.data.participant.currentRound, 5);
      assert.equal(afterRestart.data.participant.totalScore, 105);

      const storedState = JSON.parse(await readFile(stateFile, "utf-8")) as {
        participants: Participant[];
      };
      assert.ok(
        storedState.participants.some(
          (participant) => participant.participantId === participantId,
        ),
      );
    } finally {
      await stopServer(child);
      await rm(directory, { recursive: true, force: true });
    }
  },
);
