// src/app/progress-demo/store.ts

import { addDays, todayISO } from "./date";
import { CheckIn, DemoState, Symptoms, Adherence } from "./types";

export const STORAGE_KEY = "mos_progress_demo_v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function seedDemoCheckins(): CheckIn[] {
  // 14 days of believable history ending yesterday
  // Days 1–7 baseline, Days 8–14 improved
  const t = todayISO();
  const start = addDays(t, -14);

  const checkins: CheckIn[] = [];

  for (let i = 0; i < 14; i++) {
    const dateISO = addDays(start, i);
    const week = i < 7 ? 1 : 2;
    const drift = week === 1 ? 0 : 1;

    const symptoms: Symptoms = {
      energy: clamp(2 + drift + (i % 3 === 0 ? 0 : 1), 1, 5),
      mood: clamp(2 + drift + (i % 4 === 0 ? 0 : 1), 1, 5),
      sleep: clamp(2 + drift + (i % 5 === 0 ? 0 : 1), 1, 5),
      focus: clamp(2 + drift + (i % 3 === 1 ? 0 : 1), 1, 5),
      digestion: clamp(2 + drift + (i % 6 === 0 ? 0 : 1), 1, 5),
    };

    const adherence: Adherence = {
      tookSupplements: week === 1 ? i % 3 !== 0 : true,
      ateAsRecommended: week === 1 ? i % 4 !== 0 : i % 6 !== 0,
      followedRoutines: week === 1 ? i % 2 === 0 : i % 5 !== 0,
    };

    checkins.push({ dateISO, symptoms, adherence });
  }

  return checkins;
}

export function loadDemoState(): DemoState {
  if (typeof window === "undefined") {
    return { checkins: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { checkins: seedDemoCheckins() };
  }

  try {
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed?.checkins?.length) return parsed;
  } catch {
    // ignore
  }

  return { checkins: seedDemoCheckins() };
}

export function saveDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoState(): DemoState {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return { checkins: seedDemoCheckins() };
}

export async function fakeLatency(ms = 500) {
  await new Promise((r) => setTimeout(r, ms));
}
