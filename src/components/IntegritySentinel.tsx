import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { sound } from '../utils/sound';
import { apiFetch } from '../utils/api';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';

interface IntegritySentinelProps {
  participant: Participant | null;
  onViolationRecorded?: (violationCount: number) => void;
  isActiveRound: boolean;
}

export const IntegritySentinel: React.FC<IntegritySentinelProps> = ({
  participant,
  onViolationRecorded,
  isActiveRound
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [violationCount, setViolationCount] = useState(participant?.integrityViolations || 0);
  const [lastViolationTime, setLastViolationTime] = useState(0);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    if (participant) {
      setViolationCount(participant.integrityViolations || 0);
    }
  }, [participant?.integrityViolations]);

  useEffect(() => {
    if (!participant || !isActiveRound) return;

    const recordViolation = async (reason: string) => {
      const now = Date.now();
      // 3 second throttle to avoid duplicate events on blur + visibility
      if (now - lastViolationTime < 750) return;
      setLastViolationTime(now);

      sound.playWarning();

      try {
        const res = await apiFetch('/api/integrity/violation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: participant.participantId,
            reason
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not record this integrity warning.');
        if (typeof data.violationCount !== 'number' || !Number.isInteger(data.violationCount)) {
          throw new Error('The server returned an invalid integrity-warning count.');
        }
        const updated: number = data.violationCount;
        setPersistenceError(null);
        setViolationCount(updated);
        setShowAlert(true);
        if (onViolationRecorded) onViolationRecorded(updated);
        if (data.shouldForceSubmit) {
          window.dispatchEvent(new CustomEvent('participant-force-submit', {
            detail: { participantId: participant.participantId }
          }));
        }
      } catch (err: unknown) {
        console.error('Could not record integrity warning:', err);
        setPersistenceError((err as Error).message || 'Could not record this integrity warning.');
        setShowAlert(true);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        recordViolation('Tab switched / minimized during mission');
      }
    };

    const handleBlur = () => {
      recordViolation('Focus shifted out of examination terminal');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [participant, isActiveRound, lastViolationTime, violationCount, onViolationRecorded]);

  if (!showAlert) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md animate-bounce-short">
      <div className="bg-red-950/95 border-2 border-red-500/80 rounded-xl p-4 shadow-2xl shadow-red-600/30 backdrop-blur-xl text-red-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-900/60 border border-red-400 text-red-300 animate-pulse shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="font-orbitron font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>SECURITY SENTINEL ALERT</span>
                <span className="text-xs px-1.5 py-0.2 rounded bg-red-800 text-red-100 font-mono">
                  {Math.min(violationCount, 2)} / 2 WARNINGS
                </span>
              </div>
              <p className="text-xs mt-1 text-red-300/90 font-sans">
                Window blur or tab switch detected. The first two detections are warnings; the third submits your current challenge and returns you to the dashboard.
              </p>
              {persistenceError && (
                <p className="text-xs mt-2 text-red-100 font-semibold">
                  Warning not saved: {persistenceError}
                </p>
              )}
              {violationCount >= 3 && (
                <div className="mt-2 text-xs font-mono font-bold text-red-400 bg-black/40 p-1.5 rounded border border-red-600">
                  THIRD WARNING: Your current challenge is being submitted.
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-red-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
