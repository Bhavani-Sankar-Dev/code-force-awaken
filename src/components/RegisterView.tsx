import React, { useState } from 'react';
import { Participant } from '../types';
import { sound } from '../utils/sound';
import { User, School, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface RegisterViewProps {
  onRegisterSuccess: (participant: Participant, participantCode: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegisterSuccess,
  setCurrentTab
}) => {
  const [formData, setFormData] = useState({ name: '', college: '', rollNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      if (typeof data.participantCode !== 'string' || !data.participant) {
        throw new Error('Registration succeeded, but the recovery ID was not returned. Contact the event organizer before retrying.');
      }
      sound.playSuccess();
      onRegisterSuccess(data.participant, data.participantCode);
    } catch (err: unknown) {
      sound.playWarning();
      setErrorMessage((err as Error).message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(current => ({ ...current, [field]: value }));
  };

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
      <div className="cyber-card p-6 sm:p-10 rounded-2xl shadow-2xl border-cyan-500/30">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            CADET ENLISTMENT MANIFEST
          </div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-extrabold text-white tracking-wider">
            REGISTER FOR CODE FORCE AWAKEN
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Register with your full name, college name, and college roll number.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/60 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-orbitron font-bold">REGISTRATION REJECTED</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1.5 uppercase">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 text-sm outline-none transition-all placeholder:text-slate-600 font-sans"
              />
              <User className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1.5 uppercase">College Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={160}
                autoComplete="organization"
                placeholder="Enter your college name"
                value={formData.college}
                onChange={e => updateField('college', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 text-sm outline-none transition-all placeholder:text-slate-600 font-sans"
              />
              <School className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1.5 uppercase">College Roll Number *</label>
            <input
              type="text"
              required
              maxLength={64}
              autoComplete="off"
              placeholder="Enter your college roll number"
              value={formData.rollNumber}
              onChange={e => updateField('rollNumber', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 text-sm outline-none transition-all placeholder:text-slate-600 font-mono uppercase"
            />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Your competition attempt will be assigned automatically. Your recovery ID will be shown after registration; save it to sign in on another browser.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-bold text-sm tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                REGISTERING...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                REGISTER & ENTER
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCurrentTab('login');
              }}
              className="text-xs font-mono text-slate-400 hover:text-cyan-300"
            >
              Already registered? Sign in with your recovery ID →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
