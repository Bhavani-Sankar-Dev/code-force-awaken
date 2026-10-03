import React, { useState, useEffect } from 'react';
import { Participant, Slot, EventConfig } from './types';
import { initialSlots, initialEventConfig } from './data/publicConfig';
import { Starfield } from './components/Starfield';
import { Navbar } from './components/Navbar';
import { IntegritySentinel } from './components/IntegritySentinel';
import { HomeView } from './components/HomeView';
import { RegisterView } from './components/RegisterView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { Round1Arena } from './components/Round1Arena';
import { Round2Arena } from './components/Round2Arena';
import { Round3Arena } from './components/Round3Arena';
import { Round4Arena } from './components/Round4Arena';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminView } from './components/AdminView';
import { apiFetch } from './utils/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [eventConfig, setEventConfig] = useState<EventConfig>(initialEventConfig);
  const [serverTime, setServerTime] = useState<string>(new Date().toISOString());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => !!localStorage.getItem('codeforce_admin_token'));

  // Sync state with backend
  const fetchState = async () => {
    try {
      const res = await apiFetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.slots) setSlots(data.slots);
        if (data.eventConfig) setEventConfig(data.eventConfig);
        if (data.serverTime) setServerTime(data.serverTime);
      }
    } catch (err) {
      console.warn('Backend state fetch error, using local fallback:', err);
    }
  };

  useEffect(() => {
    if (window.location.hash === '#admin') {
      setCurrentTab('admin');
    }
    fetchState();
    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const adminCheck = setInterval(() => {
      setIsAdminAuthenticated(!!localStorage.getItem('codeforce_admin_token'));
    }, 1000);
    return () => clearInterval(adminCheck);
  }, []);

  // Restore the server-owned session through its HttpOnly cookie.
  useEffect(() => {
    apiFetch('/api/session')
      .then(async res => {
        if (res.status === 401) return;
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not restore participant session.');
        if (data.participant) setParticipant(data.participant);
      })
      .catch(err => console.error('Participant session recovery failed:', err));
  }, []);

  const handleRegisterSuccess = (newParticipant: Participant, newRecoveryCode: string) => {
    setParticipant(newParticipant);
    setRecoveryCode(newRecoveryCode);
    setCurrentTab('dashboard');
  };

  const handleLoginSuccess = (existingParticipant: Participant) => {
    setParticipant(existingParticipant);
    setRecoveryCode(null);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setParticipant(null);
    setRecoveryCode(null);
    apiFetch('/api/logout', { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('Could not end the participant session.');
      })
      .catch(err => console.error('Participant logout failed:', err));
    setCurrentTab('home');
  };

  const handleUpdateParticipant = (updated: Participant) => {
    setParticipant(updated);
  };

  const handleEnterRound = (roundNum: number) => {
    if (!participant) {
      setCurrentTab('login');
      return;
    }

    if (roundNum === 1) {
      setCurrentTab('round1');
      return;
    }

    if (roundNum === 2) {
      if (participant.round1Status !== 'completed' || participant.round1Score < eventConfig.round1MinScore) {
        alert('Access denied: You must qualify Round 1 before attempting The Jedi Trial.');
        return;
      }
      setCurrentTab('round2');
      return;
    }

    if (roundNum === 3) {
      if (participant.round2Status !== 'completed' || participant.round2SolvedCount !== 3) {
        alert('Access denied: Complete all three Round 2 problems with no more than two failed test cases per problem.');
        return;
      }
      setCurrentTab('round3');
      return;
    }

    if (roundNum === 4) {
      const minPassingScore = Math.round(30 * (eventConfig.round3MinPercent / 100));
      if (participant.round3Status !== 'completed' || participant.round3Score < minPassingScore || participant.round3SolvedCount < 2) {
        alert('Access denied: You must qualify Round 3 before attempting The Final Key.');
        return;
      }
      setCurrentTab('round4');
      return;
    }
  };

  const isExamRound = ['round1', 'round2', 'round3', 'round4'].includes(currentTab);

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-cyan-500 selection:text-black flex flex-col font-rajdhani">
      {/* Dynamic Starfield Canvas */}
      <Starfield />

      {/* Cyberpunk Scanlines */}
      <div className="fixed inset-0 scanlines pointer-events-none z-40 opacity-40" />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        participant={participant}
        onLogout={handleLogout}
        testMode={eventConfig.testMode}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Proctoring Integrity Sentinel */}
      <IntegritySentinel
        participant={participant}
        isActiveRound={isExamRound}
        onViolationRecorded={v => {
          if (participant) {
            setParticipant({ ...participant, integrityViolations: v });
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <HomeView
            setCurrentTab={setCurrentTab}
            participant={participant}
            eventConfig={eventConfig}
          />
        )}

        {currentTab === 'register' && (
          <RegisterView
            onRegisterSuccess={handleRegisterSuccess}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'dashboard' && participant && (
          <DashboardView
            participant={participant}
            recoveryCode={recoveryCode}
            slots={slots}
            eventConfig={eventConfig}
            serverTime={serverTime}
            onEnterRound={handleEnterRound}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'round1' && participant && (
          <Round1Arena
            participant={participant}
            onUpdateParticipant={handleUpdateParticipant}
            onProceedToRound2={() => handleEnterRound(2)}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'round2' && participant && (
          <Round2Arena
            participant={participant}
            onUpdateParticipant={handleUpdateParticipant}
            onProceedToRound3={() => handleEnterRound(3)}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'round3' && participant && (
          <Round3Arena
            participant={participant}
            onUpdateParticipant={handleUpdateParticipant}
            onProceedToRound4={() => handleEnterRound(4)}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'round4' && participant && (
          <Round4Arena
            participant={participant}
            onUpdateParticipant={handleUpdateParticipant}
            onViewLeaderboard={() => setCurrentTab('leaderboard')}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView />
        )}

        {currentTab === 'admin' && (
          <AdminView onRefreshState={fetchState} />
        )}
      </main>

      {/* Imperial Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 bg-slate-950/80 backdrop-blur-md py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-400 font-bold">AIKYA 2026 IMPERIAL MAINFRAME</span>
            <span>•</span>
            <span>CODE FORCE AWAKEN EDITION</span>
          </div>

          <div className="text-slate-500 text-[11px]">
            Server Time: {new Date(serverTime).toLocaleTimeString()} IST (Asia/Kolkata)
          </div>

          <div>
            <button
              onClick={() => {
                setCurrentTab('admin');
                window.location.hash = '#admin';
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              [Organizer Portal]
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
