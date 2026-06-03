"use client";

import React from "react";

export interface SourceData {
  id: string;
  name: string;
  bias: "LEFT" | "LEAN_LEFT" | "CENTER" | "LEAN_RIGHT" | "RIGHT";
  credibility: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
  description?: string | null;
}

interface SourceBadgeProps {
  sourceName: string;
  source?: SourceData | null;
}

export default function SourceBadge({ sourceName, source }: SourceBadgeProps) {
  const getCredibilityDot = (credibility?: string) => {
    if (!credibility) return "bg-zinc-400";
    switch (credibility) {
      case "VERY_HIGH":
      case "HIGH":
        return "bg-emerald-500";
      case "MEDIUM":
        return "bg-amber-500";
      case "LOW":
      case "VERY_LOW":
        return "bg-rose-500";
      default:
        return "bg-zinc-400";
    }
  };

  const getBiasTextColor = (bias?: string) => {
    if (!bias) return "text-zinc-500";
    switch (bias) {
      case "LEFT":
      case "LEAN_LEFT":
        return "text-blue-700";
      case "CENTER":
        return "text-emerald-700";
      case "LEAN_RIGHT":
      case "RIGHT":
        return "text-red-700";
      default:
        return "text-zinc-500";
    }
  };

  const getCredibilityTextColor = (credibility?: string) => {
    if (!credibility) return "text-zinc-500";
    switch (credibility) {
      case "VERY_HIGH":
      case "HIGH":
        return "text-emerald-700";
      case "MEDIUM":
        return "text-amber-700";
      case "LOW":
      case "VERY_LOW":
        return "text-rose-700";
      default:
        return "text-zinc-500";
    }
  };

  const dotColor = getCredibilityDot(source?.credibility);
  const biasTextColor = getBiasTextColor(source?.bias);
  const credibilityTextColor = getCredibilityTextColor(source?.credibility);

  return (
    <div className="group relative inline-block">
      {/* Badge Capsule */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 cursor-help font-medium text-xs tracking-wide transition-all duration-200 select-none hover:bg-zinc-150">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
        <span>{sourceName}</span>
      </div>

      {/* Hover Tooltip — always on white */}
      {source && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 rounded-xl border border-zinc-200 bg-white text-[11px] text-zinc-600 shadow-lg scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all origin-bottom duration-200 z-50 pointer-events-none whitespace-normal text-left font-sans">
          {/* Outlet Name */}
          <p className="font-bold text-zinc-900 mb-1.5 border-b border-zinc-100 pb-1 flex items-center justify-between">
            <span>{source.name}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          </p>
          
          {/* Metadata Grid */}
          <div className="space-y-1">
            <p className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-400 uppercase tracking-wider font-semibold">Bias:</span>
              <span className={`font-extrabold uppercase tracking-wide ${biasTextColor}`}>
                {source.bias.replace("_", " ")}
              </span>
            </p>
            <p className="flex justify-between items-center text-[10px] pb-1 border-b border-zinc-100">
              <span className="text-zinc-400 uppercase tracking-wider font-semibold">Credibility:</span>
              <span className={`font-extrabold uppercase tracking-wide ${credibilityTextColor}`}>
                {source.credibility.replace("_", " ")}
              </span>
            </p>
          </div>

          {/* Description */}
          {source.description && (
            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium mt-1.5 italic">
              {source.description}
            </p>
          )}

          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  );
}
