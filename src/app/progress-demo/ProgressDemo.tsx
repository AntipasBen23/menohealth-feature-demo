// src/app/progress-demo/ProgressDemo.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { View, Symptoms, Adherence, CheckIn } from "./types";
import { todayISO, formatDatePretty, daysBetween } from "./date";
import {
  buildSnapshots,
  rollingAverage,
  baselineAverage,
  improvementPercentage,
  computeDailyScore,
} from "./scoring";
import { fakeLatency, loadDemoState, saveDemoState, resetDemoState } from "./store";
import { Pill, SectionTitle, SliderRow, Sparkline, ToggleRow } from "./components";

export default function ProgressDemo() {
  const [view, setView] = useState<View>("checkin");
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = todayISO();

  // Draft (today’s input)
  const [draftSymptoms, setDraftSymptoms] = useState<Symptoms>({
    energy: 3,
    mood: 3,
    sleep: 3,
    focus: 3,
    digestion: 3,
  });

  const [draftAdherence, setDraftAdherence] = useState<Adherence>({
    tookSupplements: true,
    ateAsRecommended: true,
    followedRoutines: true,
  });

  // Load persisted or seeded state
  useEffect(() => {
    const state = loadDemoState();
    setCheckins(state.checkins);
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    saveDemoState({ checkins });
  }, [checkins, hydrated]);

  const hasToday = useMemo(
    () => checkins.some((c) => c.dateISO === today),
    [checkins, today]
  );

  const snapshots = useMemo(() => buildSnapshots(checkins), [checkins]);

  const baselineAvg = useMemo(() => baselineAverage(snapshots, 7), [snapshots]);
  const rolling7 = useMemo(() => rollingAverage(snapshots, 7), [snapshots]);
  const improvementPct = useMemo(
    () => improvementPercentage(rolling7, baselineAvg),
    [rolling7, baselineAvg]
  );

  const trendValues = useMemo(
    () => snapshots.slice(-14).map((s) => s.dailyScore),
    [snapshots]
  );

  const dayIndex = useMemo(() => {
    if (!checkins.length) return 1;
    const first = checkins
      .slice()
      .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1))[0].dateISO;
    return daysBetween(first, today) + 1;
  }, [checkins, today]);

  const previewScore = useMemo(() => {
    const preview: CheckIn = {
      dateISO: today,
      symptoms: draftSymptoms,
      adherence: draftAdherence,
    };
    return computeDailyScore(preview);
  }, [draftSymptoms, draftAdherence, today]);

  async function submitToday() {
    setSaving(true);
    await fakeLatency(550);

    const next: CheckIn = {
      dateISO: today,
      symptoms: draftSymptoms,
      adherence: draftAdherence,
    };

    setCheckins((prev) => {
      const withoutToday = prev.filter((c) => c.dateISO !== today);
      return [...withoutToday, next].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));
    });

    setSaving(false);
    setView("dashboard");
  }

  function reset() {
    const state = resetDemoState();
    setCheckins(state.checkins);
    setView("checkin");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Minimal context (not a header/nav) */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">Demo Mode</div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Mos Health Progress Score
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill>Day {dayIndex}</Pill>
            <Pill>Baseline: Days 1–7</Pill>
            <Pill>Rolling: last 7 days</Pill>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Reset demo
        </button>
      </div>

      {/* In-flow view switching (still minimal) */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        {(
          [
            ["checkin", "Today’s Check-in"],
            ["dashboard", "Dashboard"],
            ["history", "History"],
          ] as const
        ).map(([key, label]) => {
          const active = view === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {view === "checkin" ? (
        <div className="space-y-6">
          <SectionTitle
            title="Today’s Check-in"
            subtitle={
              hasToday
                ? "You already submitted today — adjust and resubmit to see how the score changes."
                : "30–60 seconds. Your inputs update a deterministic score (no AI)."
            }
          />

          <div className="grid gap-3">
            <SliderRow
              label="Energy"
              value={draftSymptoms.energy}
              onChange={(v) => setDraftSymptoms((p) => ({ ...p, energy: v }))}
            />
            <SliderRow
              label="Mood"
              value={draftSymptoms.mood}
              onChange={(v) => setDraftSymptoms((p) => ({ ...p, mood: v }))}
            />
            <SliderRow
              label="Sleep quality"
              value={draftSymptoms.sleep}
              onChange={(v) => setDraftSymptoms((p) => ({ ...p, sleep: v }))}
            />
            <SliderRow
              label="Focus / productivity"
              value={draftSymptoms.focus}
              onChange={(v) => setDraftSymptoms((p) => ({ ...p, focus: v }))}
            />
            <SliderRow
              label="Digestive comfort"
              value={draftSymptoms.digestion}
              onChange={(v) => setDraftSymptoms((p) => ({ ...p, digestion: v }))}
            />
          </div>

          <div className="space-y-2">
            <SectionTitle title="Protocol adherence" subtitle="These directly affect the score." />
            <div className="grid gap-2">
              <ToggleRow
                label="Took supplements"
                checked={draftAdherence.tookSupplements}
                onToggle={() =>
                  setDraftAdherence((p) => ({ ...p, tookSupplements: !p.tookSupplements }))
                }
              />
              <ToggleRow
                label="Ate as recommended"
                checked={draftAdherence.ateAsRecommended}
                onToggle={() =>
                  setDraftAdherence((p) => ({ ...p, ateAsRecommended: !p.ateAsRecommended }))
                }
              />
              <ToggleRow
                label="Followed morning/evening routines"
                checked={draftAdherence.followedRoutines}
                onToggle={() =>
                  setDraftAdherence((p) => ({ ...p, followedRoutines: !p.followedRoutines }))
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-neutral-500">Preview</div>
                <div className="text-lg font-semibold text-neutral-900">
                  Today’s score: {previewScore}/100
                </div>
                <div className="mt-1 text-sm text-neutral-600">
                  Baseline week average: {baselineAvg ? `${baselineAvg}/100` : "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={submitToday}
                disabled={saving}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold text-white",
                  saving ? "bg-neutral-400" : "bg-neutral-900 hover:bg-neutral-800",
                ].join(" ")}
              >
                {saving ? "Saving..." : "Save check-in"}
              </button>
            </div>

            <div className="mt-4 text-xs text-neutral-500">
              Deterministic scoring + rolling averages. State persists in your browser.
            </div>
          </div>
        </div>
      ) : null}

      {view === "dashboard" ? (
        <div className="space-y-6">
          <SectionTitle
            title="Dashboard"
            subtitle="A single composite score + week-over-week trend vs your baseline."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="text-sm text-neutral-500">Progress Score (rolling 7-day)</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900">
                {rolling7}/100
              </div>
              <div className="mt-2 text-sm text-neutral-600">
                {baselineAvg ? (
                  <>
                    {improvementPct >= 0 ? "+" : ""}
                    {improvementPct}% vs baseline ({baselineAvg}/100)
                  </>
                ) : (
                  "Baseline not ready yet (needs up to 7 days)."
                )}
              </div>

              <button
                type="button"
                onClick={() => setView("checkin")}
                className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                {hasToday ? "Adjust today’s check-in" : "Do today’s check-in"}
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="text-sm text-neutral-500">Status</div>
              <div className="mt-2 text-lg font-semibold text-neutral-900">
                {hasToday ? "Check-in saved" : "No check-in yet"}
              </div>
              <div className="mt-2 text-sm text-neutral-600">
                {hasToday
                  ? "Nice. Your dashboard updates immediately."
                  : "Submit today’s check-in to see the score move."}
              </div>

              <button
                type="button"
                onClick={() => setView("history")}
                className="mt-4 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                View history
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-900">Trend (last 14 days)</div>
                <div className="text-xs text-neutral-500">
                  Baseline is computed from the first 7 days of history.
                </div>
              </div>
            </div>

            <Sparkline values={trendValues.length ? trendValues : [0]} />
          </div>
        </div>
      ) : null}

      {view === "history" ? (
        <div className="space-y-6">
          <SectionTitle
            title="History"
            subtitle="Each day has inputs and an output score — easy to trust and explain."
          />

          <div className="rounded-2xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900">
              Last 14 days
            </div>

            <div className="divide-y divide-neutral-200">
              {snapshots
                .slice()
                .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
                .slice(0, 14)
                .map((s, idx) => (
                  <div key={s.dateISO} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        {formatDatePretty(s.dateISO)}
                        {s.dateISO === today ? " (Today)" : ""}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {idx >= 7 ? "Post-baseline" : "Baseline week"}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-neutral-900">{s.dailyScore}/100</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Back to dashboard
            </button>
            <button
              type="button"
              onClick={() => setView("checkin")}
              className="flex-1 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Today’s check-in
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-10 text-xs text-neutral-500">
        Frontend-only demo. Data persists in your browser to mimic a real product.
      </div>
    </div>
  );
}
