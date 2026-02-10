// src/app/progress-demo/types.ts

export type View = "checkin" | "dashboard" | "history";

export type Symptoms = {
  energy: number; // 1..5
  mood: number; // 1..5
  sleep: number; // 1..5
  focus: number; // 1..5
  digestion: number; // 1..5
};

export type Adherence = {
  tookSupplements: boolean;
  ateAsRecommended: boolean;
  followedRoutines: boolean;
};

export type CheckIn = {
  dateISO: string; // YYYY-MM-DD
  symptoms: Symptoms;
  adherence: Adherence;
};

export type Snapshot = {
  dateISO: string;
  dailyScore: number; // 0..100
};

export type DemoState = {
  checkins: CheckIn[];
};
