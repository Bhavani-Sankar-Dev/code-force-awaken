import React, { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Participant, Round4Question } from '../types';
import { apiFetch } from '../utils/api';
import { sound } from '../utils/sound';

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
  onBackToDashboard,
}) => {
  const [problem, setProblem] = useState<Round4Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const forceSubmittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const loadChallenge = async () => {
      try {
        const [challengeResponse, timerResponse] = await Promise.all([
          apiFetch('/api/round4/challenge'),
          apiFetch('/api/timer/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round: 4 }),
          }),
        ]);
        const challenge = await challengeResponse.json();
        const timer = await timerResponse.json();
        if (!challengeResponse.ok) throw new Error(challenge.error || 'Could not load the final challenge.');
        if (!timerResponse.ok) throw new Error(timer.error || 'Could not start the server timer.');
        if (!cancelled) setProblem(challenge.problems?.[0] ?? null);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load the final challenge.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadChallenge();
    return () => { cancelled = true; };
  }, [participant.participantId]);

  const submitAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!problem || submitting) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    sound.playClick();
    try {
      const response = await apiFetch('/api/round4/verify-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.participantId,
          problemId: problem.problemId,
          answer,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not submit the algorithm explanation.');
      if (!result.success) {
        sound.playWarning();
        setMessage(result.message || 'Your explanation needs more of the requested algorithm details.');
        return;
      }
      sound.playVictory();
      onUpdateParticipant(result.participant);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit the algorithm explanation.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleForceSubmit = async (event: Event) => {
      const { participantId } = (event as CustomEvent<{ participantId: string }>).detail;
      if (participantId !== participant.participantId || forceSubmittingRef.current) return;
      forceSubmittingRef.current = true;
      try {
        const response = await apiFetch('/api/round4/force-submit', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not submit Round 4.');
        if (result.participant) onUpdateParticipant(result.participant);
        onBackToDashboard();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Could not submit Round 4.');
      } finally {
        forceSubmittingRef.current = false;
      }
    };
    window.addEventListener('participant-force-submit', handleForceSubmit);
    return () => window.removeEventListener('participant-force-submit', handleForceSubmit);
  }, [participant.participantId, onUpdateParticipant, onBackToDashboard]);

  if (loading) {
    return <div className="py-20 text-center font-mono text-amber-300">Loading the final challenge…</div>;
  }

  if (participant.round4Status === 'completed') {
    return (
      <section className="relative z-10 max-w-3xl mx-auto px-4 py-12 text-center cyber-card rounded-2xl space-y-6">
        <Trophy className="mx-auto h-14 w-14 text-amber-300" />
        <h2 className="text-3xl font-orbitron font-bold text-amber-200">Final round complete</h2>
        <p className="text-slate-300">Your Round 4 score: {participant.round4Score} points.</p>
        <div className="flex justify-center gap-3">
          <button onClick={onViewLeaderboard} className="rounded-lg bg-amber-400 px-5 py-3 font-bold text-slate-950">View leaderboard</button>
          <button onClick={onBackToDashboard} className="rounded-lg border border-slate-600 px-5 py-3 text-slate-200">Return to dashboard</button>
        </div>
      </section>
    );
  }

  if (error && !problem) {
    return <div role="alert" className="mx-auto max-w-xl p-8 text-center text-red-300">{error}</div>;
  }

  if (!problem) {
    return <div role="alert" className="mx-auto max-w-xl p-8 text-center text-red-300">The final challenge is unavailable.</div>;
  }

  return (
    <main className="relative z-10 mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="cyber-card space-y-3 rounded-2xl border border-amber-500/40 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-300">Round 4 · Final challenge · {problem.difficulty}</p>
        <h1 className="text-2xl font-orbitron font-bold text-white">{problem.title}</h1>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{problem.description}</p>
        <p className="font-mono text-sm text-amber-200">+{problem.points} points</p>
      </header>

      <form onSubmit={submitAnswer} className="cyber-card space-y-4 rounded-2xl border border-slate-700 p-6">
        <label htmlFor="round4-answer" className="block font-mono text-sm font-bold text-cyan-200">Explain your algorithm in plain English</label>
        <p className="text-sm text-slate-400">{problem.answerPrompt}</p>
        <textarea
          id="round4-answer"
          value={answer}
          onChange={event => setAnswer(event.target.value)}
          maxLength={2000}
          rows={7}
          required
          disabled={submitting}
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm leading-relaxed text-slate-100 outline-none focus:border-cyan-400 disabled:opacity-60"
          placeholder="Describe the window, how you handle repeats, and how you keep track of the best length…"
        />
        <p className="text-xs text-slate-500">No Python or other code is needed. Your explanation is checked against required algorithm concepts, not executed.</p>
        {message && <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-950/40 p-3 text-sm text-amber-200">{message}</p>}
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !answer.trim()}
          className="rounded-xl bg-amber-400 px-6 py-3 font-orbitron text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Checking answer…' : 'Submit algorithm'}
        </button>
      </form>
    </main>
  );
};
