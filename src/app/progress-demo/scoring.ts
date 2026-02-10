// src/app/progress-demo/scoring.ts

import { CheckIn, Snapshot } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Map symptom scale 1..5 → 0..100
function symptomToScore(v: number) {
  const x = clamp(v, 1, 5);
  return ((x - 1) / 4) * 100;
}

export function computeDailyScore(checkin: CheckIn): number {
  const s = checkin.symptoms;
  const symptomAvg = avg([
    symptomToScore(s.energy),
    symptomToScore(s.mood),
    symptomToScore(s.sleep),
    symptomToScore(s.focus),
    symptomToScore(s.digestion),
  ]);

  const a = checkin.adherence;
  const adherenceScore =
    (a.tookSupplements ? 40 : 0) +
    (a.ateAsRecommended ? 35 : 0) +
    (a.followedRoutines ? 25 : 0);

  // Mostly how the user feels, but behavior still matters
  const blended = 0.7 * symptomAvg + 0.3 * adherenceScore;

  return Math.round(clamp(blended, 0, 100));
}

export function buildSnapshots(checkins: CheckIn[]): Snapshot[] {
  return checkins
    .slice()
    .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1))
    .map((c) => ({
      dateISO: c.dateISO,
      dailyScore: computeDailyScore(c),
    }));
}

export function rollingAverage(
  snapshots: Snapshot[],
  windowSize: number
): number {
  if (!snapshots.length) return 0;
  const last = snapshots.slice(-windowSize);
  return Math.round(avg(last.map((x) => x.dailyScore)));
}

export function baselineAverage(
  snapshots: Snapshot[],
  baselineDays = 7
): number {
  if (snapshots.length < baselineDays) return 0;
  const first = snapshots.slice(0, baselineDays);
  return Math.round(avg(first.map((x) => x.dailyScore)));
}

export function improvementPercentage(
  current: number,
  baseline: number
): number {
  if (!baseline) return 0;
  return Math.round(((current - baseline) / baseline) * 100);
}
