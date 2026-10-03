import React, { useState, useEffect, useRef } from 'react';
import { Participant, Round3Question } from '../types';
import { sound } from '../utils/sound';
import { apiFetch } from '../utils/api';
import { 
  Terminal, 
  Send, 
  Clock, 
  ArrowRight, 
  Trophy, 
  AlertCircle,
  Bug,
  Sparkles,
  Lightbulb
} from 'lucide-react';

interface Round3ArenaProps {
  participant: Participant;
  onUpdateParticipant: (updated: Participant) => void;
  onProceedToRound4: () => void;
  onBackToDashboard: () => void;
}

export const Round3Arena: React.FC<Round3ArenaProps> = ({
  participant,
  onUpdateParticipant,
  onProceedToRound4,
  onBackToDashboard
}) => {
  const [problems, setProblems] = useState<Round3Question[]>([]);
  const [passingScore, setPassingScore] = useState(12);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    totalPossible: number;
    isQualified: boolean;
    passingScore: number;
    breakdown?: Record<string, { correct: number; total: number; score: number; solved: boolean }>;
  } | null>(null);

  const [timerReady, setTimerReady] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(1200);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/timer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: 3 })
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
        const res = await apiFetch('/api/round3/problems');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load Round 3 questions.');
        if (data.problems) {
          setProblems(data.problems);
          if (typeof data.passingScore === 'number') setPassingScore(data.passingScore);
        }
      } catch (err) {
        console.error('Failed to load Round 3 problems:', err);
        setTimerError(err instanceof Error ? err.message : 'Could not load Round 3 questions.');
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerReady || participant.round3Status === 'completed' || submissionResult) return;

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
  }, [participant.round3Status, submissionResult, timerReady]);

  const currentProblem = problems[activeProblemIndex];
  const handleSubmit = async (returnToDashboard = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    sound.playClick();
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/round3/submit', {
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
      alert((err as Error).message || 'Error submitting Round 3');
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
        <div className="text-center space-y-3 font-mono text-purple-400">
          <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="tracking-widest uppercase text-sm">CALIBRATING THE HIDDEN FORCE TELEMETRY...</div>
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

  // Completed or submitted view
  if (submissionResult || participant.round3Status === 'completed') {
    const isQualified = submissionResult
      ? submissionResult.isQualified
      : participant.round3Score >= passingScore && participant.round3SolvedCount >= 2;
    const finalScore = submissionResult ? submissionResult.score : participant.round3Score;

    return (
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="cyber-card p-8 rounded-2xl shadow-2xl border-purple-500/40 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono">
            ROUND 3 EVALUATION REPORT
          </div>

          <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center p-0.5 ${
            isQualified ? 'bg-gradient-to-tr from-green-500 to-purple-500' : 'bg-gradient-to-tr from-red-500 to-amber-500'
          }`}>
            <div className="w-full h-full bg-[#060b19] rounded-[14px] flex items-center justify-center">
              {isQualified ? <Trophy className="w-10 h-10 text-green-400" /> : <AlertCircle className="w-10 h-10 text-red-400" />}
            </div>
          </div>

          <h2 className="text-3xl font-orbitron font-extrabold text-white">
            {isQualified ? 'THE HIDDEN FORCE CONQUERED — PROCEED TO THE FINAL KEY!' : 'HIDDEN FORCE THRESHOLD NOT MET'}
          </h2>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-sm mx-auto">
            <div className="text-xs font-mono text-slate-400">ROUND 3 SCORE</div>
            <div className="text-4xl font-orbitron font-black text-purple-400 my-1">
              {finalScore} <span className="text-sm text-slate-500 font-mono">/ 30</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Required Threshold: ≥ {passingScore} Marks and 2 problems solved
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isQualified && (
              <button
                onClick={() => {
                  sound.playClick();
                  onProceedToRound4();
                }}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-orbitron font-bold text-xs sm:text-sm tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                ENTER THE FINAL KEY (ROUND 4)
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
      {/* Header bar */}
      <div className="cyber-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-400">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-sm text-white">
              ROUND 3: THE HIDDEN FORCE
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Code Fragment Completion • Problem {activeProblemIndex + 1} of {problems.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm ${
            remainingSeconds <= 180
              ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-purple-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-purple-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            SUBMIT HIDDEN FORCE
          </button>
        </div>
      </div>

      {/* Problem Tabs */}
      <div className="flex flex-wrap gap-2">
        {problems.map((p, idx) => (
          <button
            key={p.problemId}
            onClick={() => {
              sound.playClick();
              setActiveProblemIndex(idx);
            }}
            className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center gap-2 transition-all border cursor-pointer ${
              activeProblemIndex === idx
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>PROBLEM {idx + 1}: {p.title}</span>
          </button>
        ))}
      </div>

      {/* Main Coding Layout */}
      {currentProblem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Problem description & hint */}
          <div className="lg:col-span-5 space-y-4">
            <div className="cyber-card p-6 rounded-2xl border-purple-500/30 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
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

                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-1">
                  <div className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    ANSWER FORMAT:
                  </div>
                  <div className="text-xs text-slate-300 font-sans">
                    Fill each requested code fragment. Your fragments are checked against the accepted answers shown by the organizer; Python is not executed.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code fragment blanks */}
          <div className="lg:col-span-7 space-y-4">
            <div className="cyber-card p-5 rounded-2xl border-purple-500/30 space-y-4">
              <div className="px-3 py-1.5 rounded-lg bg-purple-600 text-xs font-mono font-bold text-white w-fit">
                COMPLETE THE CODE FRAGMENTS
              </div>
              <div className="space-y-4">
                {currentProblem.blanks.map((blank, index) => (
                  <label key={blank.id} className="block space-y-2">
                    <span className="block text-xs font-mono text-slate-300">{index + 1}. {blank.prompt}</span>
                    <input
                      value={answers[currentProblem.problemId]?.[blank.id] || ''}
                      onChange={event => setAnswers(previous => ({
                        ...previous,
                        [currentProblem.problemId]: {
                          ...(previous[currentProblem.problemId] || {}),
                          [blank.id]: event.target.value
                        }
                      }))}
                      disabled={participant.round3Status === 'completed' || submitting}
                      maxLength={500}
                      className="w-full rounded-lg border border-slate-700 bg-[#060b19] px-4 py-3 font-mono text-sm text-purple-200 outline-none focus:border-purple-400 disabled:opacity-60"
                      placeholder="Enter a Python code fragment"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
