import React, { useState } from 'react';
import { Participant } from '../types';
import { sound } from '../utils/sound';
import { 
  Zap, 
  Trophy, 
  ShieldAlert, 
  Terminal, 
  User, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Lock, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  participant: Participant | null;
  onLogout: () => void;
  testMode?: boolean;
  isAdminAuthenticated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  participant,
  onLogout,
  testMode = false,
  isAdminAuthenticated
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(sound.enabled);

  const toggleSound = () => {
    sound.enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) sound.playClick();
  };

  const handleNav = (tab: string) => {
    sound.playClick();
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#030712]/90 backdrop-blur-md border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & AIKYA Brand */}
          <div 
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-400/50 transition-all">
              <div className="w-full h-full bg-[#0a101f] rounded-[7px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black text-sm sm:text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400">
                  CODE FORCE
                </span>
                <span className="text-[10px] font-orbitron font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 tracking-wider">
                  AWAKEN
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="text-purple-400 font-semibold">AIKYA 2026</span>
                <span>•</span>
                <span className="text-slate-400">CHAMPIONSHIP</span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNav('home')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                OVERVIEW
              </span>
            </button>

            {participant ? (
              <button
                onClick={() => handleNav('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  ['dashboard', 'round1', 'round2', 'round3', 'round4'].includes(currentTab)
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  COMMAND ARENA
                </span>
              </button>
            ) : null}

            <button
              onClick={() => handleNav('leaderboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                currentTab === 'leaderboard'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                ARCHIVES
              </span>
            </button>

            <button
              onClick={() => handleNav('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                currentTab === 'admin'
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                COMMAND CENTER
              </span>
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            {testMode && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-mono animate-pulse">
                TEST SIMULATOR
              </span>
            )}

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={audioEnabled ? "Mute SFX" : "Enable SFX"}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile or Enlist Button */}
            {participant ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 rounded-xl px-2.5 py-1">
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 text-[10px] font-bold">
                  {participant.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-mono font-bold text-slate-200 leading-tight">
                    {participant.rollNumber}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono leading-tight">
                    Score: {participant.totalScore}
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    onLogout();
                  }}
                  title="Logout Cadet"
                  className="p-1 hover:text-red-400 text-slate-500 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-950/60 transition-colors"
                >
                  LOGIN
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-bold text-xs tracking-wider shadow-md shadow-cyan-500/20 transition-all"
                >
                  ENLIST
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-cyan-500/20 bg-[#060b19] px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-900"
          >
            OVERVIEW
          </button>
          {participant && (
            <button
              onClick={() => handleNav('dashboard')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono text-cyan-300 hover:bg-slate-900"
            >
              COMMAND ARENA
            </button>
          )}
          <button
            onClick={() => handleNav('leaderboard')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-900"
          >
            ARCHIVES (LEADERBOARD)
          </button>
          <button
            onClick={() => handleNav('admin')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono text-purple-300 hover:bg-slate-900"
          >
            COMMAND CENTER (ORGANIZER)
          </button>
        </div>
      )}
    </header>
  );
};
