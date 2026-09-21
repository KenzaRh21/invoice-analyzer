import React, { useState } from "react";
import { Info } from "lucide-react";

interface ConfidenceBadgeProps {
  score: number;
  showDetails?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, showDetails = false }) => {
  const [openTooltip, setOpenTooltip] = useState(false);
  const rounded = Math.round(score || 0);

  let level = "Low";
  let colorClass = "bg-rose-50 text-rose-700 border-rose-200";
  let barColor = "bg-rose-500";
  let textColor = "text-rose-700";

  if (rounded >= 90) {
    level = "High";
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    barColor = "bg-emerald-500";
    textColor = "text-emerald-700";
  } else if (rounded >= 70) {
    level = "Medium";
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${colorClass}`}>
        <span>{rounded}%</span>
        <span className="font-normal text-[11px] opacity-80">({level})</span>
      </div>

      {showDetails && (
        <button
          type="button"
          onClick={() => setOpenTooltip(!openTooltip)}
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
          title="Confidence Score Breakdown"
          aria-label="Confidence score info"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      )}

      {openTooltip && (
        <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-50 border border-slate-800 animate-in fade-in">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 font-semibold text-slate-200">
            <span>Automated AI Extraction Score</span>
            <span className={textColor}>{rounded}%</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
            Calculated algorithmically based on the presence of required fields (Invoice #, Date, Supplier, Currency, Line Items) and mathematical consistency.
          </p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className={`h-1.5 ${barColor} rounded-full`} style={{ width: `${rounded}%` }}></div>
          </div>
          <div className="text-[10px] text-amber-300/90 font-medium bg-amber-950/40 p-1.5 rounded border border-amber-800/40">
            Note: Automated indicator of structural completeness, not a legal or tax correctness guarantee.
          </div>
        </div>
      )}
    </div>
  );
};
