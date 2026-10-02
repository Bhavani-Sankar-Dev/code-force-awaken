import React, { useState, useEffect, useRef } from 'react';
import { Participant, Round1Question } from '../types';
import { sound } from '../utils/sound';
import { 
  Terminal, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  Trophy, 
  AlertCircle,
  HelpCircle,
  Send,
  Zap
} from 'lucide-react';

interface Round1ArenaProps {
  participant: Participant;
  onUpdateParticipant: (updated: Participant) => void;
  onProceedToRound2: () => void;
  onBackToDashboard: () => void;
}

export const Round1Arena: React.FC<Round1ArenaProps> = ({
  participant,
  onUpdateParticipant,
  onProceedToRound2,
  onBackToDashboard
}) => {
  const [questions, setQuestions] = useState<Round1Question[]>([]);
  const [passingScore, setPassingScore] = useState(12);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    totalPossible: number;
    isQualified: boolean;
    passingScore: number;
    breakdown?: Record<string, { earned: number; possible: number; correct: boolean }>;
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
      body: JSON.stringify({ round: 1 })
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
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/questions/round1');
        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
          if (typeof data.passingScore === 'number') setPassingScore(data.passingScore);
          // Initialize scrambled lines order
          const initialAnswers: Record<string, string | string[]> = {};
          data.questions.forEach((q: Round1Question) => {
            if (q.challengeType === 'CODE_RECONSTRUCTION' && q.scrambledLines) {
              initialAnswers[q.questionId] = q.scrambledLines.map(l => l.id);
            }
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        console.error('Failed to load Round 1 questions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerReady || participant.round1Status === 'completed' || submissionResult) return;

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
  }, [participant.round1Status, submissionResult, timerReady]);

  const handleSelectOption = (questionId: string, optionLabel: string) => {
    if (participant.round1Status === 'completed') return;
    sound.playClick();
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionLabel
    }));
  };

  const handleMoveLine = (questionId: string, fromIndex: number, direction: 'up' | 'down') => {
    if (participant.round1Status === 'completed') return;
    sound.playClick();
    const currentOrder = [...((answers[questionId] as string[]) || [])];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentOrder.length) return;

    const temp = currentOrder[fromIndex];
    currentOrder[fromIndex] = currentOrder[toIndex];
    currentOrder[toIndex] = temp;

    setAnswers(prev => ({
      ...prev,
      [questionId]: currentOrder
    }));
  };

  const handleSubmit = async (returnToDashboard = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    sound.playClick();
    setSubmitting(true);

    try {
      const res = await fetch('/api/round1/submit', {
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
      alert((err as Error).message || 'Error submitting Round 1');
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

  const currentQ = questions[currentIndex];
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
          <div className="tracking-widest uppercase text-sm">INITIALIZING THE AWAKENING TELEMETRY...</div>
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

  // Already completed or just submitted view
  if (submissionResult || participant.round1Status === 'completed') {
    const isQualified = submissionResult ? submissionResult.isQualified : participant.round1Score >= passingScore;
    const finalScore = submissionResult ? submissionResult.score : participant.round1Score;

    return (
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="cyber-card p-8 rounded-2xl shadow-2xl border-cyan-500/40 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            ROUND 1 TELEMETRY DEBRIEF
          </div>

          <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center p-0.5 ${
            isQualified ? 'bg-gradient-to-tr from-green-500 to-cyan-500' : 'bg-gradient-to-tr from-red-500 to-amber-500'
          }`}>
            <div className="w-full h-full bg-[#060b19] rounded-[14px] flex items-center justify-center">
              {isQualified ? <Trophy className="w-10 h-10 text-green-400" /> : <AlertCircle className="w-10 h-10 text-red-400" />}
            </div>
          </div>

          <h2 className="text-3xl font-orbitron font-extrabold text-white">
            {isQualified ? 'THE AWAKENING COMPLETED — QUALIFIED!' : 'AWAKENING THRESHOLD NOT REACHED'}
          </h2>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-sm mx-auto">
            <div className="text-xs font-mono text-slate-400">FINAL SCORE</div>
            <div className="text-4xl font-orbitron font-black text-cyan-400 my-1">
              {finalScore} <span className="text-sm text-slate-500 font-mono">/ 30</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Required Qualifying Threshold: {passingScore} Marks
            </div>
          </div>

          <p className="text-slate-300 text-sm max-w-lg mx-auto">
            {isQualified
              ? 'Your cognitive telemetry has been verified. You have demonstrated algorithmic acumen and are cleared to enter Stage 2: The Jedi Trial.'
              : `You did not meet the ${passingScore}-mark threshold required for Round 2. You may review your answers or check the overall imperial standings.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isQualified && (
              <button
                onClick={() => {
                  sound.playClick();
                  onProceedToRound2();
                }}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-bold text-xs sm:text-sm tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                ADVANCE TO ROUND 2: THE JEDI TRIAL
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
    <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header bar with timer and breadcrumb */}
      <div className="cyber-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-sm text-white">
              ROUND 1: THE AWAKENING
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Question {currentIndex + 1} of {questions.length} • {currentQ?.challengeType.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm ${
            remainingSeconds <= 180
              ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-cyan-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            FINALIZE TRIAL
          </button>
        </div>
      </div>

      {/* Question Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => {
          const isAnswered =
            q.challengeType === 'CODE_RECONSTRUCTION'
              ? !!answers[q.questionId]
              : answers[q.questionId] !== undefined;

          return (
            <button
              key={q.questionId}
              onClick={() => {
                sound.playClick();
                setCurrentIndex(idx);
              }}
              className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all border cursor-pointer ${
                currentIndex === idx
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                  : isAnswered
                  ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="cyber-card p-6 sm:p-8 rounded-2xl border-cyan-500/30 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
                {currentQ.challengeType}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 text-xs font-mono">
                DIFFICULTY: {currentQ.difficulty.toUpperCase()}
              </span>
            </div>
            <span className="text-amber-400 font-mono text-xs font-bold">
              +{currentQ.points} PTS
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-sans font-medium text-white mb-4">
              {currentQ.questionText}
            </h3>

            {/* Type 1: Output Prediction (Code block + Options) */}
            {currentQ.challengeType === 'OUTPUT_PREDICTION' && (
              <div className="space-y-5">
                {currentQ.code && (
                  <pre className="p-4 rounded-xl bg-[#060b19] border border-cyan-500/20 text-cyan-300 font-mono text-sm overflow-x-auto">
                    <code>{currentQ.code}</code>
                  </pre>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options?.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => handleSelectOption(currentQ.questionId, opt.label)}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        answers[currentQ.questionId] === opt.label
                          ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-md shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        answers[currentQ.questionId] === opt.label
                          ? 'bg-cyan-500 text-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="font-mono text-sm">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type 2: Code Reconstruction (Scrambled lines) */}
            {currentQ.challengeType === 'CODE_RECONSTRUCTION' && (
              <div className="space-y-4">
                <div className="text-xs font-mono text-slate-400">
                  Target output when executed correctly: <span className="text-cyan-300 font-bold">{currentQ.expectedOutput}</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Arrange lines into the correct execution sequence using the up/down controllers:
                </div>

                <div className="space-y-2">
                  {((answers[currentQ.questionId] as string[]) || currentQ.scrambledLines?.map(l => l.id) || []).map((lineId, idx, arr) => {
                    const lineObj = currentQ.scrambledLines?.find(l => l.id === lineId);
                    if (!lineObj) return null;

                    return (
                      <div
                        key={lineId}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-sm font-mono"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-cyan-300 whitespace-pre">{lineObj.code}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveLine(currentQ.questionId, idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveLine(currentQ.questionId, idx, 'down')}
                            disabled={idx === arr.length - 1}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Type 3: Logic Decoder (Input/Output progression + Options) */}
            {currentQ.challengeType === 'LOGIC_DECODER' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {currentQ.examples?.map((ex, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Input</div>
                      <div className="text-sm font-mono text-slate-300 font-bold">{ex.input}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">Output</div>
                      <div className="text-sm font-mono text-cyan-400 font-bold">{ex.output}</div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-center font-mono">
                  <span className="text-slate-400 text-xs">TARGET INPUT: </span>
                  <span className="text-xl font-bold text-cyan-300">{currentQ.targetInput}</span>
                  <span className="text-slate-400 text-xs ml-4">PREDICT OUTPUT: </span>
                  <span className="text-xl font-bold text-amber-300">?</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentQ.options?.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => handleSelectOption(currentQ.questionId, opt.label)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        answers[currentQ.questionId] === opt.label
                          ? 'border-cyan-400 bg-cyan-950 text-cyan-200 shadow-md shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-mono text-slate-500">{opt.label}</div>
                      <div className="text-lg font-mono font-bold mt-0.5">{opt.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Prev / Next */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                setCurrentIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              PREVIOUS
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
              }}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              NEXT
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
