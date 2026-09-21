import React from "react";

interface MonthlyVolumeChartProps {
  data: Array<{ month: string; count: number }>;
}

export const MonthlyVolumeChart: React.FC<MonthlyVolumeChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
        No monthly volume data recorded yet.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2">
      {data.map((item, idx) => {
        const heightPct = Math.max(12, Math.round((item.count / maxCount) * 100));
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
            <span className="text-[11px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.count}
            </span>
            <div className="w-full max-w-[42px] bg-slate-100 rounded-t-md overflow-hidden flex items-end h-full">
              <div
                className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all rounded-t-md cursor-pointer"
                style={{ height: `${heightPct}%` }}
                title={`${item.month}: ${item.count} invoices`}
              ></div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 truncate w-full text-center">
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface MonthlyAmountChartProps {
  data: Array<{ month: string; amount: number }>;
  currency?: string;
}

export const MonthlyAmountChart: React.FC<MonthlyAmountChartProps> = ({ data, currency = "MAD" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
        No invoice amount history recorded.
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2">
      {data.map((item, idx) => {
        const heightPct = Math.max(12, Math.round((item.amount / maxAmount) * 100));
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
            <span className="text-[10px] font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.amount.toLocaleString()} {currency}
            </span>
            <div className="w-full max-w-[42px] bg-slate-100 rounded-t-md overflow-hidden flex items-end h-full">
              <div
                className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all rounded-t-md cursor-pointer"
                style={{ height: `${heightPct}%` }}
                title={`${item.month}: ${item.amount.toLocaleString()} ${currency}`}
              ></div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 truncate w-full text-center">
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface PaymentDistributionProps {
  data: Array<{ status: string; count: number }>;
}

export const PaymentDistributionChart: React.FC<PaymentDistributionProps> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0) || 1;

  const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
    PAID: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
    UNPAID: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
    OVERDUE: { bg: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500" },
    UNKNOWN: { bg: "bg-slate-50", text: "text-slate-700", bar: "bg-slate-400" },
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Multi-segment progress bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
        {data.map((item, idx) => {
          const pct = (item.count / total) * 100;
          const styling = colorMap[item.status] || colorMap.UNKNOWN;
          return (
            <div
              key={idx}
              style={{ width: `${pct}%` }}
              className={`h-full ${styling.bar} transition-all`}
              title={`${item.status}: ${item.count} (${Math.round(pct)}%)`}
            ></div>
          );
        })}
      </div>

      {/* Legend & Breakdown stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.map((item, idx) => {
          const styling = colorMap[item.status] || colorMap.UNKNOWN;
          const pct = Math.round((item.count / total) * 100);
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between ${styling.bg}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${styling.bar}`}></span>
                <span className="font-medium text-slate-800 capitalize">
                  {item.status.toLowerCase()}
                </span>
              </div>
              <span className={`font-semibold ${styling.text}`}>
                {item.count} <span className="text-[11px] font-normal text-slate-500">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
