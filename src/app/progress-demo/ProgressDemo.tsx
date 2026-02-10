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

  useEffect(() => {
    const state = loadDemoState();
    setCheckins(state.checkins);
    setHydrated(true);
  }, []);

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
    <div className="mx-auto max-w-2xl px-4 py-8 text-[var(--mos-text)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-[var(--mos-muted)]">Demo Mode</div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--mos-text)]">
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
          className="rounded-xl border border-[var(--mos-border)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--mos-text)] hover:bg-[var(--mos-bg)]"
        >
          Reset demo
        </button>
      </div>

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
                  ? "bg-[var(--mos-accent)] text-[var(--mos-text)]"
                  : "border border-[var(--mos-border)] bg-transparent text-[var(--mos-text)] hover:bg-[var(--mos-bg)]",
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

          <div className="rounded-2xl border border-[var(--mos-border)] bg-[var(--mos-bg)] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-[var(--mos-muted)]">Preview</div>
                <div className="text-lg font-semibold text-[var(--mos-text)]">
                  Today’s score: {previewScore}/100
                </div>
                <div className="mt-1 text-sm text-[var(--mos-muted)]">
                  Baseline week average: {baselineAvg ? `${baselineAvg}/100` : "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={submitToday}
                disabled={saving}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  saving
                    ? "bg-[var(--mos-muted)] text-[var(--mos-bg)]"
                    : "bg-[var(--mos-accent)] text-[var(--mos-text)] hover:opacity-90",
                ].join(" ")}
              >
                {saving ? "Saving..." : "Save check-in"}
              </button>
            </div>

            <div className="mt-4 text-xs text-[var(--mos-muted)]">
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
            <div className="rounded-2xl border border-[var(--mos-border)] bg-[var(--mos-bg)] p-5">
              <div className="text-sm text-[var(--mos-muted)]">Progress Score (rolling 7-day)</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-[var(--mos-text)]">
                {rolling7}/100
              </div>
              <div className="mt-2 text-sm text-[var(--mos-muted)]">
                {baselineAvg ? (
                  <>
                    <span className="text-[var(--mos-accent)] font-semibold">
                      {improvementPct >= 0 ? "+" : ""}
                      {improvementPct}%
                    </span>{" "}
                    vs baseline ({baselineAvg}/100)
                  </>
                ) : (
                  "Baseline not ready yet (needs up to 7 days)."
                )}
              </div>

              <button
                type="button"
                onClick={() => setView("checkin")}
                className="mt-4 w-full rounded-xl bg-[var(--mos-accent)] px-4 py-2 text-sm font-semibold text-[var(--mos-text)] hover:opacity-90"
              >
                {hasToday ? "Adjust today’s check-in" : "Do today’s check-in"}
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--mos-border)] bg-[var(--mos-bg)] p-5">
              <div className="text-sm text-[var(--mos-muted)]">Status</div>
              <div className="mt-2 text-lg font-semibold text-[var(--mos-text)]">
                {hasToday ? "Check-in saved" : "No check-in yet"}
              </div>
              <div className="mt-2 text-sm text-[var(--mos-muted)]">
                {hasToday
                  ? "Nice. Your dashboard updates immediately."
                  : "Submit today’s check-in to see the score move."}
              </div>

              <button
                type="button"
                onClick={() => setView("history")}
                className="mt-4 w-full rounded-xl border border-[var(--mos-border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--mos-text)] hover:bg-[var(--mos-bg)]"
              >
                View history
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2">
              <div className="text-sm font-medium text-[var(--mos-text)]">Trend (last 14 days)</div>
              <div className="text-xs text-[var(--mos-muted)]">
                Baseline is computed from the first 7 days of history.
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

          <div className="rounded-2xl border border-[var(--mos-border)] bg-[var(--mos-bg)]">
            <div className="border-b border-[var(--mos-border)] px-4 py-3 text-sm font-medium text-[var(--mos-text)]">
              Last 14 days
            </div>

            <div className="divide-y divide-[var(--mos-border)]">
              {snapshots
                .slice()
                .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
                .slice(0, 14)
                .map((s, idx) => (
                  <div key={s.dateISO} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--mos-text)]">
                        {formatDatePretty(s.dateISO)}
                        {s.dateISO === today ? " (Today)" : ""}
                      </div>
                      <div className="text-xs text-[var(--mos-muted)]">
                        {idx >= 7 ? "Post-baseline" : "Baseline week"}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-[var(--mos-text)]">
                      {s.dailyScore}/100
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className="flex-1 rounded-xl border border-[var(--mos-border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--mos-text)] hover:bg-[var(--mos-bg)]"
            >
              Back to dashboard
            </button>
            <button
              type="button"
              onClick={() => setView("checkin")}
              className="flex-1 rounded-xl bg-[var(--mos-accent)] px-4 py-2 text-sm font-semibold text-[var(--mos-text)] hover:opacity-90"
            >
              Today’s check-in
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-10 text-xs text-[var(--mos-muted)]">
        Frontend-only demo. Data persists in your browser to mimic a real product.
      </div>
    </div>
  );
}
