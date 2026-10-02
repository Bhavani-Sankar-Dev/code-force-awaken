import React, { useState } from 'react';
import { Participant } from '../types';
import { sound } from '../utils/sound';
import { KeyRound, Terminal, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (participant: Participant) => void;
  setCurrentTab: (tab: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, setCurrentTab }) => {
  const [participantCode, setParticipantCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantCode.trim() || loading) return;

    sound.playClick();
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantCode: participantCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid recovery ID.');
      sound.playSuccess();
      onLoginSuccess(data.participant);
    } catch (err: unknown) {
      sound.playWarning();
      setErrorMessage((err as Error).message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 max-w-lg mx-auto px-4 py-16">
      <div className="cyber-card p-6 sm:p-8 rounded-2xl shadow-2xl border-cyan-500/30">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-3">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            RECOVER PARTICIPANT SESSION
          </div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-extrabold text-white tracking-wider">
            PARTICIPANT LOGIN
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Enter the unique recovery ID issued when you registered. Your existing competition attempt will resume.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/60 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-orbitron font-bold">ACCESS DENIED</div>
              <div className="text-xs mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-2 uppercase">Participant Recovery ID</label>
            <input
              type="text"
              required
              maxLength={64}
              autoComplete="off"
              placeholder="CFA-..."
              value={participantCode}
              onChange={e => setParticipantCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 font-mono text-center tracking-widest text-base outline-none transition-all uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-bold text-sm tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                RESUME COMPETITION
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCurrentTab('register');
              }}
              className="text-xs font-mono text-slate-400 hover:text-cyan-300"
            >
              Not registered yet? Register for the competition →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
