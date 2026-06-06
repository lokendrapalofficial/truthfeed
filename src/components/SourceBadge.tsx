import React from "react";

interface Source {
  bias?: string;
  credibility?: string;
}

interface SourceBadgeProps {
  sourceName: string;
  source?: Source | null;
}

const biasColors: Record<string, string> = {
  LEFT: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
  LEAN_LEFT: "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60",
  CENTER: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  LEAN_RIGHT: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60",
  RIGHT: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
};

const biasLabels: Record<string, string> = {
  LEFT: "Left",
  LEAN_LEFT: "Lean Left",
  CENTER: "Center",
  LEAN_RIGHT: "Lean Right",
  RIGHT: "Right",
};

export default function SourceBadge({ sourceName, source }: SourceBadgeProps) {
  const bias = source?.bias;
  const colorClass = bias ? biasColors[bias] : biasColors["CENTER"];
  const biasLabel = bias ? biasLabels[bias] : null;

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-gray-700 dark:text-slate-300 text-xs tracking-tight">
        {sourceName}
      </span>
      {biasLabel && (
        <span
          className={`inline-flex items-center text-[9px] font-mono font-semibold border px-1.5 py-0.5 rounded-full uppercase tracking-wide ${colorClass}`}
        >
          {biasLabel}
        </span>
      )}
    </div>
  );
}
