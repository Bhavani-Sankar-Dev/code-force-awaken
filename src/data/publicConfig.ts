import type { EventConfig, Slot } from '../types';

export const initialSlots: Slot[] = [
  {
    slotId: "SLOT-01",
    slotName: "SLOT 01 - ALPHA SECTOR (TEST)",
    date: "2026-10-05",
    startTime: "09:00",
    endTime: "09:45",
    maxParticipants: 30,
    status: "scheduled",
    isActiveOverride: true,
    registeredCount: 1,
    computedStatus: "active",
    startISO: "2026-10-05T03:30:00.000Z",
    endISO: "2026-10-05T04:15:00.000Z",
    evaluation: {
      isBefore: false,
      isActive: true,
      isAfter: false,
      statusText: "MISSION ACTIVE",
      formattedMessage: "MISSION ACTIVE (COMMAND OVERRIDE)",
      startTimeIST: "09:00 IST",
      endTimeIST: "09:45 IST",
      dateIST: "2026-10-05"
    }
  },
  {
    slotId: "SLOT-02",
    slotName: "SLOT 02 - BRAVO SECTOR",
    date: "2026-10-05",
    startTime: "10:00",
    endTime: "10:45",
    maxParticipants: 30,
    status: "scheduled",
    registeredCount: 0,
    computedStatus: "upcoming",
    startISO: "2026-10-05T04:30:00.000Z",
    endISO: "2026-10-05T05:15:00.000Z",
    evaluation: {
      isBefore: true,
      isActive: false,
      isAfter: false,
      statusText: "YOUR MISSION STARTS AT [TIME]",
      formattedMessage: "YOUR MISSION STARTS AT 10:00 IST (05 Oct 2026)",
      startTimeIST: "10:00 IST",
      endTimeIST: "10:45 IST",
      dateIST: "2026-10-05"
    }
  },
  {
    slotId: "SLOT-03",
    slotName: "SLOT 03 - CHARLIE SECTOR",
    date: "2026-10-05",
    startTime: "11:00",
    endTime: "11:45",
    maxParticipants: 30,
    status: "scheduled",
    registeredCount: 0,
    computedStatus: "upcoming",
    startISO: "2026-10-05T05:30:00.000Z",
    endISO: "2026-10-05T06:15:00.000Z",
    evaluation: {
      isBefore: true,
      isActive: false,
      isAfter: false,
      statusText: "YOUR MISSION STARTS AT [TIME]",
      formattedMessage: "YOUR MISSION STARTS AT 11:00 IST (05 Oct 2026)",
      startTimeIST: "11:00 IST",
      endTimeIST: "11:45 IST",
      dateIST: "2026-10-05"
    }
  },
  {
    slotId: "SLOT-04",
    slotName: "SLOT 04 - DELTA SECTOR",
    date: "2026-10-05",
    startTime: "12:00",
    endTime: "12:45",
    maxParticipants: 30,
    status: "scheduled",
    registeredCount: 0,
    computedStatus: "upcoming",
    startISO: "2026-10-05T06:30:00.000Z",
    endISO: "2026-10-05T07:15:00.000Z",
    evaluation: {
      isBefore: true,
      isActive: false,
      isAfter: false,
      statusText: "YOUR MISSION STARTS AT [TIME]",
      formattedMessage: "YOUR MISSION STARTS AT 12:00 IST (05 Oct 2026)",
      startTimeIST: "12:00 IST",
      endTimeIST: "12:45 IST",
      dateIST: "2026-10-05"
    }
  }
];

export const initialEventConfig: EventConfig = {
  eventName: "CODE FORCE AWAKEN",
  collegeEvent: "AIKYA",
  round1MinScore: 12,
  round2MinPercent: 40,
  round3MinPercent: 40,
  round2TimerMinutes: 20,
  round3TimerMinutes: 20,
  maxIntegrityViolations: 3,
  leaderboardPublished: false,
  testMode: false
};
