import React, { useState, useEffect, useRef } from 'react';
import { Participant, Round4Question } from '../types';
import { sound } from '../utils/sound';
import { apiFetch } from '../utils/api';
import { 
  Key, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  Trophy, 
  Send, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface Round4ArenaProps {
  participant: Participant;
  onUpdateParticipant: (updated: Participant) => void;
  onViewLeaderboard: () => void;
  onBackToDashboard: () => void;
}

export const Round4Arena: React.FC<Round4ArenaProps> = ({
  participant,
  onUpdateParticipant,
  onViewLeaderboard,
  onBackToDashboard
}) => {
  const [problems, setProblems] = useState<Round4Question[]>([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [verifiedMap, setVerifiedMap] = useState<Record<string, { verified: boolean; output: number; marks: number }>>({});
  const [allProblemsSolved, setAllProblemsSolved] = useState(false);
  const [transformationRule, setTransformationRule] = useState<string | null>(null);
  const [enteredFinalCode, setEnteredFinalCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timerError, setTimerError] = useState<string | null>(null);
  const forceSubmittingRef = useRef(false);
  const [victoryResult, setVictoryResult] = useState<{
    success: boolean;
    finalRank?: number;
    score: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    apiFetch('/api/timer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round: 4 })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not start the server timer.');
      })
      .catch((err: unknown) => setTimerError((err as Error).message || 'Could not start the server timer.'));
  }, [participant.participantId]);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await apiFetch('/api/round4/challenge');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load Round 4 questions.');
        const probs: Round4Question[] = data.problems || [];
        setProblems(probs);

        // Fetch participant session
        if (participant.participantId) {
          const sessRes = await apiFetch(`/api/round4/session/${participant.participantId}`);
          if (sessRes.ok) {
            const sess = await sessRes.json();
            const vMap: Record<string, { verified: boolean; output: number; marks: number }> = {};
            if (sess.p1Verified) vMap['r4-p1'] = { verified: true, output: sess.p1Output, marks: sess.p1Marks };
            if (sess.p2Verified) vMap['r4-p2'] = { verified: true, output: sess.p2Output, marks: sess.p2Marks };
            if (sess.p3Verified) vMap['r4-p3'] = { verified: true, output: sess.p3Output, marks: sess.p3Marks };
            setVerifiedMap(vMap);

            if (sess.allProblemsSolved) {
              setAllProblemsSolved(true);
              setTransformationRule(sess.transformationRule);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Round 4:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [participant.participantId]);

  const currentProblem = problems[activeProblemIndex];
  const isCurrentProblemVerified = currentProblem ? verifiedMap[currentProblem.problemId]?.verified : false;

  const handleVerifyProblem = async () => {
    if (!currentProblem || verifying || isCurrentProblemVerified) return;
    sound.playClick();
    setVerifying(true);

    try {
      const res = await apiFetch('/api/round4/verify-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.participantId,
          problemId: currentProblem.problemId,
          answer: answers[currentProblem.problemId] || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not check the answer.');

      if (data.success) {
        sound.playSuccess();
        setVerifiedMap(prev => ({
          ...prev,
          [currentProblem.problemId]: {
            verified: true,
            output: data.verifiedOutput,
            marks: data.marksEarned
          }
        }));

        if (data.allProblemsSolved) {
          setAllProblemsSolved(true);
          setTransformationRule(data.transformationRule);
        }
      } else {
        sound.playWarning();
        alert(data.message || 'That output is not correct for the provided input.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      alert(err instanceof Error ? err.message : 'Answer checking failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitFinalCode = async () => {
    if (!enteredFinalCode.trim() || transmitting) return;
    sound.playClick();
    setTransmitting(true);

    try {
      const res = await apiFetch('/api/round4/submit-final-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.participantId,
          enteredFinalCode: enteredFinalCode.trim()
        })
      });
      const data = await res.json();

      if (data.success) {
        sound.playVictory();
        setVictoryResult({
          success: true,
          score: data.score,
          finalRank: data.finalRank,
          message: data.message
        });
        if (data.participant) {
          onUpdateParticipant(data.participant);
        }
      } else {
        sound.playWarning();
        alert(data.message || 'Incorrect Final Key. Review the transformation rule.');
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Final code transmission error.');
    } finally {
      setTransmitting(false);
    }
  };

  useEffect(() => {
    const handleForceSubmit = async (event: Event) => {
      const { participantId } = (event as CustomEvent<{ participantId: string }>).detail;
      if (participantId !== participant.participantId || forceSubmittingRef.current) return;
      forceSubmittingRef.current = true;
      setTransmitting(true);
      try {
        const res = await apiFetch('/api/round4/force-submit', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not submit Round 4.');
        if (data.participant) onUpdateParticipant(data.participant);
        onBackToDashboard();
      } catch (err: unknown) {
        alert((err as Error).message || 'Could not submit Round 4.');
      } finally {
        forceSubmittingRef.current = false;
        setTransmitting(false);
      }
    };
    window.addEventListener('participant-force-submit', handleForceSubmit);
    return () => window.removeEventListener('participant-force-submit', handleForceSubmit);
  }, [participant.participantId, onUpdateParticipant, onBackToDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 font-mono text-amber-400">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="tracking-widest uppercase text-sm">INITIALIZING THE FINAL KEY TELEMETRY MATRIX...</div>
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

  // Victory Debrief Screen
  if (victoryResult || participant.round4Status === 'completed') {
    const finalScore = victoryResult ? victoryResult.score : participant.round4Score;
    const finalKey = participant.round4SolvedKey || enteredFinalCode || 'VERIFIED';

    return (
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="cyber-card p-8 sm:p-10 rounded-2xl shadow-2xl border-amber-500/60 text-center space-y-6 bg-slate-950/90 glow-amber">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono animate-pulse">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            IMPERIAL VICTORY MANIFEST ARCHIVED
          </div>

          <div className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center p-0.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 shadow-xl shadow-amber-500/30">
            <div className="w-full h-full bg-[#060b19] rounded-[14px] flex items-center justify-center">
              <Trophy className="w-12 h-12 text-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
              CODE FORCE: AWAKEN CONQUERED!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Hail, Cadet <span className="text-cyan-300 font-bold">{participant.name}</span> ({participant.rollNumber}).
              You have completed all 4 stages of the AIKYA 2026 Coding Championship!
            </p>
          </div>

          {/* Master Key Card */}
          <div className="p-4 rounded-xl bg-black/60 border border-amber-500/40 max-w-md mx-auto space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Authenticated Master Key</div>
            <div className="text-3xl font-orbitron font-black text-amber-400 tracking-widest">{finalKey}</div>
            <div className="text-[11px] font-mono text-green-400">Total Score: {participant.totalScore} / 105 PTS</div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                sound.playClick();
                onViewLeaderboard();
              }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-orbitron font-extrabold text-xs sm:text-sm tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              VIEW IMPERIAL LEADERBOARD STANDINGS
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onBackToDashboard();
              }}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Banner */}
      <div className="cyber-card p-6 rounded-2xl border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            STAGE 4: THE GRAND FINALE
          </div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-extrabold text-white">
            THREE CODES. ONE RULE. ONE FINAL KEY.
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Work out each DSA challenge for its displayed input. Verified outputs unlock the Transformation Matrix rule used for the Final Key.
          </p>
        </div>

        {/* 3 Outputs Indicator Status */}
        <div className="flex items-center gap-3 shrink-0">
          {problems.map((p, i) => {
            const v = verifiedMap[p.problemId];
            return (
              <div
                key={p.problemId}
                className={`p-3 rounded-xl border text-center min-w-[80px] ${
                  v?.verified
                    ? 'bg-amber-950/50 border-amber-500/60 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-mono uppercase">PROG {i + 1}</div>
                <div className="text-lg font-orbitron font-bold mt-0.5">
                  {v?.verified ? v.output : '?'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {problems.map((p, idx) => {
          const v = verifiedMap[p.problemId];
          return (
            <button
              key={p.problemId}
              onClick={() => {
                sound.playClick();
                setActiveProblemIndex(idx);
              }}
              className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center gap-2 transition-all border cursor-pointer ${
                activeProblemIndex === idx
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>PROGRAM {idx + 1}: {p.title}</span>
              {v?.verified ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-green-950 text-green-300 border border-green-500/40 font-bold">
                  VERIFIED ({v.output})
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  +5 PTS
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Program Arena Layout */}
      {currentProblem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Problem details & Sample specs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="cyber-card p-6 rounded-2xl border-amber-500/30 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                    PROGRAM {activeProblemIndex + 1} OF 3
                  </span>
                  <span className="text-amber-400 font-mono text-xs font-bold">
                    +5 PTS {isCurrentProblemVerified ? `(OUTPUT: ${verifiedMap[currentProblem.problemId].output})` : '(OUTPUT LOCKED)'}
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

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-slate-500 uppercase">Sample Input:</div>
                  <pre className="text-cyan-300 bg-black/40 p-2 rounded">{currentProblem.sampleInput}</pre>
                </div>
                <p className="text-[11px] text-amber-200/80 font-mono">Enter the expected output for this input. The site checks a predefined answer; it does not execute submitted code.</p>
              </div>

              {isCurrentProblemVerified && (
                <div className="p-3 rounded-xl bg-green-950/40 border border-green-500/40 flex items-center gap-2 text-xs font-mono text-green-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Program verified! Extracted Output Value: </span>
                  <span className="font-bold text-sm">{verifiedMap[currentProblem.problemId]?.output}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Expected-output answer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="cyber-card p-5 rounded-2xl border-amber-500/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-xs font-mono font-bold text-black">
                  EXPECTED OUTPUT
                </span>
                <button
                  onClick={handleVerifyProblem}
                  disabled={verifying || isCurrentProblemVerified}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-orbitron font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-40"
                >
                  {verifying ? (
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {isCurrentProblemVerified ? 'VERIFIED' : `VERIFY OUTPUT ${activeProblemIndex + 1}`}
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400">What output does the algorithm produce?</span>
                <input
                  value={answers[currentProblem.problemId] || ''}
                  onChange={event => setAnswers(previous => ({ ...previous, [currentProblem.problemId]: event.target.value }))}
                  disabled={isCurrentProblemVerified || verifying}
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-700 bg-[#060b19] px-4 py-3 font-mono text-sm text-amber-200 outline-none focus:border-amber-400 disabled:opacity-60"
                  placeholder="Enter the expected output"
                />
              </label>
              <p className="text-xs text-slate-400">This output question is an answer-checking simplification, not a substitute for running a complete program against multiple test cases.</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Decode The Rule (Transformation Matrix) */}
      <div className="cyber-card p-6 sm:p-8 rounded-2xl border-cyan-500/40 space-y-6 bg-slate-950/90 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono uppercase">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            STEP 2: DECODE THE RULE — TRANSFORMATION MATRIX
          </div>
          <h3 className="text-xl sm:text-2xl font-orbitron font-bold text-white">
            CALCULATE THE IMPERIAL MASTER KEY
          </h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Once all three programs are verified, the transformation rule is unlocked. Apply the rule to calculate the Final Code.
          </p>
        </div>

        {/* 3 Extracted Values Pill */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[130px]">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Program 1 Output</div>
            <div className="text-2xl font-orbitron font-bold text-amber-300 mt-1">
              {verifiedMap['r4-p1']?.verified ? verifiedMap['r4-p1'].output : 'LOCKED'}
            </div>
          </div>
          <div className="text-slate-600 font-bold text-xl">+</div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[130px]">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Program 2 Output</div>
            <div className="text-2xl font-orbitron font-bold text-amber-300 mt-1">
              {verifiedMap['r4-p2']?.verified ? verifiedMap['r4-p2'].output : 'LOCKED'}
            </div>
          </div>
          <div className="text-slate-600 font-bold text-xl">+</div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[130px]">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Program 3 Output</div>
            <div className="text-2xl font-orbitron font-bold text-amber-300 mt-1">
              {verifiedMap['r4-p3']?.verified ? verifiedMap['r4-p3'].output : 'LOCKED'}
            </div>
          </div>
        </div>

        {/* Unlocked Formula or Locked State */}
        {allProblemsSolved ? (
          <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-500/50 text-center max-w-xl mx-auto space-y-2 animate-pulse">
            <div className="text-xs font-mono font-bold text-purple-300 flex items-center justify-center gap-2">
              <Unlock className="w-4 h-4 text-purple-400" />
              UNLOCKED TRANSFORMATION RULE:
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-purple-500/30 text-amber-300 font-mono font-bold text-sm sm:text-base">
              {transformationRule || 'FINAL CODE = (PROGRAM 1 OUTPUT × 10) + PROGRAM 2 OUTPUT + PROGRAM 3 OUTPUT'}
            </div>
            <p className="text-xs text-slate-400">
              Apply this transformation rule to the three extracted values above to compute the Final Code.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center max-w-lg mx-auto text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            Complete and verify all three coding programs to reveal the transformation rule.
          </div>
        )}

        {/* Final Code Entry & Submit Button */}
        <div className="max-w-md mx-auto space-y-3 pt-2">
          <label className="block text-xs font-mono text-amber-300 text-center uppercase tracking-wider">
            Enter Computed Final Master Key
          </label>
          <input
            type="text"
            disabled={!allProblemsSolved}
            placeholder={allProblemsSolved ? "e.g. 134" : "Verify all 3 programs first"}
            value={enteredFinalCode}
            onChange={e => setEnteredFinalCode(e.target.value)}
            className="w-full text-center text-2xl sm:text-3xl font-orbitron font-black tracking-widest py-3 rounded-xl bg-slate-950 border-2 border-amber-400 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          />

          <button
            onClick={handleSubmitFinalCode}
            disabled={!allProblemsSolved || !enteredFinalCode.trim() || transmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-orbitron font-extrabold text-sm tracking-wider shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {transmitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4" />
                TRANSMIT FINAL CODE & CLAIM VICTORY
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
