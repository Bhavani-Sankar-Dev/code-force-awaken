import React from 'react';
import { Participant, Slot, EventConfig } from '../types';
import { sound } from '../utils/sound';
import { 
  Terminal, 
  CheckCircle2, 
  Lock, 
  AlertTriangle, 
  Clock, 
  Trophy, 
  ArrowRight, 
  Shield, 
  Flame, 
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  participant: Participant;
  recoveryCode?: string | null;
  slots: Slot[];
  eventConfig: EventConfig;
  serverTime: string;
  onEnterRound: (roundNum: number) => void;
  setCurrentTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  participant,
  recoveryCode,
  slots,
  eventConfig,
  serverTime,
  onEnterRound,
  setCurrentTab
}) => {
  const currentSlot = slots.find(s => s.slotId === participant.slotId);

  // Time calculations with override support
  const nowMs = new Date(serverTime || Date.now()).getTime();
  const isSlotActive = currentSlot?.isActiveOverride || currentSlot?.computedStatus === 'active' || eventConfig.testMode;

  // Qualification status
  const r1Qualified = participant.round1Status === 'completed' && participant.round1Score >= eventConfig.round1MinScore;
  const r2Qualified = participant.round2Status === 'completed' && participant.round2SolvedCount === 3;
  const r3PassingScore = Math.round(30 * (eventConfig.round3MinPercent / 100));
  const r3Qualified = participant.round3Status === 'completed'
    && participant.round3Score >= r3PassingScore
    && participant.round3SolvedCount >= 2;
  const r4Completed = participant.round4Status === 'completed';

  const handleLaunch = (round: number) => {
    sound.playLaser();
    onEnterRound(round);
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cadet Dossier Banner */}
      <div className="cyber-card p-6 rounded-2xl shadow-xl border-cyan-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-[#060b19] rounded-[14px] flex items-center justify-center font-orbitron font-extrabold text-xl text-cyan-400">
                {participant.name.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white tracking-wide">
                  {participant.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {participant.rollNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono text-purple-300 bg-purple-950/80 border border-purple-500/30">
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{participant.college}</span>
                {participant.branch && <><span>•</span><span>{participant.branch}{participant.year ? ` (${participant.year})` : ''}</span></>}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cluster */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs font-mono text-slate-400">TOTAL SCORE</div>
              <div className="text-xl sm:text-2xl font-orbitron font-black text-amber-400">
                {participant.totalScore} <span className="text-xs text-slate-500 font-mono">/ 105</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs font-mono text-slate-400">INTEGRITY</div>
              <div className={`text-xl sm:text-2xl font-orbitron font-black ${
                participant.integrityViolations > 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {participant.integrityViolations} <span className="text-xs text-slate-500 font-mono">VIOLATIONS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {recoveryCode && (
        <div className="cyber-card p-5 rounded-2xl border-amber-500/50 bg-amber-950/20">
          <h3 className="font-orbitron font-bold text-amber-200">SAVE YOUR PARTICIPANT RECOVERY ID</h3>
          <p className="text-sm text-slate-300 mt-2">
            This ID is shown only after registration. Save it somewhere safe; you need it to sign in if this browser session is lost.
          </p>
          <code className="block mt-3 p-3 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-sm break-all select-all">
            {recoveryCode}
          </code>
        </div>
      )}

      {/* Sector Live Status Notice */}
      <div className={`cyber-card p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isSlotActive ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-amber-500/40 bg-amber-950/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full shrink-0 ${isSlotActive ? 'bg-green-400 animate-ping' : 'bg-amber-400'}`} />
          <div className="text-xs sm:text-sm font-mono text-slate-200">
            <span className="font-bold text-cyan-300">COMPETITION STATUS: </span>
            {isSlotActive ? (
              <span className="text-green-300 font-bold">MISSION WINDOW ACTIVE — EXAMINATION OPEN</span>
            ) : (
              <span className="text-amber-300">
                {currentSlot ? `Your competition opens at ${currentSlot.startTime} IST` : 'Awaiting competition schedule'}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Server Sync: {new Date(serverTime).toLocaleTimeString()} IST
        </div>
      </div>

      {/* 4 Mission Stages Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            CHAMPIONSHIP ARENA PROGRESSION
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Current Stage: Round {participant.currentRound}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Round 1 Card */}
          <div className={`cyber-card p-6 rounded-2xl border transition-all ${
            participant.round1Status === 'completed'
              ? 'border-green-500/40 bg-green-950/10'
              : 'border-cyan-500/40 hover:border-cyan-400'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                STAGE 01
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                participant.round1Status === 'completed'
                  ? r1Qualified ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {participant.round1Status === 'completed'
                  ? r1Qualified ? 'QUALIFIED' : 'UNQUALIFIED'
                  : 'UNLOCKED'}
              </span>
            </div>

            <h4 className="text-lg font-orbitron font-bold text-white mb-1">
              ROUND 1: THE AWAKENING
            </h4>
            <p className="text-xs text-slate-400 font-sans mb-4">
              9 Algorithmic Cognitive Questions: Output Prediction, Scrambled Code Ordering, and Logic Decoders.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500">Score Earned: </span>
                <span className="text-cyan-300 font-bold">{participant.round1Score} / 30</span>
              </div>
              <div>
                <span className="text-slate-500">Threshold: </span>
                <span className="text-slate-300">≥ {eventConfig.round1MinScore} PTS</span>
              </div>
            </div>

            <button
              onClick={() => handleLaunch(1)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-orbitron font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <Terminal className="w-4 h-4" />
              {participant.round1Status === 'completed' ? 'REVIEW ROUND 1 TELEMETRY' : 'ENTER THE AWAKENING'}
            </button>
          </div>

          {/* Round 2 Card */}
          <div className={`cyber-card p-6 rounded-2xl border transition-all ${
            participant.round2Status === 'completed'
              ? 'border-green-500/40 bg-green-950/10'
              : r1Qualified
              ? 'border-blue-500/40 hover:border-blue-400'
              : 'border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                STAGE 02
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                participant.round2Status === 'completed'
                  ? r2Qualified ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  : r1Qualified ? 'bg-blue-900 text-blue-200' : 'bg-slate-800 text-slate-500'
              }`}>
                {participant.round2Status === 'completed'
                  ? r2Qualified ? 'QUALIFIED' : 'UNQUALIFIED'
                  : r1Qualified ? 'UNLOCKED' : 'LOCKED (NEED R1)'}
              </span>
            </div>

            <h4 className="text-lg font-orbitron font-bold text-white mb-1">
              ROUND 2: THE JEDI TRIAL
            </h4>
            <p className="text-xs text-slate-400 font-sans mb-4">
              Predict the output for all 3 fixed-input algorithm questions to qualify.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500">Score Earned: </span>
                <span className="text-blue-300 font-bold">{participant.round2Score} / 30</span>
              </div>
              <div>
                <span className="text-slate-500">Required: </span>
                <span className="text-slate-300">All 3 problems</span>
              </div>
            </div>

            <button
              onClick={() => handleLaunch(2)}
              disabled={!r1Qualified}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-black font-orbitron font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            >
              {r1Qualified ? <Terminal className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {participant.round2Status === 'completed' ? 'REVIEW JEDI TRIAL' : 'ENTER THE JEDI TRIAL'}
            </button>
          </div>

          {/* Round 3 Card */}
          <div className={`cyber-card p-6 rounded-2xl border transition-all ${
            participant.round3Status === 'completed'
              ? 'border-green-500/40 bg-green-950/10'
              : r2Qualified
              ? 'border-purple-500/40 hover:border-purple-400'
              : 'border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                STAGE 03
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                participant.round3Status === 'completed'
                  ? r3Qualified ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  : r2Qualified ? 'bg-purple-900 text-purple-200' : 'bg-slate-800 text-slate-500'
              }`}>
                {participant.round3Status === 'completed'
                  ? r3Qualified ? 'QUALIFIED' : 'UNQUALIFIED'
                  : r2Qualified ? 'UNLOCKED' : 'LOCKED (NEED R2)'}
              </span>
            </div>

            <h4 className="text-lg font-orbitron font-bold text-white mb-1">
              ROUND 3: THE HIDDEN FORCE
            </h4>
            <p className="text-xs text-slate-400 font-sans mb-4">
              Corrupted logic restoration: Shield Resonance Binary Search & Asteroid Maximum Energy Kadane Surge.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500">Score Earned: </span>
                <span className="text-purple-300 font-bold">{participant.round3Score} / 30</span>
              </div>
              <div>
                <span className="text-slate-500">Threshold: </span>
                <span className="text-slate-300">≥ {r3PassingScore} PTS (40%)</span>
              </div>
            </div>

            <button
              onClick={() => handleLaunch(3)}
              disabled={!r2Qualified}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-orbitron font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
            >
              {r2Qualified ? <Terminal className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {participant.round3Status === 'completed' ? 'REVIEW HIDDEN FORCE' : 'ENTER THE HIDDEN FORCE'}
            </button>
          </div>

          {/* Round 4 Card */}
          <div className={`cyber-card p-6 rounded-2xl border transition-all ${
            r4Completed
              ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/20'
              : r3Qualified
              ? 'border-amber-500/40 hover:border-amber-400'
              : 'border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                FINAL STAGE 04
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                r4Completed
                  ? 'bg-amber-500 text-black font-extrabold animate-pulse'
                  : r3Qualified ? 'bg-amber-900 text-amber-200' : 'bg-slate-800 text-slate-500'
              }`}>
                {r4Completed ? 'VICTORY SECURED' : r3Qualified ? 'UNLOCKED' : 'LOCKED (NEED R3)'}
              </span>
            </div>

            <h4 className="text-lg font-orbitron font-bold text-white mb-1">
              ROUND 4: THE FINAL KEY
            </h4>
            <p className="text-xs text-slate-400 font-sans mb-4">
              Solve 3 fixed-input DSA output questions, unlock the imperial transformation matrix, and decipher the Final Master Key.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-500">Score Earned: </span>
                <span className="text-amber-300 font-bold">{participant.round4Score} / 15</span>
              </div>
              <div>
                <span className="text-slate-500">Final Key: </span>
                <span className="text-amber-400 font-bold">{participant.round4SolvedKey ? participant.round4SolvedKey : 'PENDING'}</span>
              </div>
            </div>

            <button
              onClick={() => handleLaunch(4)}
              disabled={!r3Qualified}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-black font-orbitron font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
            >
              {r3Qualified ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {r4Completed ? 'VIEW IMPERIAL VICTORY MANIFEST' : 'EXECUTE THE FINAL KEY'}
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard CTA */}
      <div className="cyber-card p-6 rounded-2xl border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-orbitron font-bold text-white">LIVE ARCHIVES SYNCHRONIZED</h4>
          <p className="text-xs font-sans text-slate-400 mt-1">
            Compare your standing against all championship participants.
          </p>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            setCurrentTab('leaderboard');
          }}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-orbitron font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <Trophy className="w-4 h-4" />
          OPEN IMPERIAL LEADERBOARD
        </button>
      </div>
    </div>
  );
};
