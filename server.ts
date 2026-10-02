import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { createHash, randomBytes, randomUUID } from "crypto";
import {
  initialSlots,
  initialEventConfig,
  round1Questions,
  round2Problems,
  round3Problems,
  round4Problems,
  round4Config,
  initialParticipants,
} from "./src/data/competitionData.ts";
import type { Participant, Slot, EventConfig } from "./src/types.ts";
import { isAcceptedAnswer } from "./server/answerChecking.ts";
import {
  round1AnswerKeys,
  round2AnswerKeys,
  round3AnswerKeys,
  round4AnswerKeys,
} from "./server/answerKeys.ts";

const app = express();
const DEFAULT_PORT = 3000;
const PORT = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(
    `Invalid PORT value "${process.env.PORT}". Set PORT to a number between 1 and 65535.`,
  );
}

app.use(express.json({ limit: "64kb" }));

// In-Memory Database with optional file backup
const DB_FILE = path.resolve(
  process.env.DB_FILE || path.join(process.cwd(), "db_state.json"),
);
const SESSION_COOKIE = "codeforce_participant_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const REGISTRATION_KEYS = new Set([
  "slots",
  "eventConfig",
  "r4Config",
  "participants",
  "round4Sessions",
  "credentials",
  "participantSessions",
  "accessCodeHashes",
  "registrationKeys",
  "attempts",
]);

let slots: Slot[] = [...initialSlots];
let eventConfig: EventConfig = { ...initialEventConfig };
let r4Config = { ...round4Config };
let participants: Participant[] = [...initialParticipants];
let adminTokens = new Set<string>();
let credentials: Record<string, string> = {};
let participantSessions = new Map<
  string,
  { participantId: string; expiresAt: number }
>();
let accessCodeHashes: Record<string, string> = {};
let registrationKeys = new Set<string>();
type AttemptTimer = {
  startedAt: string;
  endsAt: string | null;
  durationSeconds: number;
  status?: "in_progress" | "completed";
};
type ParticipantAttempts = {
  rounds: Partial<Record<1 | 2 | 3 | 4, AttemptTimer>>;
};
let attempts: Record<string, ParticipantAttempts> = {};
let preservedState: Record<string, unknown> = {};
let lastPersistedState: Record<string, unknown> | undefined;
let round4Sessions: Record<
  string,
  {
    p1Verified: boolean;
    p2Verified: boolean;
    p3Verified: boolean;
  }
> = {
  "TEST-001": { p1Verified: false, p2Verified: false, p3Verified: false },
};

function normalizeIdentityPart(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

function registrationKey(college: string, rollNumber: string): string {
  return `${normalizeIdentityPart(college)}\u0000${normalizeIdentityPart(rollNumber)}`;
}

function participantIdentityKey(name: string, college: string): string {
  return `${normalizeIdentityPart(college)}\u0000${normalizeIdentityPart(name)}`;
}

function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function applyPersistedState(data: Record<string, unknown>): void {
  if (Array.isArray(data.slots)) slots = data.slots as Slot[];
  if (data.eventConfig && typeof data.eventConfig === "object")
    eventConfig = data.eventConfig as EventConfig;
  if (data.r4Config && typeof data.r4Config === "object")
    r4Config = data.r4Config as typeof r4Config;
  if (Array.isArray(data.participants)) {
    participants = (data.participants as Participant[]).map((participant) => ({
      ...participant,
      phone: participant.phone || "",
      round1CorrectCount: participant.round1CorrectCount || 0,
      round2SolvedCount: participant.round2SolvedCount || 0,
      round3SolvedCount: participant.round3SolvedCount || 0,
    }));
  }
  if (data.round4Sessions && typeof data.round4Sessions === "object") {
    round4Sessions = data.round4Sessions as typeof round4Sessions;
  }
  if (data.credentials && typeof data.credentials === "object") {
    credentials = data.credentials as Record<string, string>;
  }
  if (data.accessCodeHashes && typeof data.accessCodeHashes === "object") {
    accessCodeHashes = data.accessCodeHashes as Record<string, string>;
  }
  if (data.registrationKeys && Array.isArray(data.registrationKeys)) {
    registrationKeys = new Set(
      data.registrationKeys.filter(
        (key): key is string => typeof key === "string",
      ),
    );
  }
  if (data.attempts && typeof data.attempts === "object") {
    attempts = data.attempts as Record<string, ParticipantAttempts>;
  }
  if (
    data.participantSessions &&
    typeof data.participantSessions === "object"
  ) {
    const storedSessions = data.participantSessions as Record<
      string,
      { participantId: string; expiresAt: number }
    >;
    participantSessions = new Map(
      Object.entries(storedSessions).filter(
        ([, session]) =>
          session &&
          typeof session.participantId === "string" &&
          Number.isFinite(session.expiresAt),
      ),
    );
  }

  for (const participant of participants) {
    registrationKeys.add(
      registrationKey(participant.college || "", participant.rollNumber || ""),
    );
  }
}

function currentPersistedState(): Record<string, unknown> {
  return {
    ...preservedState,
    slots,
    eventConfig,
    r4Config,
    participants,
    round4Sessions,
    credentials,
    participantSessions: Object.fromEntries(participantSessions),
    accessCodeHashes,
    registrationKeys: [...registrationKeys],
    attempts,
  };
}

function clonePersistedState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
}

function restoreLastPersistedState(): void {
  if (lastPersistedState)
    applyPersistedState(clonePersistedState(lastPersistedState));
}

// Load existing persisted state without replacing it with seed data.
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("db_state.json must contain a JSON object.");
    }
    const loadedState = data as Record<string, unknown>;
    preservedState = Object.fromEntries(
      Object.entries(loadedState).filter(
        ([key]) => !REGISTRATION_KEYS.has(key),
      ),
    );
    applyPersistedState(loadedState);
    lastPersistedState = clonePersistedState(currentPersistedState());
  } catch (err) {
    throw new Error(
      "Failed to load db_state.json; the existing file was left untouched.",
      { cause: err },
    );
  }
}
if (!lastPersistedState)
  lastPersistedState = clonePersistedState(currentPersistedState());

function saveDB() {
  if (fs.existsSync(DB_FILE) && !lastPersistedState) {
    throw new Error(
      "Cannot persist state because the existing db_state.json was not loaded.",
    );
  }
  const data = currentPersistedState();
  const temporaryFile = `${DB_FILE}.${process.pid}.${randomUUID()}.tmp`;
  let fileDescriptor: number | undefined;
  try {
    fileDescriptor = fs.openSync(temporaryFile, "wx", 0o600);
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(fileDescriptor, serialized, "utf-8");
    fs.fsyncSync(fileDescriptor);
    fs.closeSync(fileDescriptor);
    fileDescriptor = undefined;
    fs.renameSync(temporaryFile, DB_FILE);
    lastPersistedState = clonePersistedState(data);
  } catch (err) {
    if (fileDescriptor !== undefined) {
      try {
        fs.closeSync(fileDescriptor);
      } catch (closeError) {
        console.error("Failed to close temporary state file:", closeError);
      }
    }
    if (fs.existsSync(temporaryFile)) {
      try {
        fs.unlinkSync(temporaryFile);
      } catch (cleanupError) {
        console.error("Failed to remove temporary state file:", cleanupError);
      }
    }
    restoreLastPersistedState();
    throw err;
  }
}

// Admin Token Middleware
function checkAdminAuth(req: Request): boolean {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return adminTokens.has(token);
}

function getParticipant(req: Request, res: Response): Participant | undefined {
  const authorization = req.headers.authorization
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const cookieToken = req.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const token = authorization || cookieToken;
  const session = token
    ? participantSessions.get(hashSecret(token))
    : undefined;
  if (session && session.expiresAt <= Date.now()) {
    participantSessions.delete(hashSecret(token!));
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
    res
      .status(401)
      .json({
        error: "Participant session expired. Sign in with your recovery ID.",
      });
    return undefined;
  }
  const participantId = session?.participantId;
  const requestedId =
    req.body?.participantId || req.params.id || req.params.participantId;
  if (!participantId || (requestedId && requestedId !== participantId)) {
    res.status(401).json({ error: "Participant authentication required." });
    return undefined;
  }
  const participant = participants.find(
    (p) => p.participantId === participantId,
  );
  if (!participant) {
    res.status(401).json({ error: "Participant session is no longer valid." });
    return undefined;
  }
  return participant;
}

function setParticipantCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

function createParticipantSession(participantId: string): string {
  const token = randomBytes(32).toString("base64url");
  participantSessions.set(hashSecret(token), {
    participantId,
    expiresAt: Date.now() + SESSION_MAX_AGE_MS,
  });
  return token;
}

function roundStatus(
  participant: Participant,
  round: 1 | 2 | 3 | 4,
): Participant["round1Status"] {
  return participant[`round${round}Status`];
}

function setRoundStatus(
  participant: Participant,
  round: 1 | 2 | 3 | 4,
  status: Participant["round1Status"],
): void {
  if (round === 1) participant.round1Status = status;
  else if (round === 2) participant.round2Status = status;
  else if (round === 3) participant.round3Status = status;
  else participant.round4Status = status;
}

function canStartRound(
  participant: Participant,
  round: 1 | 2 | 3 | 4,
): boolean {
  if (participant.status === "disqualified") return false;
  if (round === 1) return true;
  if (round === 2) {
    return (
      participant.round1Status === "completed" &&
      participant.round1Score >= eventConfig.round1MinScore
    );
  }
  if (round === 3) {
    return (
      participant.round2Status === "completed" &&
      participant.round2SolvedCount === round2Problems.length
    );
  }
  return (
    participant.round3Status === "completed" &&
    participant.round3Score >=
      Math.round((30 * eventConfig.round3MinPercent) / 100) &&
    participant.round3SolvedCount >= 2
  );
}

function slotWindow(
  slot: Slot,
): { startsAt: number; endsAt: number } | undefined {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(slot.date) ||
    !/^\d{2}:\d{2}$/.test(slot.startTime) ||
    !/^\d{2}:\d{2}$/.test(slot.endTime)
  ) {
    return undefined;
  }
  const startsAt = Date.parse(`${slot.date}T${slot.startTime}:00+05:30`);
  const endsAt = Date.parse(`${slot.date}T${slot.endTime}:00+05:30`);
  return Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    endsAt > startsAt
    ? { startsAt, endsAt }
    : undefined;
}

function slotStatus(slot: Slot, now = Date.now()): Slot["computedStatus"] {
  if (slot.isActiveOverride || eventConfig.testMode) return "active";
  const window = slotWindow(slot);
  if (!window || now < window.startsAt) return "upcoming";
  return now <= window.endsAt ? "active" : "completed";
}

function isSlotActiveForParticipant(
  participant: Participant,
  now = Date.now(),
): boolean {
  const slot = slots.find(
    (candidate) => candidate.slotId === participant.slotId,
  );
  return Boolean(slot && slotStatus(slot, now) === "active");
}

function getRoundDurationSeconds(round: 1 | 2 | 3 | 4): number {
  if (round === 4) return 0;
  const minutes =
    round === 1
      ? 20
      : round === 2
        ? eventConfig.round2TimerMinutes
        : eventConfig.round3TimerMinutes;
  return Math.max(1, Math.min(180, Number(minutes) || 20)) * 60;
}

function secondsTaken(
  participant: Participant,
  round: 1 | 2 | 3 | 4,
  now = Date.now(),
): number | undefined {
  const timer = attempts[participant.participantId]?.rounds[round];
  if (!timer) return undefined;
  const elapsed = Math.max(
    1,
    Math.floor((now - new Date(timer.startedAt).getTime()) / 1000),
  );
  return timer.endsAt ? Math.min(timer.durationSeconds, elapsed) : elapsed;
}

const SUBMISSION_NETWORK_GRACE_MS = 5000;

function isAttemptPastDeadline(
  participant: Participant,
  round: 1 | 2 | 3 | 4,
  graceMs = 0,
  now = Date.now(),
): boolean {
  const timer = attempts[participant.participantId]?.rounds[round];
  return Boolean(
    timer?.endsAt && now > new Date(timer.endsAt).getTime() + graceMs,
  );
}

function completeExpiredRound(
  participant: Participant,
  round: 1 | 2 | 3,
): void {
  const timer = attempts[participant.participantId]?.rounds[round];
  if (!timer)
    throw new Error(`Cannot expire round ${round} without a server timer.`);
  timer.status = "completed";
  setRoundStatus(participant, round, "completed");
  if (round === 1) {
    participant.round1Score = 0;
    participant.round1CorrectCount = 0;
    participant.round1TimeSeconds = timer.durationSeconds;
  } else if (round === 2) {
    participant.round2Score = 0;
    participant.round2SolvedCount = 0;
    participant.round2TimeSeconds = timer.durationSeconds;
  } else {
    participant.round3Score = 0;
    participant.round3SolvedCount = 0;
    participant.round3TimeSeconds = timer.durationSeconds;
  }
  participant.totalScore =
    participant.round1Score +
    participant.round2Score +
    participant.round3Score +
    participant.round4Score;
  participant.totalTimeSeconds =
    participant.round1TimeSeconds +
    participant.round2TimeSeconds +
    participant.round3TimeSeconds +
    participant.round4TimeSeconds;
  saveDB();
}

// API Routes

// 1. GET /api/state
app.get("/api/state", (req: Request, res: Response) => {
  const now = new Date();
  res.json({
    serverTime: now.toISOString(),
    slots: slots.map((slot) => ({
      ...slot,
      computedStatus: slotStatus(slot, now.getTime()),
    })),
    eventConfig,
    eventDate: "2026-10-05",
    timezone: "Asia/Kolkata",
    timezoneLabel: "IST (UTC+05:30)",
    leaderboardPublished: eventConfig.leaderboardPublished,
  });
});

// 2. POST /api/register
app.post("/api/register", (req: Request, res: Response) => {
  const { name, college, rollNumber } = req.body ?? {};
  if (
    ![name, college, rollNumber].every((value) => typeof value === "string")
  ) {
    return res
      .status(400)
      .json({
        error: "Full name, college name, and college roll number are required.",
      });
  }
  const cleanName = name.normalize("NFKC").trim().replace(/\s+/g, " ");
  const cleanCollege = college.normalize("NFKC").trim().replace(/\s+/g, " ");
  const cleanRollNumber = rollNumber
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  if (!cleanName || !cleanCollege || !cleanRollNumber) {
    return res
      .status(400)
      .json({
        error:
          "Full name, college name, and college roll number cannot be blank.",
      });
  }
  if (
    cleanName.length > 100 ||
    cleanCollege.length > 160 ||
    cleanRollNumber.length > 64
  ) {
    return res
      .status(400)
      .json({ error: "Registration fields exceed the allowed length." });
  }

  const key = registrationKey(cleanCollege, cleanRollNumber);
  if (
    registrationKeys.has(key) ||
    participants.some(
      (p) => registrationKey(p.college || "", p.rollNumber || "") === key,
    )
  ) {
    return res
      .status(409)
      .json({
        error: "This college roll number already has a competition attempt.",
      });
  }
  const identityKey = participantIdentityKey(cleanName, cleanCollege);
  if (
    participants.some(
      (p) =>
        participantIdentityKey(p.name || "", p.college || "") === identityKey,
    )
  ) {
    return res
      .status(409)
      .json({
        error: "This name and college already have a competition attempt.",
      });
  }

  const slot = slots.find(
    (candidate) => candidate.registeredCount < candidate.maxParticipants,
  );
  if (!slot)
    return res.status(409).json({ error: "All competition slots are full." });

  const participantId = `CFA-${randomUUID().toUpperCase()}`;
  const participantCode = `CFA-${randomBytes(16).toString("hex").toUpperCase()}`;
  const newCadet: Participant = {
    participantId,
    name: cleanName,
    rollNumber: cleanRollNumber,
    college: cleanCollege,
    branch: "",
    year: "",
    email: "",
    phone: "",
    slotId: slot.slotId,
    registrationTime: new Date().toISOString(),
    currentRound: 1,
    status: "registered",
    integrityViolations: 0,
    round1Status: "not_started",
    round1Score: 0,
    round1CorrectCount: 0,
    round1TimeSeconds: 0,
    round2Status: "not_started",
    round2Score: 0,
    round2SolvedCount: 0,
    round2TimeSeconds: 0,
    round3Status: "not_started",
    round3Score: 0,
    round3SolvedCount: 0,
    round3TimeSeconds: 0,
    round4Status: "not_started",
    round4Score: 0,
    round4TimeSeconds: 0,
    round4SolvedKey: "",
    totalScore: 0,
    totalTimeSeconds: 0,
  };

  participants.push(newCadet);
  registrationKeys.add(key);
  accessCodeHashes[hashSecret(participantCode)] = participantId;
  round4Sessions[participantId] = {
    p1Verified: false,
    p2Verified: false,
    p3Verified: false,
  };
  attempts[participantId] = { rounds: {} };
  const sessionToken = createParticipantSession(participantId);

  slot.registeredCount += 1;

  saveDB();
  setParticipantCookie(res, sessionToken);
  res.json({ success: true, participant: newCadet, participantCode });
});

// 3. POST /api/login
app.post("/api/login", (req: Request, res: Response) => {
  const { participantCode } = req.body ?? {};
  if (typeof participantCode !== "string" || !participantCode.trim()) {
    return res
      .status(400)
      .json({ error: "Your participant recovery ID is required." });
  }

  const participantId =
    accessCodeHashes[hashSecret(participantCode.trim().toUpperCase())];
  const cadet = participantId
    ? participants.find((p) => p.participantId === participantId)
    : undefined;
  if (!cadet) {
    return res.status(401).json({ error: "Invalid participant recovery ID." });
  }

  const token = createParticipantSession(cadet.participantId);
  saveDB();
  setParticipantCookie(res, token);
  res.json({ success: true, participant: cadet });
});

// 4. GET /api/participant/:id
app.get("/api/participant/:id", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  if (cadet.participantId !== req.params.id)
    return res.status(403).json({ error: "Participant access denied." });
  res.json({ success: true, participant: cadet });
});

app.get("/api/session", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  res.json({ success: true, participant: cadet });
});

app.post("/api/logout", (req: Request, res: Response) => {
  const cookieToken = req.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, "").trim() || cookieToken;
  if (token) participantSessions.delete(hashSecret(token));
  saveDB();
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });
  res.json({ success: true });
});

// 5. POST /api/timer/start
app.post("/api/timer/start", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  const round = req.body?.round;
  if (![1, 2, 3, 4].includes(round))
    return res.status(400).json({ error: "A valid round number is required." });
  const roundNumber = round as 1 | 2 | 3 | 4;
  if (cadet.status === "disqualified") {
    return res
      .status(403)
      .json({ error: "You have not qualified for this round." });
  }

  const existingTimer = attempts[cadet.participantId]?.rounds[roundNumber];
  if (existingTimer) {
    return res.json({
      round: roundNumber,
      startedAt: existingTimer.startedAt,
      endsAt: existingTimer.endsAt,
      durationSeconds: existingTimer.durationSeconds,
      status: existingTimer.status || roundStatus(cadet, roundNumber),
      remainingSeconds: existingTimer.endsAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(existingTimer.endsAt).getTime() - Date.now()) / 1000,
            ),
          )
        : null,
    });
  }
  if (!canStartRound(cadet, roundNumber)) {
    return res
      .status(403)
      .json({ error: "You have not qualified for this round." });
  }
  if (roundNumber === 1 && !isSlotActiveForParticipant(cadet)) {
    return res
      .status(403)
      .json({ error: "Your competition slot is not active yet." });
  }
  if (roundStatus(cadet, roundNumber) === "completed") {
    return res.json({
      round: roundNumber,
      completed: true,
      remainingSeconds: 0,
    });
  }

  const durationSeconds = getRoundDurationSeconds(roundNumber);
  const startedAt = new Date().toISOString();
  const endsAt = durationSeconds
    ? new Date(Date.now() + durationSeconds * 1000).toISOString()
    : null;
  attempts[cadet.participantId] ??= { rounds: {} };
  attempts[cadet.participantId].rounds[roundNumber] = {
    startedAt,
    endsAt,
    durationSeconds,
    status: "in_progress",
  };
  setRoundStatus(cadet, roundNumber, "in_progress");
  if (cadet.status === "registered") cadet.status = "active";
  saveDB();

  res.json({
    round: roundNumber,
    startedAt,
    endsAt,
    durationSeconds,
    remainingSeconds: durationSeconds || null,
  });
});

// 6. POST /api/integrity/violation
app.post("/api/integrity/violation", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  const { reason } = req.body ?? {};
  if (typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({ error: "A violation reason is required." });
  }

  cadet.integrityViolations = (cadet.integrityViolations || 0) + 1;
  const shouldForceSubmit = cadet.integrityViolations === 3;
  saveDB();
  res.json({
    success: true,
    violationCount: cadet.integrityViolations,
    isDisqualified: false,
    shouldForceSubmit,
    reason,
  });
});

// 7. GET /api/questions/round1
app.get("/api/questions/round1", (req: Request, res: Response) => {
  // Strip correct answers from public payload
  const publicQuestions = round1Questions.map((q) => {
    const { correctAnswer, correctOrder, ...rest } = q;
    return rest;
  });
  res.json({
    questions: publicQuestions,
    totalQuestions: publicQuestions.length,
    totalMarks: 30,
    passingScore: eventConfig.round1MinScore,
    durationMinutes: 20,
  });
});

// 8. POST /api/round1/submit
app.post("/api/round1/submit", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  if (cadet.round1Status === "completed")
    return res
      .status(409)
      .json({ error: "Round 1 has already been submitted." });
  if (cadet.status === "disqualified")
    return res
      .status(403)
      .json({ error: "Disqualified participants cannot submit." });
  if (
    !req.body?.answers ||
    typeof req.body.answers !== "object" ||
    Array.isArray(req.body.answers)
  ) {
    return res.status(400).json({ error: "Round 1 answers are required." });
  }
  const timeTakenSeconds = secondsTaken(cadet, 1);
  if (timeTakenSeconds === undefined)
    return res.status(409).json({ error: "Start Round 1 before submitting." });
  if (isAttemptPastDeadline(cadet, 1, SUBMISSION_NETWORK_GRACE_MS)) {
    completeExpiredRound(cadet, 1);
    return res.status(409).json({
      error:
        "Round 1 time expired before your submission arrived. The attempt was closed with no marks.",
      participant: cadet,
    });
  }
  const { answers } = req.body;

  let totalScore = 0;
  let correctCount = 0;
  const breakdown: Record<
    string,
    { earned: number; possible: number; correct: boolean }
  > = {};

  round1Questions.forEach((q) => {
    const userAnswer = answers ? answers[q.questionId] : undefined;
    const answerKey = round1AnswerKeys[q.questionId];
    const isCorrect = answerKey
      ? isAcceptedAnswer(userAnswer, answerKey.accepted, answerKey.mode)
      : false;

    const earned = isCorrect ? q.points : 0;
    if (isCorrect) correctCount += 1;
    totalScore += earned;
    breakdown[q.questionId] = {
      earned,
      possible: q.points,
      correct: isCorrect,
    };
  });

  const isQualified = totalScore >= eventConfig.round1MinScore;

  cadet.round1Status = "completed";
  attempts[cadet.participantId].rounds[1]!.status = "completed";
  cadet.round1Score = totalScore;
  cadet.round1CorrectCount = correctCount;
  cadet.round1TimeSeconds = timeTakenSeconds;
  cadet.totalScore =
    cadet.round1Score +
    cadet.round2Score +
    cadet.round3Score +
    cadet.round4Score;
  cadet.totalTimeSeconds =
    cadet.round1TimeSeconds +
    cadet.round2TimeSeconds +
    cadet.round3TimeSeconds +
    cadet.round4TimeSeconds;

  if (isQualified && cadet.currentRound < 2) {
    cadet.currentRound = 2;
  }

  saveDB();
  res.json({
    success: true,
    score: totalScore,
    correctCount,
    totalQuestions: round1Questions.length,
    totalPossible: 30,
    isQualified,
    passingScore: eventConfig.round1MinScore,
    breakdown,
    participant: cadet,
  });
});

// 9. GET /api/round2/problems
app.get("/api/round2/problems", (req: Request, res: Response) => {
  const problems = round2Problems.map(problem => ({
    problemId: problem.problemId,
    title: problem.title,
    difficulty: problem.difficulty,
    description: problem.description,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    sampleInput: problem.sampleInput,
    points: problem.points,
    timeLimitMinutes: problem.timeLimitMinutes,
  }));
  res.json({
    problems,
    durationMinutes: eventConfig.round2TimerMinutes,
    requiredProblems: round2Problems.length,
  });
});

// 11. POST /api/round2/submit
app.post("/api/round2/submit", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  if (
    cadet.round1Status !== "completed" ||
    cadet.round1Score < eventConfig.round1MinScore
  )
    return res.status(403).json({ error: "Qualify in Round 1 first." });
  if (cadet.round2Status === "completed")
    return res
      .status(409)
      .json({ error: "Round 2 has already been submitted." });
  if (
    !req.body?.answers ||
    typeof req.body.answers !== "object" ||
    Array.isArray(req.body.answers)
  ) {
    return res.status(400).json({ error: "Round 2 answers are required." });
  }
  const timeTakenSeconds = secondsTaken(cadet, 2);
  if (timeTakenSeconds === undefined)
    return res.status(409).json({ error: "Start Round 2 before submitting." });
  if (isAttemptPastDeadline(cadet, 2, SUBMISSION_NETWORK_GRACE_MS)) {
    completeExpiredRound(cadet, 2);
    return res.status(409).json({
      error:
        "Round 2 time expired before your submission arrived. The attempt was closed with no marks.",
      participant: cadet,
    });
  }
  const { answers } = req.body;
  let totalScore = 0;
  let solvedCount = 0;
  const breakdown: Record<
    string,
    { score: number; correct: boolean }
  > = {};
  for (const problem of round2Problems) {
    const correct = isAcceptedAnswer(
      answers[problem.problemId],
      round2AnswerKeys[problem.problemId] ?? [],
      'output',
    );
    const score = correct ? problem.points : 0;
    totalScore += score;
    if (correct) solvedCount += 1;
    breakdown[problem.problemId] = { score, correct };
  }

  const isQualified = solvedCount === round2Problems.length;

  cadet.round2Status = "completed";
  attempts[cadet.participantId].rounds[2]!.status = "completed";
  cadet.round2Score = totalScore;
  cadet.round2SolvedCount = solvedCount;
  cadet.round2TimeSeconds = timeTakenSeconds;
  cadet.totalScore =
    cadet.round1Score +
    cadet.round2Score +
    cadet.round3Score +
    cadet.round4Score;
  cadet.totalTimeSeconds =
    cadet.round1TimeSeconds +
    cadet.round2TimeSeconds +
    cadet.round3TimeSeconds +
    cadet.round4TimeSeconds;

  if (isQualified && cadet.currentRound < 3) {
    cadet.currentRound = 3;
  }

  saveDB();
  res.json({
    success: true,
    score: totalScore,
    totalPossible: 30,
    solvedCount,
    requiredSolved: round2Problems.length,
    isQualified,
    passingScore: round2Problems.length,
    breakdown,
    participant: cadet,
  });
});

// 12. GET /api/round3/problems
app.get("/api/round3/problems", (req: Request, res: Response) => {
  const problems = round3Problems.map(problem => ({
    problemId: problem.problemId,
    title: problem.title,
    difficulty: problem.difficulty,
    description: problem.description,
    points: problem.points,
    blanks: round3AnswerKeys[problem.problemId]?.blanks.map(({ id, prompt }) => ({ id, prompt })) ?? [],
  }));
  res.json({
    problems,
    durationMinutes: eventConfig.round3TimerMinutes,
    passingScore: Math.round((30 * eventConfig.round3MinPercent) / 100),
    passingProblems: 2,
  });
});

// 14. POST /api/round3/submit
app.post("/api/round3/submit", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  if (
    cadet.round2Status !== "completed" ||
    cadet.round2SolvedCount !== round2Problems.length
  )
    return res
      .status(403)
      .json({
        error: "Answer all three Round 2 questions correctly first.",
      });
  if (cadet.round3Status === "completed")
    return res
      .status(409)
      .json({ error: "Round 3 has already been submitted." });
  if (
    !req.body?.answers ||
    typeof req.body.answers !== "object" ||
    Array.isArray(req.body.answers)
  ) {
    return res.status(400).json({ error: "Round 3 answers are required." });
  }
  const timeTakenSeconds = secondsTaken(cadet, 3);
  if (timeTakenSeconds === undefined)
    return res.status(409).json({ error: "Start Round 3 before submitting." });
  if (isAttemptPastDeadline(cadet, 3, SUBMISSION_NETWORK_GRACE_MS)) {
    completeExpiredRound(cadet, 3);
    return res.status(409).json({
      error:
        "Round 3 time expired before your submission arrived. The attempt was closed with no marks.",
      participant: cadet,
    });
  }
  const { answers } = req.body;
  let totalScore = 0;
  let solvedCount = 0;
  const breakdown: Record<
    string,
    {
      correct: number;
      total: number;
      score: number;
      solved: boolean;
    }
  > = {};

  for (const problem of round3Problems) {
    const blanks = round3AnswerKeys[problem.problemId]?.blanks ?? [];
    const submittedAnswers = answers[problem.problemId];
    let correct = 0;
    for (const blank of blanks) {
      const answer = submittedAnswers && typeof submittedAnswers === 'object' && !Array.isArray(submittedAnswers)
        ? (submittedAnswers as Record<string, unknown>)[blank.id]
        : undefined;
      if (isAcceptedAnswer(answer, blank.accepted, 'code-fragment')) correct += 1;
    }
    const solved = blanks.length > 0 && correct === blanks.length;
    const score = blanks.length > 0 ? Math.round(problem.points * correct / blanks.length) : 0;
    totalScore += score;
    if (solved) solvedCount += 1;
    breakdown[problem.problemId] = { correct, total: blanks.length, score, solved };
  }

  const passingScore = Math.round((30 * eventConfig.round3MinPercent) / 100);
  const isQualified = totalScore >= passingScore && solvedCount >= 2;

  cadet.round3Status = "completed";
  attempts[cadet.participantId].rounds[3]!.status = "completed";
  cadet.round3Score = totalScore;
  cadet.round3SolvedCount = solvedCount;
  cadet.round3TimeSeconds = timeTakenSeconds;
  cadet.totalScore =
    cadet.round1Score +
    cadet.round2Score +
    cadet.round3Score +
    cadet.round4Score;
  cadet.totalTimeSeconds =
    cadet.round1TimeSeconds +
    cadet.round2TimeSeconds +
    cadet.round3TimeSeconds +
    cadet.round4TimeSeconds;

  if (isQualified && cadet.currentRound < 4) {
    cadet.currentRound = 4;
  }

  saveDB();
  res.json({
    success: true,
    score: totalScore,
    totalPossible: 30,
    solvedCount,
    requiredSolved: 2,
    isQualified,
    passingScore,
    breakdown,
    participant: cadet,
  });
});

// 15. GET /api/round4/challenge
app.get("/api/round4/challenge", (req: Request, res: Response) => {
  res.json({
    problems: round4Problems.map(problem => ({
      problemId: problem.problemId,
      title: problem.title,
      difficulty: problem.difficulty,
      description: problem.description.replace(/\n\nExpected Output:\n[^\n]+/g, ''),
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      sampleInput: problem.sampleInput,
      points: problem.points,
    })),
    transformationRuleText: null,
  });
});

// 16. GET /api/round4/session/:participantId
app.get("/api/round4/session/:participantId", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  if (cadet.participantId !== req.params.participantId)
    return res.status(403).json({ error: "Participant access denied." });
  const sess = round4Sessions[req.params.participantId] || {
    p1Verified: false,
    p2Verified: false,
    p3Verified: false,
  };
  const solvedCount = [
    sess.p1Verified,
    sess.p2Verified,
    sess.p3Verified,
  ].filter(Boolean).length;
  const enoughProblemsSolved = solvedCount >= 2;

  res.json({
    p1Verified: sess.p1Verified,
    p1Output: sess.p1Verified ? Number(round4AnswerKeys['r4-p1'][0]) : null,
    p1Marks: sess.p1Verified ? 5 : 0,
    p2Verified: sess.p2Verified,
    p2Output: sess.p2Verified ? Number(round4AnswerKeys['r4-p2'][0]) : null,
    p2Marks: sess.p2Verified ? 5 : 0,
    p3Verified: sess.p3Verified,
    p3Output: sess.p3Verified ? Number(round4AnswerKeys['r4-p3'][0]) : null,
    p3Marks: sess.p3Verified ? 5 : 0,
    allProblemsSolved: enoughProblemsSolved,
    solvedCount,
    transformationRule: enoughProblemsSolved
      ? r4Config.transformationRuleText
      : null,
  });
});

// 18. POST /api/round4/verify-problem
app.post("/api/round4/verify-problem", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  if (cadet.round3Status !== "completed" || cadet.round3SolvedCount < 2)
    return res.status(403).json({ error: "Qualify in Round 3 first." });
  if (cadet.round4Status === "completed")
    return res.status(409).json({ error: "Round 4 has already been completed." });
  const { problemId, answer } = req.body ?? {};
  const problem = round4Problems.find((p) => p.problemId === problemId);
  if (!problem) return res.status(404).json({ error: "Problem not found" });

  if (typeof answer !== "string" || answer.length > 2000) {
    return res.status(400).json({ error: "Provide an answer no longer than 2,000 characters." });
  }
  const timer = attempts[cadet.participantId]?.rounds[4];
  if (!timer) {
    return res
      .status(409)
      .json({ error: "Start Round 4 before verifying programs." });
  }
  if (isAttemptPastDeadline(cadet, 4, SUBMISSION_NETWORK_GRACE_MS)) {
    return res.status(409).json({ error: "Round 4 time has expired." });
  }
  if (!isAcceptedAnswer(answer, round4AnswerKeys[problem.problemId] ?? [], 'output')) {
    return res.json({ success: false, message: "That output is not correct for the provided input." });
  }

  if (!round4Sessions[cadet.participantId]) {
    round4Sessions[cadet.participantId] = {
      p1Verified: false,
      p2Verified: false,
      p3Verified: false,
    };
  }
  const sess = round4Sessions[cadet.participantId];

  if (problemId === "r4-p1") sess.p1Verified = true;
  if (problemId === "r4-p2") sess.p2Verified = true;
  if (problemId === "r4-p3") sess.p3Verified = true;

  const solvedCount = [
    sess.p1Verified,
    sess.p2Verified,
    sess.p3Verified,
  ].filter(Boolean).length;
  const enoughSolved = solvedCount >= 2;
  saveDB();

  res.json({
    success: true,
    verifiedOutput: Number(round4AnswerKeys[problem.problemId][0]),
    marksEarned: 5,
    allProblemsSolved: enoughSolved,
    solvedCount,
    transformationRule: enoughSolved ? r4Config.transformationRuleText : null,
  });
});

// 19. POST /api/round4/submit-final-code
app.post("/api/round4/submit-final-code", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  const sess = round4Sessions[cadet.participantId];
  if (
    !sess ||
    [sess.p1Verified, sess.p2Verified, sess.p3Verified].filter(Boolean).length <
      2
  ) {
    return res
      .status(403)
      .json({
        error:
          "Solve at least two Round 4 programs before submitting the final code.",
      });
  }
  if (cadet.round4Status === "completed")
    return res
      .status(409)
      .json({ error: "Round 4 has already been completed." });
  const { enteredFinalCode } = req.body ?? {};
  if (typeof enteredFinalCode !== "string")
    return res.status(400).json({ error: "Final code is required." });
  const timeTakenSeconds = secondsTaken(cadet, 4);
  if (timeTakenSeconds === undefined)
    return res.status(409).json({ error: "Start Round 4 before submitting." });
  if (isAttemptPastDeadline(cadet, 4, SUBMISSION_NETWORK_GRACE_MS)) {
    return res
      .status(409)
      .json({ error: "Round 4 time expired before your final code arrived." });
  }

  const isCorrect =
    isAcceptedAnswer(enteredFinalCode, [r4Config.expectedFinalKey], 'output');

  if (isCorrect) {
    cadet.round4Status = "completed";
    attempts[cadet.participantId].rounds[4]!.status = "completed";
    cadet.round4Score =
      [sess.p1Verified, sess.p2Verified, sess.p3Verified].filter(Boolean)
        .length * 5;
    cadet.round4SolvedKey = enteredFinalCode.trim();
    cadet.round4TimeSeconds = timeTakenSeconds;
    cadet.status = "completed";
    cadet.currentRound = 5;
    cadet.totalScore =
      cadet.round1Score +
      cadet.round2Score +
      cadet.round3Score +
      cadet.round4Score;
    cadet.totalTimeSeconds =
      cadet.round1TimeSeconds +
      cadet.round2TimeSeconds +
      cadet.round3TimeSeconds +
      cadet.round4TimeSeconds;

    saveDB();
    res.json({
      success: true,
      isCorrect: true,
      score: cadet.round4Score,
      message: "IMPERIAL VICTORY MANIFEST ARCHIVED! Final Master Key Verified.",
      participant: cadet,
    });
  } else {
    res.status(400).json({
      success: false,
      isCorrect: false,
      message:
        "Invalid Final Key. Verify Program 1, 2, and 3 outputs and apply the Transformation Matrix formula.",
    });
  }
});

app.post("/api/round4/force-submit", (req: Request, res: Response) => {
  const cadet = getParticipant(req, res);
  if (!cadet) return;
  if (cadet.round4Status === "completed") {
    return res.json({
      success: true,
      participant: cadet,
      alreadyCompleted: true,
    });
  }
  const timerSeconds = secondsTaken(cadet, 4);
  if (timerSeconds === undefined) {
    return res
      .status(409)
      .json({ error: "Start Round 4 before it can be force-submitted." });
  }

  const session = round4Sessions[cadet.participantId];
  const verifiedCount = session
    ? [session.p1Verified, session.p2Verified, session.p3Verified].filter(
        Boolean,
      ).length
    : 0;
  cadet.round4Status = "completed";
  attempts[cadet.participantId].rounds[4]!.status = "completed";
  cadet.round4Score = verifiedCount * 5;
  cadet.round4TimeSeconds = timerSeconds;
  cadet.status = "completed";
  cadet.currentRound = 5;
  cadet.totalScore =
    cadet.round1Score +
    cadet.round2Score +
    cadet.round3Score +
    cadet.round4Score;
  cadet.totalTimeSeconds =
    cadet.round1TimeSeconds +
    cadet.round2TimeSeconds +
    cadet.round3TimeSeconds +
    cadet.round4TimeSeconds;
  saveDB();
  res.json({ success: true, forced: true, participant: cadet });
});

// 20. GET /api/leaderboard
app.get("/api/leaderboard", (req: Request, res: Response) => {
  if (!eventConfig.leaderboardPublished) {
    return res.json({ leaderboard: [], isPublished: false, totalCount: 0 });
  }
  const slotQuery = (req.query.slot as string) || "ALL";

  let list = [...participants];
  if (slotQuery !== "ALL") {
    list = list.filter((p) => p.slotId === slotQuery);
  }

  // Sort: highest totalScore, then lowest totalTimeSeconds
  list.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0);
  });

  const leaderboard = list.map((p, idx) => ({
    rank: idx + 1,
    name: p.name,
    rollNumber: p.rollNumber,
    college: p.college,
    slotId: p.slotId,
    currentRound: p.currentRound,
    status: p.status,
    integrityViolations: p.integrityViolations,
    round1Score: p.round1Score,
    round2Score: p.round2Score,
    round3Score: p.round3Score,
    round4Score: p.round4Score,
    totalScore: p.totalScore,
    totalDurationSeconds: p.totalTimeSeconds,
    isDisqualified: p.status === "disqualified",
  }));

  res.json({
    leaderboard,
    isPublished: eventConfig.leaderboardPublished,
    totalCount: leaderboard.length,
  });
});

// ADMIN ROUTES

// POST /api/admin/login
app.post("/api/admin/login", (req: Request, res: Response) => {
  const passcode = req.body?.passcode;
  const configuredPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (!configuredPasscode) {
    return res
      .status(503)
      .json({
        error:
          "Admin sign-in is unavailable because ADMIN_PASSCODE is not configured on the server.",
      });
  }

  if (passcode === configuredPasscode) {
    const token = randomBytes(32).toString("base64url");
    adminTokens.add(token);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: "Invalid passcode." });
});

// POST /api/admin/logout
app.post("/api/admin/logout", (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (auth) {
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    adminTokens.delete(token);
  }
  res.json({ success: true });
});

// GET /api/admin/session
app.get("/api/admin/session", (req: Request, res: Response) => {
  if (!checkAdminAuth(req))
    return res.status(401).json({ error: "Unauthorized" });
  res.json({ success: true, valid: true });
});

// GET /api/admin/data
app.get("/api/admin/data", (req: Request, res: Response) => {
  if (!checkAdminAuth(req))
    return res.status(401).json({ error: "Unauthorized" });

  const activeSlotsCount = slots.filter(
    (s) => s.isActiveOverride || s.computedStatus === "active",
  ).length;
  const completedRounds = participants.reduce((acc, p) => {
    return (
      acc +
      (p.round1Status === "completed" ? 1 : 0) +
      (p.round2Status === "completed" ? 1 : 0) +
      (p.round3Status === "completed" ? 1 : 0) +
      (p.round4Status === "completed" ? 1 : 0)
    );
  }, 0);
  const qualifiedCount = participants.filter(
    (p) => p.round4Status === "completed",
  ).length;

  res.json({
    stats: {
      totalParticipants: participants.length,
      activeSlotsCount,
      completedRounds,
      qualifiedCount,
    },
    participants: participants.map((participant) => ({
      ...participant,
      roundElapsedSeconds: {
        1: secondsTaken(participant, 1),
        2: secondsTaken(participant, 2),
        3: secondsTaken(participant, 3),
        4: secondsTaken(participant, 4),
      },
    })),
    slots,
    eventConfig,
    round1Questions,
    round2Problems,
    round3Problems,
    round4Problems,
    round4Config: r4Config,
  });
});

// POST /api/admin/update-slot
app.post("/api/admin/update-slot", (req: Request, res: Response) => {
  if (!checkAdminAuth(req))
    return res.status(401).json({ error: "Unauthorized" });
  const { slotId, isActiveOverride, startTime, endTime, date, slotName } =
    req.body;

  const slot = slots.find((s) => s.slotId === slotId);
  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (isActiveOverride !== undefined) slot.isActiveOverride = isActiveOverride;
  if (startTime) slot.startTime = startTime;
  if (endTime) slot.endTime = endTime;
  if (date) slot.date = date;
  if (slotName) slot.slotName = slotName;

  saveDB();
  res.json({ success: true, slot });
});

// POST /api/admin/update-config
app.post("/api/admin/update-config", (req: Request, res: Response) => {
  if (!checkAdminAuth(req))
    return res.status(401).json({ error: "Unauthorized" });
  const {
    round1MinScore,
    round2MinPercent,
    round3MinPercent,
    round2TimerMinutes,
    round3TimerMinutes,
    transformationRuleText,
    expectedFinalKey,
  } = req.body;

  if (round1MinScore !== undefined) eventConfig.round1MinScore = round1MinScore;
  if (round2MinPercent !== undefined)
    eventConfig.round2MinPercent = round2MinPercent;
  if (round3MinPercent !== undefined)
    eventConfig.round3MinPercent = round3MinPercent;
  if (round2TimerMinutes !== undefined)
    eventConfig.round2TimerMinutes = round2TimerMinutes;
  if (round3TimerMinutes !== undefined)
    eventConfig.round3TimerMinutes = round3TimerMinutes;

  if (transformationRuleText)
    r4Config.transformationRuleText = transformationRuleText;
  if (expectedFinalKey) r4Config.expectedFinalKey = expectedFinalKey;

  saveDB();
  res.json({ success: true, eventConfig, round4Config: r4Config });
});

// POST /api/admin/toggle-leaderboard
app.post("/api/admin/toggle-leaderboard", (req: Request, res: Response) => {
  if (!checkAdminAuth(req))
    return res.status(401).json({ error: "Unauthorized" });
  eventConfig.leaderboardPublished = !eventConfig.leaderboardPublished;
  saveDB();
  res.json({
    success: true,
    leaderboardPublished: eventConfig.leaderboardPublished,
  });
});

// POST /api/admin/test-mode-action
app.post("/api/admin/test-mode-action", (req: Request, res: Response) => {
  if (!checkAdminAuth(req))
    return res.status(401).json({ error: "Unauthorized" });
  const { action, participantId } = req.body;

  if (action === "force_active_slots") {
    slots.forEach((s) => (s.isActiveOverride = true));
    eventConfig.testMode = true;
  } else if (action === "qualify_round2") {
    const cadet = participants.find(
      (p) => p.participantId === (participantId || "TEST-001"),
    );
    if (cadet) {
      cadet.round1Status = "completed";
      cadet.round1Score = 30;
      cadet.currentRound = 2;
      cadet.totalScore =
        cadet.round1Score +
        cadet.round2Score +
        cadet.round3Score +
        cadet.round4Score;
    }
  } else if (action === "qualify_round3") {
    const cadet = participants.find(
      (p) => p.participantId === (participantId || "TEST-001"),
    );
    if (cadet) {
      cadet.round1Status = "completed";
      cadet.round1Score = 30;
      cadet.round2Status = "completed";
      cadet.round2Score = 30;
      cadet.round2SolvedCount = round2Problems.length;
      cadet.currentRound = 3;
      cadet.totalScore =
        cadet.round1Score +
        cadet.round2Score +
        cadet.round3Score +
        cadet.round4Score;
    }
  } else if (action === "qualify_round4") {
    const cadet = participants.find(
      (p) => p.participantId === (participantId || "TEST-001"),
    );
    if (cadet) {
      cadet.round1Status = "completed";
      cadet.round1Score = 30;
      cadet.round2Status = "completed";
      cadet.round2Score = 30;
      cadet.round2SolvedCount = round2Problems.length;
      cadet.round3Status = "completed";
      cadet.round3Score = 30;
      cadet.round3SolvedCount = 2;
      cadet.currentRound = 4;
      cadet.totalScore =
        cadet.round1Score +
        cadet.round2Score +
        cadet.round3Score +
        cadet.round4Score;
    }
  } else if (action === "reset_test_pilot") {
    if (
      !eventConfig.testMode ||
      (participantId && participantId !== "TEST-001")
    ) {
      return res
        .status(403)
        .json({
          error: "Only the TEST-001 fixture can be reset in test mode.",
        });
    }
    const cadet = participants.find((p) => p.participantId === "TEST-001");
    if (cadet) {
      cadet.currentRound = 1;
      cadet.status = "active";
      cadet.integrityViolations = 0;
      cadet.round1Status = "not_started";
      cadet.round1Score = 0;
      cadet.round1CorrectCount = 0;
      cadet.round1TimeSeconds = 0;
      cadet.round2Status = "not_started";
      cadet.round2Score = 0;
      cadet.round2SolvedCount = 0;
      cadet.round2TimeSeconds = 0;
      cadet.round3Status = "not_started";
      cadet.round3Score = 0;
      cadet.round3SolvedCount = 0;
      cadet.round3TimeSeconds = 0;
      cadet.round4Status = "not_started";
      cadet.round4Score = 0;
      cadet.round4TimeSeconds = 0;
      cadet.round4SolvedKey = "";
      cadet.totalScore = 0;
      cadet.totalTimeSeconds = 0;
      delete attempts[cadet.participantId];
      round4Sessions[cadet.participantId] = {
        p1Verified: false,
        p2Verified: false,
        p3Verified: false,
      };
    }
  }

  saveDB();
  res.json({ success: true, action });
});

// DELETE /api/admin/participants/:id
app.delete("/api/admin/participants/:id", (req: Request, res: Response) => {
  if (!checkAdminAuth(req))
    return res.status(401).json({ error: "Unauthorized" });
  const id = req.params.id;
  const idx = participants.findIndex(
    (p) => p.participantId === id || p.rollNumber === id,
  );
  if (idx !== -1) {
    const [removed] = participants.splice(idx, 1);
    delete round4Sessions[removed.participantId];
    for (const [sessionHash, session] of participantSessions) {
      if (session.participantId === removed.participantId)
        participantSessions.delete(sessionHash);
    }
    for (const [codeHash, participantId] of Object.entries(accessCodeHashes)) {
      if (participantId === removed.participantId)
        delete accessCodeHashes[codeHash];
    }
    saveDB();
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Participant not found" });
});

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "API endpoint not found." });
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error("Request failed:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Unable to complete the request safely." });
});

// Server Initialization
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(process.cwd(), "dist")));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `CODE FORCE AWAKEN website available at http://localhost:${PORT}`,
    );
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other server or set PORT to another available port.`,
      );
    } else {
      console.error("Failed to start CODE FORCE AWAKEN server:", err);
    }
    process.exitCode = 1;
  });
}

startServer();
