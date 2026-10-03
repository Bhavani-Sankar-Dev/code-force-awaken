import React, { useState, useEffect, useMemo } from 'react';
import { Participant, EventConfig } from '../types';
import { sound } from '../utils/sound';
import { apiFetch } from '../utils/api';
import { 
  Lock,
  Settings,
  Trash2,
  CheckCircle2,
  Sparkles,
  LogOut,
  Save,
  AlertTriangle,
  Play,
  Search,
  Download,
  RefreshCw,
  Eye,
  Trophy,
  X,
  Medal
} from 'lucide-react';

type AdminParticipant = Participant & {
  roundElapsedSeconds?: Partial<Record<1 | 2 | 3 | 4, number>>;
};

type ParticipantOutcome = 'finalist' | 'eliminated' | 'in_progress' | 'registered' | 'disqualified';

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(remainingSeconds).padStart(2, '0')}s`
    : `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
};

interface AdminViewProps {
  onRefreshState: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onRefreshState }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('codeforce_admin_token') || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'participants' | 'simulator'>('overview');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [participantFilter, setParticipantFilter] = useState<'all' | ParticipantOutcome>('all');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<{
    stats: { totalParticipants: number; completedRounds: number; qualifiedCount: number };
    participants: AdminParticipant[];
    eventConfig: EventConfig;
  } | null>(null);

  // Form states
  const [r1MinScore, setR1MinScore] = useState(12);
  const [r3MinPercent, setR3MinPercent] = useState(40);
  const [r2TimerMinutes, setR2TimerMinutes] = useState(20);
  const [r3TimerMinutes, setR3TimerMinutes] = useState(20);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setDataError('');
    try {
      const res = await apiFetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('codeforce_admin_token');
        setToken('');
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error('Unable to load participant data.');
      const data = await res.json();
      setAdminData(data);
      if (data.eventConfig) {
        setR1MinScore(data.eventConfig.round1MinScore);
        setR3MinPercent(data.eventConfig.round3MinPercent);
        setR2TimerMinutes(data.eventConfig.round2TimerMinutes);
        setR3TimerMinutes(data.eventConfig.round3TimerMinutes);
      }
    } catch (err) {
      console.error(err);
      setDataError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      apiFetch('/api/admin/session', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('expired');
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('codeforce_admin_token');
          setToken('');
          setIsAuthenticated(false);
        });
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  const getQualification = (participant: AdminParticipant) => {
    const config = adminData?.eventConfig;
    const round1 = participant.round1Status === 'completed'
      && participant.round1Score >= (config?.round1MinScore ?? 12);
    const round2 = participant.round2Status === 'completed'
      && participant.round2SolvedCount === 3;
    const round3 = participant.round3Status === 'completed'
      && participant.round3Score >= Math.round(30 * (config?.round3MinPercent ?? 40) / 100)
      && participant.round3SolvedCount >= 2;
    const round4 = participant.round4Status === 'completed';
    return { round1, round2, round3, round4 };
  };

  const getOutcome = (participant: AdminParticipant): ParticipantOutcome => {
    if (participant.status === 'disqualified') return 'disqualified';
    const qualification = getQualification(participant);
    if (qualification.round4) return 'finalist';
    if (
      (participant.round1Status === 'completed' && !qualification.round1)
      || (participant.round2Status === 'completed' && !qualification.round2)
      || (participant.round3Status === 'completed' && !qualification.round3)
    ) return 'eliminated';
    if (participant.status === 'registered' && participant.currentRound === 1
      && participant.round1Status === 'not_started') return 'registered';
    return 'in_progress';
  };

  const rankedParticipants = useMemo(() => {
    if (!adminData) return [];
    return [...adminData.participants].sort((a, b) =>
      b.totalScore - a.totalScore || (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0)
    );
  }, [adminData]);

  const filteredParticipants = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return rankedParticipants.filter(participant => {
      const matchesQuery = !query || [
        participant.name,
        participant.college,
        participant.rollNumber,
        participant.participantId,
        participant.email,
        participant.phone
      ].some(value => value?.toLocaleLowerCase().includes(query));
      return matchesQuery && (participantFilter === 'all' || getOutcome(participant) === participantFilter);
    });
  }, [rankedParticipants, searchQuery, participantFilter, adminData]);

  const rankById = useMemo(
    () => new Map(rankedParticipants.map((participant, index) => [participant.participantId, index + 1])),
    [rankedParticipants]
  );

  const selectedParticipant = adminData?.participants.find(
    participant => participant.participantId === selectedParticipantId
  );

  const outcomeCounts = useMemo(() => {
    const counts: Record<ParticipantOutcome, number> = {
      finalist: 0,
      eliminated: 0,
      in_progress: 0,
      registered: 0,
      disqualified: 0
    };
    rankedParticipants.forEach(participant => { counts[getOutcome(participant)] += 1; });
    return counts;
  }, [rankedParticipants, adminData]);

  const roundQualificationCounts = useMemo(() => rankedParticipants.reduce((counts, participant) => {
    const qualification = getQualification(participant);
    if (qualification.round1) counts[0] += 1;
    if (qualification.round2) counts[1] += 1;
    if (qualification.round3) counts[2] += 1;
    if (qualification.round4) counts[3] += 1;
    return counts;
  }, [0, 0, 0, 0]), [rankedParticipants, adminData]);

  const exportParticipants = () => {
    if (!adminData) return;
    const headers = [
      'Rank', 'Participant ID', 'Full Name', 'College', 'Roll Number', 'Email', 'Phone',
      'Registration Time', 'Overall Outcome', 'Current Round',
      'Round 1 Status', 'Round 1 Score', 'Round 1 Correct', 'Round 1 Time', 'Round 1 Qualified',
      'Round 2 Status', 'Round 2 Score', 'Round 2 Solved', 'Round 2 Time', 'Round 2 Qualified',
      'Round 3 Status', 'Round 3 Score', 'Round 3 Solved', 'Round 3 Time', 'Round 3 Qualified',
      'Round 4 Status', 'Round 4 Score', 'Round 4 Time', 'Round 4 Solved Key',
      'Total Score', 'Total Time', 'Integrity Violations', 'Participant Status'
    ];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = rankedParticipants.map((participant, index) => {
      const qualifications = getQualification(participant);
      return [
        index + 1, participant.participantId, participant.name, participant.college, participant.rollNumber,
        participant.email, participant.phone, participant.registrationTime, getOutcome(participant),
        participant.currentRound, participant.round1Status, participant.round1Score,
        participant.round1CorrectCount, participant.round1TimeSeconds, qualifications.round1,
        participant.round2Status, participant.round2Score, participant.round2SolvedCount,
        participant.round2TimeSeconds, qualifications.round2, participant.round3Status,
        participant.round3Score, participant.round3SolvedCount, participant.round3TimeSeconds,
        qualifications.round3, participant.round4Status, participant.round4Score,
        participant.round4TimeSeconds, participant.round4SolvedKey, participant.totalScore,
        participant.totalTimeSeconds, participant.integrityViolations, participant.status
      ].map(escape).join(',');
    });
    const blob = new Blob([[headers.map(escape).join(','), ...rows].join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'code-force-awaken-participants.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    sound.playClick();

    try {
      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      sound.playSuccess();
      localStorage.setItem('codeforce_admin_token', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      setPasscode('');
    } catch (err) {
      sound.playWarning();
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleLogout = async () => {
    sound.playClick();
    try {
      await apiFetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Ignore
    }
    localStorage.removeItem('codeforce_admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  const handleToggleLeaderboard = async () => {
    sound.playClick();
    try {
      await apiFetch('/api/admin/toggle-leaderboard', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAdminData();
      onRefreshState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async () => {
    sound.playClick();
    try {
      const res = await apiFetch('/api/admin/update-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          round1MinScore: r1MinScore,
          round3MinPercent: r3MinPercent,
          round2TimerMinutes: r2TimerMinutes,
          round3TimerMinutes: r3TimerMinutes,
        })
      });
      if (res.ok) {
        sound.playSuccess();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        await fetchAdminData();
        onRefreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSlotOverride = async (slotId: string, currentVal: boolean) => {
    sound.playClick();
    try {
      await apiFetch('/api/admin/update-slot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          slotId,
          isActiveOverride: !currentVal
        })
      });
      await fetchAdminData();
      onRefreshState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestModeAction = async (action: string, participantId?: string) => {
    sound.playClick();
    try {
      await apiFetch('/api/admin/test-mode-action', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, participantId })
      });
      sound.playSuccess();
      await fetchAdminData();
      onRefreshState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteParticipant = async (id: string, name: string) => {
    if (!window.confirm(`Remove participant ${name} (${id})? This cannot be undone.`)) return;
    sound.playWarning();
    try {
      await apiFetch(`/api/admin/participants/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAdminData();
      onRefreshState();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative z-10 max-w-md mx-auto px-4 py-20">
        <div className="cyber-card p-6 sm:p-8 rounded-2xl shadow-2xl border-purple-500/40 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-300">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-orbitron font-extrabold text-white">
              COMMAND CENTER
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to AIKYA 2026 Competition Organizers & Administrators.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500 text-red-300 text-xs font-mono">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Enter Admin Passcode"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-purple-400 text-slate-100 font-mono text-center outline-none"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs tracking-wider transition-all shadow-lg shadow-purple-500/30 cursor-pointer"
            >
              AUTHENTICATE COMMAND CENTER
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="cyber-card p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-purple-500/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono mb-2">
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            ORGANIZER SUPREME CONSOLE
          </div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">
            CODE FORCE AWAKEN — ADMIN SUITE
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh participant data"
            aria-label="Refresh participant data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleToggleLeaderboard}
            className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all border cursor-pointer ${
              adminData?.eventConfig?.leaderboardPublished
                ? 'bg-green-600 text-black border-green-400'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400'
            }`}
          >
            {adminData?.eventConfig?.leaderboardPublished ? 'LEADERBOARD PUBLISHED' : 'PUBLISH FINAL LEADERBOARD'}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer"
            title="Exit Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {dataError && (
        <div className="cyber-card p-4 rounded-xl border-red-500/50 bg-red-950/30 text-red-200 text-sm flex items-center justify-between gap-4">
          <span>{dataError}</span>
          <button onClick={fetchAdminData} className="underline underline-offset-2 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {(['overview', 'config', 'participants', 'simulator'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              sound.playClick();
              setActiveTab(tab);
            }}
            className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && adminData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {[
              { label: 'Registered', count: adminData.stats.totalParticipants, color: 'text-cyan-300' },
              { label: 'In Progress', count: outcomeCounts.in_progress, color: 'text-blue-300' },
              { label: 'Not Qualified', count: outcomeCounts.eliminated, color: 'text-orange-300' },
              { label: 'Disqualified', count: outcomeCounts.disqualified, color: 'text-red-300' },
              { label: 'Round 4 Finishers', count: outcomeCounts.finalist, color: 'text-amber-300' }
            ].map(metric => (
              <div key={metric.label} className="cyber-card p-4 rounded-2xl border-slate-800 text-center">
                <div className={`text-2xl sm:text-3xl font-orbitron font-extrabold ${metric.color}`}>{metric.count}</div>
                <div className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase mt-1">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
            <section className="cyber-card p-5 sm:p-6 rounded-2xl border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-orbitron font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" /> CURRENT STANDINGS
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Ranked by score, then fastest recorded completion time.</p>
                </div>
                <button
                  onClick={() => setActiveTab('participants')}
                  className="text-xs font-mono text-cyan-300 hover:text-white cursor-pointer"
                >
                  ALL PARTICIPANTS →
                </button>
              </div>
              {rankedParticipants.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No participant registrations yet.</p>
              ) : (
                <div className="space-y-2">
                  {rankedParticipants.slice(0, 5).map((participant, index) => (
                    <button
                      key={participant.participantId}
                      onClick={() => {
                        setSelectedParticipantId(participant.participantId);
                        setActiveTab('participants');
                      }}
                      className="w-full grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 text-left transition-colors cursor-pointer"
                    >
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center font-orbitron font-bold ${
                        index === 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                      }`}>{index === 0 ? <Medal className="w-5 h-5" /> : `#${index + 1}`}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white">{participant.name}</span>
                        <span className="block truncate text-[11px] text-slate-400">{participant.college} · {participant.rollNumber}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-orbitron font-bold text-amber-300">{participant.totalScore} pts</span>
                        <span className="block text-[10px] text-slate-500">{formatDuration(participant.totalTimeSeconds)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="cyber-card p-5 sm:p-6 rounded-2xl border-purple-500/30 space-y-4">
              <div>
                <h3 className="font-orbitron font-bold text-white">QUALIFICATION FUNNEL</h3>
                <p className="text-xs text-slate-400 mt-1">Participants meeting each server-side round gate.</p>
              </div>
              {[
                { label: 'Round 1 → Round 2', count: roundQualificationCounts[0], color: 'bg-cyan-400', gate: `${adminData.eventConfig.round1MinScore}+ points` },
                { label: 'Round 2 → Round 3', count: roundQualificationCounts[1], color: 'bg-blue-400', gate: 'All 3 problems solved' },
                { label: 'Round 3 → Round 4', count: roundQualificationCounts[2], color: 'bg-purple-400', gate: `${Math.round(30 * adminData.eventConfig.round3MinPercent / 100)}+ points and 2 solved` },
                { label: 'Round 4 Finished', count: roundQualificationCounts[3], color: 'bg-amber-400', gate: 'Final challenge completed' }
              ].map(stage => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-200">{stage.label}</span>
                    <span className="font-mono font-bold text-white">{stage.count} / {adminData.stats.totalParticipants}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all`}
                      style={{ width: `${adminData.stats.totalParticipants ? stage.count / adminData.stats.totalParticipants * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500">{stage.gate}</div>
                </div>
              ))}
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <span className="text-xs text-slate-400">
              {adminData.stats.completedRounds} round submissions recorded · {outcomeCounts.registered} not started
            </span>
            <button
              onClick={() => {
                setParticipantFilter('all');
                setActiveTab('participants');
              }}
              className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-orbitron font-bold cursor-pointer"
            >
              REVIEW ALL PARTICIPANT RECORDS
            </button>
          </div>
        </div>
      )}

      {/* Tab: Config */}
      {activeTab === 'config' && (
        <div className="cyber-card p-6 sm:p-8 rounded-2xl border-purple-500/30 space-y-6 max-w-2xl">
          <h3 className="font-orbitron font-bold text-white text-lg">COMPETITION RULE CONFIGURATION</h3>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-green-950/80 border border-green-500 text-green-300 text-xs font-mono">
              Configuration synchronized successfully across all nodes!
            </div>
          )}

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Round 1 Qualifying Score (out of 30)</label>
              <input
                type="number"
                value={r1MinScore}
                onChange={e => setR1MinScore(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Round 2 Qualification</label>
              <p className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-blue-300">
                Trace all 3 Python snippets and enter their exact printed outputs.
              </p>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Round 3 Passing Percentage (%)</label>
              <input
                type="number"
                value={r3MinPercent}
                onChange={e => setR3MinPercent(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-purple-300"
              />
            </div>
            <p className="rounded-lg border border-amber-500/30 bg-slate-900 p-3 text-amber-200">
              Round 4 is one medium sliding-window challenge answered in plain English. The server checks required algorithm concepts; it does not execute code.
            </p>
          </div>

          <button
            onClick={handleSaveConfig}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-purple-500/20"
          >
            <Save className="w-4 h-4" />
            SAVE & APPLY CONFIG
          </button>
        </div>
      )}

      {/* Tab: Participants */}
      {activeTab === 'participants' && adminData && (
        <div className="space-y-4">
          <div className="cyber-card p-4 sm:p-5 rounded-2xl border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-lg">PARTICIPANT PERFORMANCE</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {filteredParticipants.length} of {adminData.participants.length} participant records · rankings use score then completion time
                </p>
              </div>
              <button
                onClick={exportParticipants}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-orbitron font-bold cursor-pointer"
              >
                <Download className="w-4 h-4" /> EXPORT FULL CSV
              </button>
            </div>
            <div className="grid sm:grid-cols-[1fr_13rem] gap-3">
              <label className="relative block">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Search name, college, roll number, participant ID..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-100 outline-none"
                />
              </label>
              <select
                value={participantFilter}
                onChange={event => setParticipantFilter(event.target.value as 'all' | ParticipantOutcome)}
                className="px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-slate-200 outline-none"
                aria-label="Filter participants by outcome"
              >
                <option value="all">All outcomes</option>
                <option value="finalist">Round 4 finished</option>
                <option value="in_progress">In progress</option>
                <option value="eliminated">Not qualified</option>
                <option value="registered">Not started</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>
          </div>

          <div className="cyber-card rounded-2xl overflow-hidden border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#060b19] text-[10px] text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-3 min-w-52">Participant</th>
                    <th className="py-3 px-3">Round Gates</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Total Time</th>
                    <th className="py-3 px-3">Outcome</th>
                    <th className="py-3 px-3">Integrity</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredParticipants.map(participant => {
                    const qualification = getQualification(participant);
                    const outcome = getOutcome(participant);
                    const outcomeStyle = outcome === 'finalist'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                      : outcome === 'eliminated'
                        ? 'bg-orange-950 text-orange-300 border-orange-500/30'
                        : outcome === 'disqualified'
                          ? 'bg-red-950 text-red-300 border-red-500/30'
                          : outcome === 'registered'
                            ? 'bg-slate-900 text-slate-300 border-slate-700'
                            : 'bg-blue-950 text-blue-300 border-blue-500/30';
                    return (
                      <tr key={participant.participantId} className="hover:bg-slate-900/50">
                        <td className="py-3 px-4 font-orbitron font-bold text-amber-300">#{rankById.get(participant.participantId)}</td>
                        <td className="py-3 px-3">
                          <div className="font-sans font-bold text-white">{participant.name}</div>
                          <div className="text-[10px] text-cyan-300 mt-0.5">{participant.rollNumber}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-60">{participant.college}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1">
                            {[
                              { label: 'R1', qualified: qualification.round1, status: participant.round1Status },
                              { label: 'R2', qualified: qualification.round2, status: participant.round2Status },
                              { label: 'R3', qualified: qualification.round3, status: participant.round3Status },
                              { label: 'R4', qualified: qualification.round4, status: participant.round4Status }
                            ].map(round => (
                              <span
                                key={round.label}
                                title={`${round.label}: ${round.status.replace('_', ' ')}${round.qualified ? ', qualified' : ''}`}
                                className={`px-1.5 py-1 rounded border text-[9px] font-mono ${
                                  round.qualified
                                    ? 'bg-green-950 text-green-300 border-green-500/30'
                                    : round.status === 'completed'
                                      ? 'bg-red-950 text-red-300 border-red-500/30'
                                      : round.status === 'in_progress'
                                        ? 'bg-blue-950 text-blue-300 border-blue-500/30'
                                        : 'bg-slate-950 text-slate-500 border-slate-800'
                                }`}
                              >{round.label}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-orbitron font-bold text-amber-300">{participant.totalScore} / 105</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{formatDuration(participant.totalTimeSeconds)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full border text-[9px] font-mono uppercase whitespace-nowrap ${outcomeStyle}`}>
                            {outcome.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`py-3 px-3 font-mono ${participant.integrityViolations > 0 ? 'text-red-300' : 'text-slate-400'}`}>
                          {participant.integrityViolations}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedParticipantId(participant.participantId)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-cyan-900 text-cyan-200 cursor-pointer"
                              title="View complete participant record"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>
                            <button
                              onClick={() => handleDeleteParticipant(participant.participantId, participant.name)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              title="Delete participant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredParticipants.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No participant records match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedParticipant && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedParticipantId(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="participant-detail-title"
            className="cyber-card w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border-cyan-500/40 shadow-2xl"
          >
            <div className="sticky top-0 z-10 p-4 sm:p-6 bg-[#080e1d] border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  PARTICIPANT RECORD · RANK #{rankById.get(selectedParticipant.participantId)}
                </div>
                <h3 id="participant-detail-title" className="text-xl sm:text-2xl font-orbitron font-bold text-white mt-1 truncate">
                  {selectedParticipant.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{selectedParticipant.college} · {selectedParticipant.rollNumber}</p>
              </div>
              <button
                onClick={() => setSelectedParticipantId(null)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                aria-label="Close participant details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Score', value: `${selectedParticipant.totalScore} / 105`, color: 'text-amber-300' },
                  { label: 'Total Completion Time', value: formatDuration(selectedParticipant.totalTimeSeconds), color: 'text-cyan-300' },
                  { label: 'Current Round', value: `Round ${selectedParticipant.currentRound}`, color: 'text-purple-300' },
                  { label: 'Overall Outcome', value: getOutcome(selectedParticipant).replace('_', ' '), color: 'text-green-300' }
                ].map(metric => (
                  <div key={metric.label} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">{metric.label}</div>
                    <div className={`mt-1 font-orbitron font-bold ${metric.color}`}>{metric.value}</div>
                  </div>
                ))}
              </div>

              <section>
                <h4 className="font-orbitron font-bold text-white mb-3">IDENTITY & REGISTRATION</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    ['Participant ID', selectedParticipant.participantId],
                    ['Full name', selectedParticipant.name],
                    ['College', selectedParticipant.college],
                    ['College roll number', selectedParticipant.rollNumber],
                    ['Email', selectedParticipant.email || 'Not provided'],
                    ['Phone', selectedParticipant.phone || 'Not provided'],
                    ['Branch', selectedParticipant.branch || 'Not provided'],
                    ['Year', selectedParticipant.year || 'Not provided'],
                    ['Registered', selectedParticipant.registrationTime ? new Date(selectedParticipant.registrationTime).toLocaleString() : 'Not available'],
                    ['Participant account status', selectedParticipant.status],
                    ['Integrity violations', String(selectedParticipant.integrityViolations)],
                    ['Final round key', selectedParticipant.round4SolvedKey || 'Not submitted']
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 min-w-0">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{label}</div>
                      <div className="mt-1 text-sm text-slate-200 break-words">{value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="font-orbitron font-bold text-white mb-3">ROUND-BY-ROUND EVALUATION</h4>
                <div className="grid lg:grid-cols-2 gap-3">
                  {([
                    {
                      round: 1 as const, name: 'Round 1 · The Awakening', status: selectedParticipant.round1Status,
                      score: selectedParticipant.round1Score, time: selectedParticipant.round1TimeSeconds,
                      elapsed: selectedParticipant.roundElapsedSeconds?.[1], detail: `${selectedParticipant.round1CorrectCount} correct answers`,
                      qualified: getQualification(selectedParticipant).round1
                    },
                    {
                      round: 2 as const, name: 'Round 2 · The Jedi Trial', status: selectedParticipant.round2Status,
                      score: selectedParticipant.round2Score, time: selectedParticipant.round2TimeSeconds,
                      elapsed: selectedParticipant.roundElapsedSeconds?.[2], detail: `${selectedParticipant.round2SolvedCount} / 3 problems solved`,
                      qualified: getQualification(selectedParticipant).round2
                    },
                    {
                      round: 3 as const, name: 'Round 3 · The Hidden Force', status: selectedParticipant.round3Status,
                      score: selectedParticipant.round3Score, time: selectedParticipant.round3TimeSeconds,
                      elapsed: selectedParticipant.roundElapsedSeconds?.[3], detail: `${selectedParticipant.round3SolvedCount} / 3 problems solved`,
                      qualified: getQualification(selectedParticipant).round3
                    },
                    {
                      round: 4 as const, name: 'Round 4 · Final Key', status: selectedParticipant.round4Status,
                      score: selectedParticipant.round4Score, time: selectedParticipant.round4TimeSeconds,
                      elapsed: selectedParticipant.roundElapsedSeconds?.[4], detail: 'Final challenge',
                      qualified: getQualification(selectedParticipant).round4
                    }
                  ]).map(round => (
                    <div key={round.round} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-white">{round.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{round.detail}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[9px] font-mono uppercase ${
                          round.qualified ? 'bg-green-950 text-green-300'
                            : round.status === 'completed' ? 'bg-red-950 text-red-300'
                              : round.status === 'in_progress' ? 'bg-blue-950 text-blue-300'
                                : 'bg-slate-900 text-slate-400'
                        }`}>
                          {round.qualified ? 'Qualified' : round.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-slate-900">
                          <div className="text-slate-500">Score</div>
                          <div className="font-orbitron font-bold text-cyan-300">{round.score} pts</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900">
                          <div className="text-slate-500">Time</div>
                          <div className="font-mono text-slate-200">
                            {round.status === 'in_progress'
                              ? `${formatDuration(round.elapsed)} (running)`
                              : formatDuration(round.time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={() => handleDeleteParticipant(selectedParticipant.participantId, selectedParticipant.name)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-950/40 text-red-300 hover:bg-red-900/50 text-xs font-mono cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> DELETE PARTICIPANT
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tab: Test Simulator */}
      {activeTab === 'simulator' && (
        <div className="cyber-card p-6 rounded-2xl border-amber-500/40 space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h3 className="font-orbitron font-bold text-amber-300 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              EVENT SIMULATOR & JUMP PORTAL
            </h3>
            <p className="text-xs text-slate-400">
              Simulate the event lifecycle without waiting for scheduled start times or completing entire coding problems manually.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-300 font-bold">FAST-TRACK PILOT CADET (TEST-001)</div>
              <p className="text-xs text-slate-400">Auto-qualify cadet Test Participant (TEST-001) to Round 2, 3, or 4.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTestModeAction('qualify_round2', 'TEST-001')}
                  className="flex-1 py-1.5 rounded bg-blue-900 hover:bg-blue-800 text-blue-200 text-xs font-mono cursor-pointer"
                >
                  Qualify to R2
                </button>
                <button
                  onClick={() => handleTestModeAction('qualify_round3', 'TEST-001')}
                  className="flex-1 py-1.5 rounded bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-mono cursor-pointer"
                >
                  Qualify to R3
                </button>
                <button
                  onClick={() => handleTestModeAction('qualify_round4', 'TEST-001')}
                  className="flex-1 py-1.5 rounded bg-amber-900 hover:bg-amber-800 text-amber-200 text-xs font-mono cursor-pointer"
                >
                  Qualify to R4
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-300 font-bold">3. RESET PILOT CADET</div>
              <p className="text-xs text-slate-400">Reset pilot cadet state to fresh Round 1 not started for clean re-tests.</p>
              <button
                onClick={() => handleTestModeAction('reset_test_pilot', 'TEST-001')}
                className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-orbitron font-bold text-xs transition-colors cursor-pointer"
              >
                RESET CADET TEST-001
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
