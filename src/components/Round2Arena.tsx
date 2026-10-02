import React, { useState, useEffect, useRef } from 'react';
import { Participant, Round2Question } from '../types';
import { sound } from '../utils/sound';
import { 
  Terminal, 
  Send, 
  Clock, 
  ArrowRight, 
  Trophy, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Round2ArenaProps {
  participant: Participant;
  onUpdateParticipant: (updated: Participant) => void;
  onProceedToRound3: () => void;
  onBackToDashboard: () => void;
}

export const Round2Arena: React.FC<Round2ArenaProps> = ({
  participant,
  onUpdateParticipant,
  onProceedToRound3,
  onBackToDashboard
}) => {
  const [problems, setProblems] = useState<Round2Question[]>([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    totalPossible: number;
    isQualified: boolean;
    passingScore: number;
    solvedCount: number;
    breakdown?: Record<string, { score: number; correct: boolean }>;
  } | null>(null);

  const [timerReady, setTimerReady] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(1200);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/timer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: 2 })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not start the server timer.');
        if (!cancelled) setRemainingSeconds(Math.max(0, Number(data.remainingSeconds) || 0));
      })
      .catch((err: unknown) => {
        if (!cancelled) setTimerError((err as Error).message || 'Could not start the server timer.');
      })
      .finally(() => {
        if (!cancelled) setTimerReady(true);
      });
    return () => { cancelled = true; };
  }, [participant.participantId]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await fetch('/api/round2/problems');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load Round 2 questions.');
        if (data.problems) {
          setProblems(data.problems);
        }
      } catch (err) {
        console.error('Failed to load Round 2 problems:', err);
        setTimerError(err instanceof Error ? err.message : 'Could not load Round 2 questions.');
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerReady || participant.round2Status === 'completed' || submissionResult) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [participant.round2Status, submissionResult, timerReady]);

  const currentProblem = problems[activeProblemIndex];
  const handleSubmit = async (returnToDashboard = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    sound.playClick();
    setSubmitting(true);

    try {
      const res = await fetch('/api/round2/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.participantId,
          answers
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.participant) onUpdateParticipant(data.participant);
        throw new Error(data.error || 'Submission failed');
      }

      setSubmissionResult(data);
      if (data.participant) {
        onUpdateParticipant(data.participant);
      }
      if (data.isQualified) {
        sound.playSuccess();
      } else {
        sound.playWarning();
      }
      if (returnToDashboard) onBackToDashboard();
    } catch (err: unknown) {
      alert((err as Error).message || 'Error submitting Round 2');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleForceSubmit = (event: Event) => {
      const { participantId } = (event as CustomEvent<{ participantId: string }>).detail;
      if (participantId === participant.participantId) void handleSubmit(true);
    };
    window.addEventListener('participant-force-submit', handleForceSubmit);
    return () => window.removeEventListener('participant-force-submit', handleForceSubmit);
  }, [participant.participantId, handleSubmit]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 font-mono text-cyan-400">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="tracking-widest uppercase text-sm">CALIBRATING JEDI TRIAL MATRIX...</div>
        </div>
      </div>
    );
  }

  if (timerError) {
    return (
      <div className="relative z-10 max-w-xl mx-auto px-4 py-16 text-center cyber-card rounded-2xl">
        <p className="text-red-300">{timerError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-cyan-300 underline">Retry</button>
      </div>
    );
  }

  // Already completed or submitted view
  if (submissionResult || participant.round2Status === 'completed') {
    const isQualified = submissionResult ? submissionResult.isQualified : participant.round2SolvedCount === problems.length;
    const finalScore = submissionResult ? submissionResult.score : participant.round2Score;

    return (
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="cyber-card p-8 rounded-2xl shadow-2xl border-blue-500/40 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-mono">
            ROUND 2 EVALUATION REPORT
          </div>

          <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center p-0.5 ${
            isQualified ? 'bg-gradient-to-tr from-green-500 to-blue-500' : 'bg-gradient-to-tr from-red-500 to-amber-500'
          }`}>
            <div className="w-full h-full bg-[#060b19] rounded-[14px] flex items-center justify-center">
              {isQualified ? <Trophy className="w-10 h-10 text-green-400" /> : <AlertCircle className="w-10 h-10 text-red-400" />}
            </div>
          </div>

          <h2 className="text-3xl font-orbitron font-extrabold text-white">
            {isQualified ? 'JEDI TRIAL PASSED — ADVANCING TO ROUND 3!' : 'JEDI TRIAL THRESHOLD NOT MET'}
          </h2>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-sm mx-auto">
            <div className="text-xs font-mono text-slate-400">TRIAL SCORE</div>
            <div className="text-4xl font-orbitron font-black text-blue-400 my-1">
              {finalScore} <span className="text-sm text-slate-500 font-mono">/ 30</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Qualification requires all 3 fixed-input answers to be correct.
            </div>
          </div>

          {submissionResult?.breakdown && (
            <div className="max-w-xl mx-auto space-y-2 text-left">
              {problems.map(problem => {
                const result = submissionResult.breakdown?.[problem.problemId];
                if (!result) return null;
                return (
                  <div key={problem.problemId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-3">
                    <span className="text-sm text-slate-200">{problem.title}</span>
                    <span className={`text-xs font-mono ${result.correct ? 'text-green-300' : 'text-red-300'}`}>
                      {result.correct ? 'CORRECT' : 'INCORRECT'} · {result.score}/{problem.points} pts
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-slate-400 text-center pt-1">
                {submissionResult.solvedCount}/3 answers correct.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isQualified && (
              <button
                onClick={() => {
                  sound.playClick();
                  onProceedToRound3();
                }}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-orbitron font-bold text-xs sm:text-sm tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                ENTER ROUND 3: THE HIDDEN FORCE
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onBackToDashboard();
              }}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              RETURN TO COMMAND DASHBOARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header & Timer Bar */}
      <div className="cyber-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-950 border border-blue-500/40 text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-sm text-white">
              ROUND 2: THE JEDI TRIAL
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Fixed-Input Algorithm Questions • Problem {activeProblemIndex + 1} of {problems.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm ${
            remainingSeconds <= 180
              ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-blue-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-orbitron font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            SUBMIT JEDI TRIAL
          </button>
        </div>
      </div>

      {/* Problem Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {problems.map((p, idx) => {
          return (
            <button
              key={p.problemId}
              onClick={() => {
                sound.playClick();
                setActiveProblemIndex(idx);
              }}
              className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center gap-2 transition-all border cursor-pointer ${
                activeProblemIndex === idx
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>PROBLEM {idx + 1}: {p.title}</span>
              {answers[p.problemId]?.trim() && <span className="text-[10px] font-mono text-cyan-300">ANSWERED</span>}
            </button>
          );
        })}
      </div>

      {/* Main Coding & Problem Layout */}
      {currentProblem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Problem Description & Test Case specs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="cyber-card p-6 rounded-2xl border-blue-500/30 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                    DIFFICULTY: {currentProblem.difficulty.toUpperCase()}
                  </span>
                  <span className="text-amber-400 font-mono text-xs font-bold">
                    +{currentProblem.points} PTS
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-orbitron font-bold text-white mb-2">
                    {currentProblem.title}
                  </h3>
                  <div className="text-xs text-slate-300 font-sans whitespace-pre-line leading-relaxed">
                    {currentProblem.description}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 uppercase">Input Format: </span>
                    <span className="text-slate-300">{currentProblem.inputFormat}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase">Output Format: </span>
                    <span className="text-slate-300">{currentProblem.outputFormat}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-slate-500 uppercase">Sample Input:</div>
                  <pre className="text-cyan-300 bg-black/40 p-2 rounded">{currentProblem.sampleInput}</pre>
                </div>
                <p className="text-[11px] text-amber-200/80 font-mono">Write the exact expected output for this input. Submitted programs are not executed in this round.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Fixed-input answer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="cyber-card p-5 rounded-2xl border-blue-500/30 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-mono font-bold text-white">
                  EXPECTED OUTPUT
                </div>
                <span className="text-xs font-mono text-slate-400">Answer is checked after final submission</span>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#060b19] p-5 space-y-3">
                <label htmlFor={`answer-${currentProblem.problemId}`} className="block text-xs font-mono uppercase text-slate-400">
                  Expected output for the displayed sample input
                </label>
                <input
                  id={`answer-${currentProblem.problemId}`}
                  value={answers[currentProblem.problemId] || ''}
                  onChange={event => setAnswers(previous => ({ ...previous, [currentProblem.problemId]: event.target.value }))}
                  disabled={submitting}
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-cyan-200 outline-none focus:border-blue-400 disabled:opacity-60"
                  placeholder="Type the output"
                />
              </div>

              <p className="text-xs text-slate-400">This simplified judging format checks the provided answer only; it cannot validate arbitrary Python solutions or other unseen inputs.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};