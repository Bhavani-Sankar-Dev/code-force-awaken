export interface SlotEvaluation {
  isBefore: boolean;
  isActive: boolean;
  isAfter: boolean;
  statusText: string;
  formattedMessage: string;
  startTimeIST: string;
  endTimeIST: string;
  dateIST: string;
}

export interface Slot {
  slotId: string;
  slotName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  status: 'scheduled' | 'active' | 'completed';
  isActiveOverride?: boolean;
  registeredCount: number;
  computedStatus: 'upcoming' | 'active' | 'completed';
  startISO?: string;
  endISO?: string;
  evaluation?: SlotEvaluation;
}

export interface EventConfig {
  eventName: string;
  collegeEvent: string;
  round1MinScore: number;
  round2MinPercent: number;
  round3MinPercent: number;
  round2TimerMinutes: number;
  round3TimerMinutes: number;
  maxIntegrityViolations: number;
  leaderboardPublished: boolean;
  testMode: boolean;
}

export interface Participant {
  participantId: string;
  name: string;
  rollNumber: string;
  college: string;
  branch: string;
  year: string;
  email: string;
  phone: string;
  slotId: string;
  registrationTime: string;
  currentRound: number;
  status: 'registered' | 'active' | 'completed' | 'disqualified';
  integrityViolations: number;

  round1Status: 'not_started' | 'in_progress' | 'completed';
  round1Score: number;
  round1CorrectCount: number;
  round1TimeSeconds: number;

  round2Status: 'not_started' | 'in_progress' | 'completed';
  round2Score: number;
  round2SolvedCount: number;
  round2TimeSeconds: number;

  round3Status: 'not_started' | 'in_progress' | 'completed';
  round3Score: number;
  round3SolvedCount: number;
  round3TimeSeconds: number;

  round4Status: 'not_started' | 'in_progress' | 'completed';
  round4Score: number;
  round4TimeSeconds: number;
  round4SolvedKey: string;

  totalScore: number;
  totalTimeSeconds: number;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface ScrambledLine {
  id: string;
  label: string;
  code: string;
}

export interface LogicExample {
  input: string;
  output: string;
}

export interface Round1Question {
  questionId: string;
  roundId: string;
  challengeType: 'OUTPUT_PREDICTION' | 'CODE_RECONSTRUCTION' | 'LOGIC_DECODER';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  order: number;
  points: number;
  questionText: string;
  code?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  scrambledLines?: ScrambledLine[];
  correctOrder?: string[];
  expectedOutput?: string;
  examples?: LogicExample[];
  targetInput?: string;
  logicHint?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface TestExecutionResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  executionTimeMs: number;
}

export interface ProblemRunResult {
  testsPassed: number;
  totalTests: number;
  allPassed: boolean;
  results: TestExecutionResult[];
}

export interface Round2Problem {
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  points: number;
  timeLimitMinutes: number;
  starterCode: StarterCode;
  visibleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
}

export type Round2Question = Pick<
  Round2Problem,
  'problemId' | 'title' | 'difficulty' | 'description' | 'inputFormat' |
  'outputFormat' | 'sampleInput' | 'points' | 'timeLimitMinutes'
>;

export interface Round3Problem {
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  missingLogicHint: string;
  points: number;
  timeLimitMinutes: number;
  starterCode: StarterCode;
  visibleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
}

export interface Round3BlankPrompt {
  id: string;
  prompt: string;
}

export type Round3Question = Pick<
  Round3Problem,
  'problemId' | 'title' | 'difficulty' | 'description' | 'points'
> & {
  blanks: Round3BlankPrompt[];
  starterCode: string;
};

export interface Round4Problem {
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  targetOutputNumber: number;
  points: number;
  starterCode: StarterCode;
  visibleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
}

export type Round4Question = Pick<
  Round4Problem,
  'problemId' | 'title' | 'difficulty' | 'inputFormat' | 'outputFormat' |
  'sampleInput' | 'points'
> & {
  description: string;
  starterCode: string;
  codePrompts: Round3BlankPrompt[];
};

export interface StarterCode {
  python: string;
  javascript?: string;
  c?: string;
  java?: string;
}

export interface Round4Config {
  transformationRuleText: string;
  transformationRuleType: string;
  expectedIntermediateCode: string;
  expectedFinalKey: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  rollNumber: string;
  college: string;
  slotId: string;
  currentRound: number;
  status: string;
  integrityViolations: number;
  round1Score: number;
  round2Score: number;
  round3Score: number;
  round4Score: number;
  totalScore: number;
  totalDurationSeconds: number;
  isDisqualified: boolean;
}
