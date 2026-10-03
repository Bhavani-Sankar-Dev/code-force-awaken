import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { sound } from '../utils/sound';
import { apiFetch } from '../utils/api';
import { 
  Trophy, 
  Search, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Medal, 
  RotateCw,
  Sparkles,
  Award
} from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch('/api/leaderboard');
      if (!res.ok) throw new Error('Could not load the leaderboard.');
      const data = await res.json();
      setIsPublished(data.isPublished ?? false);
      setEntries(data.isPublished ? data.leaderboard || [] : []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setLoadError(err instanceof Error ? err.message : 'Could not load the leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredEntries = entries.filter(e => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.rollNumber.toLowerCase().includes(q) ||
      e.college.toLowerCase().includes(q)
    );
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title & Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          AIKYA 2026 IMPERIAL ARCHIVES
        </div>
        <h2 className="text-3xl sm:text-4xl font-orbitron font-extrabold text-white tracking-wider">
          CHAMPIONSHIP LEADERBOARD
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Real-time cadet rankings. Ranked by total score then shortest mission completion duration.
        </p>
      </div>

      {loadError && (
        <div className="cyber-card p-6 rounded-2xl border-red-500/40 text-center text-red-300">
          {loadError}
        </div>
      )}
      {!loading && !loadError && !isPublished && (
        <div className="cyber-card p-8 sm:p-12 rounded-2xl border-amber-500/30 text-center space-y-3">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-orbitron font-bold text-white">LEADERBOARD NOT PUBLISHED</h3>
          <p className="text-sm text-slate-400">Participant rankings will appear here after the organizer publishes the final leaderboard.</p>
        </div>
      )}

      {isPublished && (
        <>
      {/* Control bar */}
      <div className="cyber-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-cyan-500/30">
        {/* Search & Refresh */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search cadet or roll no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-slate-200 outline-none font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={() => {
              sound.playClick();
              fetchLeaderboard();
            }}
            title="Refresh Leaderboard"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="cyber-card rounded-2xl overflow-hidden border-cyan-500/30 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#060b19]/80 text-[11px] font-mono text-cyan-300 uppercase">
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Cadet Manifest</th>
                <th className="py-3.5 px-3 text-center">R1 (30)</th>
                <th className="py-3.5 px-3 text-center">R2 (30)</th>
                <th className="py-3.5 px-3 text-center">R3 (30)</th>
                <th className="py-3.5 px-3 text-center">R4 (15)</th>
                <th className="py-3.5 px-4 text-center text-amber-300">Total Score</th>
                <th className="py-3.5 px-4 text-center">Time</th>
                <th className="py-3.5 px-3 text-center">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono text-xs">
                    {loading ? 'SYNCHRONIZING TELEMETRY...' : 'NO CADET RECORDS FOUND'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.rank}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        isTop1 ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20 font-orbitron font-extrabold text-sm">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 font-orbitron font-bold text-sm">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 font-orbitron font-bold text-sm">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">
                            #{entry.rank}
                          </span>
                        )}
                      </td>

                      {/* Cadet info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white font-sans text-sm flex items-center gap-1.5">
                          {entry.name}
                          {isTop1 && <Award className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span className="text-cyan-400">{entry.rollNumber}</span>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">{entry.college}</span>
                        </div>
                      </td>

                      {/* R1 */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={entry.round1Score >= 12 ? 'text-green-400 font-bold' : 'text-slate-400'}>
                          {entry.round1Score}
                        </span>
                      </td>

                      {/* R2 */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={entry.round2Score >= 12 ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                          {entry.round2Score}
                        </span>
                      </td>

                      {/* R3 */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={entry.round3Score >= 12 ? 'text-purple-400 font-bold' : 'text-slate-400'}>
                          {entry.round3Score}
                        </span>
                      </td>

                      {/* R4 */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={entry.round4Score > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {entry.round4Score}
                        </span>
                      </td>

                      {/* Total Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-amber-400 font-orbitron font-extrabold text-sm">
                          {entry.totalScore}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">/105</span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-center text-slate-300">
                        {formatDuration(entry.totalDurationSeconds || 0)}
                      </td>

                      {/* Integrity */}
                      <td className="py-3.5 px-3 text-center">
                        {entry.integrityViolations === 0 ? (
                          <span title="Clean proctored record" className="inline-flex text-green-400">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        ) : (
                          <span title={`${entry.integrityViolations} security violations recorded`} className="inline-flex items-center gap-1 text-red-400 text-[10px]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {entry.integrityViolations}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
