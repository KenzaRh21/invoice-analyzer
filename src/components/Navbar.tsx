import React, { useEffect, useState } from "react";
import { UploadCloud, CheckCircle2, Cpu } from "lucide-react";
import { api } from "../services/api";

interface NavbarProps {
  currentTab: string;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onOpenUpload }) => {
  const [healthInfo, setHealthInfo] = useState<any>(null);

  useEffect(() => {
    api.getHealth().then(setHealthInfo).catch(() => {});
  }, []);

  const getTitle = () => {
    switch (currentTab) {
      case "dashboard":
        return "Executive Analytics & Financial KPI Dashboard";
      case "invoices":
        return "Invoice Extraction & Auditing Ledger";
      case "upload":
        return "AI Document Processing Pipeline";
      case "settings":
        return "Pipeline Configuration & System Health";
      default:
        return "AI Invoice Analyzer";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 flex-shrink-0">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Pipeline Provider Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs">
          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-500">Provider:</span>
          <span className="font-semibold text-slate-800">
            {healthInfo?.providers?.ai === "gemini-3.8-flash" ? "Gemini 3.8 Flash" : "Enterprise Mock / Deterministic"}
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-1" />
        </div>

        {/* Upload Action */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Invoice</span>
        </button>
      </div>
    </header>
  );
};
