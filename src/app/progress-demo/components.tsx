// src/app/progress-demo/components.tsx
"use client";

import React from "react";

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-lg font-semibold text-[var(--mos-text)]">
        {title}
      </div>
      {subtitle ? (
        <div className="mt-1 text-sm text-[var(--mos-muted)]">{subtitle}</div>
      ) : null}
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--mos-border)] bg-[var(--mos-bg)] px-3 py-1 text-xs font-medium text-[var(--mos-text)]">
      {children}
    </span>
  );
}

export function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--mos-border)] bg-[var(--mos-bg)] p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-[var(--mos-text)]">
          {label}
        </div>
        <div className="text-sm text-[var(--mos-muted)]">{value}/5</div>
      </div>

      <input
        className="mt-3 w-full accent-[var(--mos-accent)]"
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="mt-2 flex justify-between text-xs text-[var(--mos-muted)]">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-[var(--mos-border)] bg-[var(--mos-bg)] px-4 py-3 text-left transition hover:opacity-95"
    >
      <div className="text-sm font-medium text-[var(--mos-text)]">{label}</div>

      <div
        className={[
          "h-6 w-11 rounded-full p-1 transition",
          checked ? "bg-[var(--mos-accent)]" : "bg-[var(--mos-muted)]",
        ].join(" ")}
        aria-hidden="true"
      >
        <div
          className={[
            "h-4 w-4 rounded-full bg-[var(--mos-bg)] transition",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </div>
    </button>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const w = 240;
  const h = 56;
  const pad = 6;

  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values, 100);

  const scaleX = (i: number) =>
    pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);

  const scaleY = (v: number) => {
    const t = (v - minV) / Math.max(1, maxV - minV);
    return h - pad - t * (h - pad * 2);
  };

  const points = values.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(" ");

  return (
    <div className="rounded-xl border border-[var(--mos-border)] bg-[var(--mos-bg)] p-3">
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-[var(--mos-text)]"
          points={points}
        />
        <line
          x1={pad}
          y1={scaleY(50)}
          x2={w - pad}
          y2={scaleY(50)}
          stroke="var(--mos-muted)"
          strokeWidth="1"
          opacity="0.25"
        />
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-[var(--mos-muted)]">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
