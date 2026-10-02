import React from 'react';
import { EventConfig, Participant } from '../types';
import { sound } from '../utils/sound';
import { 
  Zap, 
  Terminal, 
  Brain, 
  Key, 
  Trophy, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles,
  Layers,
  Code2,
  Lock
} from 'lucide-react';

interface HomeViewProps {
  setCurrentTab: (tab: string) => void;
  participant: Participant | null;
  eventConfig: EventConfig;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setCurrentTab,
  participant,
  eventConfig
}) => {
  const round3PassingScore = Math.round(30 * eventConfig.round3MinPercent / 100);
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 pb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AIKYA 2026 OFFICIAL PROGRAMMING CHAMPIONSHIP</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-orbitron font-black tracking-tight text-white uppercase">
          CODE FORCE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-500">
            AWAKEN
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
          Four rounds of algorithm challenges: predict outputs, complete code fragments,
          and solve fixed-input DSA questions to forge the Final Key.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {participant ? (
            <button
              onClick={() => {
                sound.playClick();
                setCurrentTab('dashboard');
              }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-extrabold text-sm tracking-wider shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              LAUNCH COMMAND ARENA
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  sound.playClick();
                  setCurrentTab('register');
                }}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-extrabold text-sm tracking-wider shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                ENLIST AS CADET
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setCurrentTab('login');
                }}
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-orbitron font-bold text-xs sm:text-sm tracking-wider transition-all cursor-pointer"
              >
                CADET TERMINAL LOGIN
              </button>
            </>
          )}
          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('leaderboard');
            }}
            className="px-6 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-amber-300 border border-amber-500/40 font-orbitron font-bold text-xs sm:text-sm tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            VIEW ARCHIVES
          </button>
        </div>

        {/* Quick Stats Pill */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-center">
            <div className="text-xl sm:text-2xl font-orbitron font-bold text-cyan-400">4</div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Mission Rounds</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-500/20 text-center">
            <div className="text-xl sm:text-2xl font-orbitron font-bold text-purple-400">105 PTS</div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Maximum Score</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-green-500/20 text-center">
            <div className="text-xl sm:text-2xl font-orbitron font-bold text-green-400">AIKYA '26</div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Annual Trophy</div>
          </div>
        </div>
      </section>

      {/* 4 Rounds Progression Blueprint */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">CHAMPIONSHIP MISSION PATHWAY</div>
          <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
            THE 4 JEDI STAGES
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Each round unlocks after its score and completion requirements are met.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Round 1 */}
          <div className="cyber-card p-6 rounded-2xl flex flex-col justify-between border-cyan-500/30 group hover:border-cyan-400 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  ROUND 01
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">30 MARKS</span>
              </div>
              <div>
                <h3 className="text-lg font-orbitron font-bold text-white group-hover:text-cyan-300 transition-colors">
                  THE AWAKENING
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Fast-paced cognitive trials testing syntax knowledge, loop order, and logic formulas.
                </p>
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">▪</span> 3 Output Predictions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">▪</span> 3 Code Reconstructions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">▪</span> 3 Logic Decoders
                </li>
              </ul>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Qualify:</span>
              <span className="text-cyan-300 font-bold">≥ {eventConfig.round1MinScore} Marks</span>
            </div>
          </div>

          {/* Round 2 */}
          <div className="cyber-card p-6 rounded-2xl flex flex-col justify-between border-blue-500/30 group hover:border-blue-400 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                  ROUND 02
                </span>
                <span className="text-xs font-mono text-blue-400 font-bold">30 MARKS</span>
              </div>
              <div>
                <h3 className="text-lg font-orbitron font-bold text-white group-hover:text-blue-300 transition-colors">
                  THE JEDI TRIAL
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Solve three classic algorithm questions by predicting the output for each displayed input.
                </p>
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">▪</span> Even Number Check
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">▪</span> Second Largest Distinct
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">▪</span> Custom Bubble Sort
                </li>
              </ul>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Qualify:</span>
              <span className="text-blue-300 font-bold">All 3 solved; ≤2 failed tests each</span>
            </div>
          </div>

          {/* Round 3 */}
          <div className="cyber-card p-6 rounded-2xl flex flex-col justify-between border-purple-500/30 group hover:border-purple-400 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                  ROUND 03
                </span>
                <span className="text-xs font-mono text-purple-400 font-bold">30 MARKS</span>
              </div>
              <div>
                <h3 className="text-lg font-orbitron font-bold text-white group-hover:text-purple-300 transition-colors">
                  THE HIDDEN FORCE
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Reverse engineer corrupted subroutines. Fix off-by-one errors and implement Kadane's maximum subarray surge.
                </p>
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">▪</span> Binary Search Calibration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">▪</span> Asteroid Field Kadane Surge
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">▪</span> Accepted code fragments
                </li>
              </ul>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Qualify:</span>
              <span className="text-purple-300 font-bold">≥ {round3PassingScore} Marks + 2 solved</span>
            </div>
          </div>

          {/* Round 4 */}
          <div className="cyber-card p-6 rounded-2xl flex flex-col justify-between border-amber-500/30 group hover:border-amber-400 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                  ROUND 04
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">15 MARKS</span>
              </div>
              <div>
                <h3 className="text-lg font-orbitron font-bold text-white group-hover:text-amber-300 transition-colors">
                  THE FINAL KEY
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Predict the output for three DSA questions. Apply the unlocked transformation rule to seal the key.
                </p>
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">▪</span> Count Positive Numbers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">▪</span> Find First Character
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">▪</span> Simple Interest Formula
                </li>
              </ul>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Objective:</span>
              <span className="text-amber-300 font-bold">Imperial Victory</span>
            </div>
          </div>
        </div>
      </section>

      {/* Integrity Codex */}
      <section className="cyber-card p-6 sm:p-8 rounded-2xl border-cyan-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
          <h3 className="font-orbitron font-bold text-lg text-white">
            AIKYA IMPERIAL INTEGRITY CODEX
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          CODE FORCE AWAKEN enforces autonomous terminal proctoring. The exam environment actively monitors
          window blur, tab switching, and unauthorized multitasking. Exceeding 3 sentinel violations will flag
          your telemetry for imperial disqualification. All submissions are automatically evaluated against
          hidden benchmarks with strict time complexity checks.
        </p>
      </section>
    </div>
  );
};
