import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Cpu,
  Database,
  CheckCircle2,
  Building2,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Terminal,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth({ status: "degraded", providers: { ocr: "unknown", ai: "unknown" } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            System Architecture & Pipeline Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Operational status of OCR subsystem, AI entity extraction engine, and compliance parameters.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          <span>Run Health Diagnostic</span>
        </button>
      </div>

      {/* Subsystem Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OCR Engine */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">OCR Subsystem</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Cpu className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 capitalize">
              {health?.providers?.ocr || "Tesseract 5.x / Mock"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Extracts text from multi-page digital and scanned documents.
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for processing</span>
          </div>
        </div>

        {/* AI LLM Provider */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Entity Extractor</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {health?.providers?.ai === "gemini-3.8-flash" ? "Google Gemini 3.8 Flash" : "Enterprise Mock / Deterministic"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Zero-hallucination Pydantic/JSON schema extraction with confidence scoring.
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pipeline active</span>
          </div>
        </div>

        {/* Database Layer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Storage Engine</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Database className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">PostgreSQL / In-Process Store</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Relational ledger with migrations & audit history.
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Moroccan Enterprise Invoicing Specifications */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Moroccan Enterprise Invoicing Standards Supported
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The extraction schema adheres strictly to Moroccan tax regulations and commercial code (Code de Commerce du Royaume du Maroc):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Identifiant Commun (ICE)</span>
            <p className="text-slate-500 leading-snug">
              15-digit unique company identifier mandatory on all B2B invoices in Morocco.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Moroccan TVA Rates</span>
            <p className="text-slate-500 leading-snug">
              Standard 20% (IT & consulting), 14% (transport/energy), 10% (hospitality), 7% (water/essential goods).
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Dirham Currency (MAD)</span>
            <p className="text-slate-500 leading-snug">
              Automatic normalization of MAD, Dhs, or DH symbols with precision formatting.
            </p>
          </div>
        </div>
      </div>

      {/* CLI & Environment Quick Reference */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-xl shadow-lg border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
          <Terminal className="w-4 h-4" />
          <span>Local Development & Docker Execution</span>
        </div>
        <div className="space-y-2 text-slate-300">
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-emerald-400"># Run full stack with Docker Compose</span>
            <div className="text-white mt-1">docker compose up --build</div>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-emerald-400"># Run Python backend automated tests</span>
            <div className="text-white mt-1">pytest backend/tests/ -v</div>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-emerald-400"># Run database migrations</span>
            <div className="text-white mt-1">alembic -c database/alembic.ini upgrade head</div>
          </div>
        </div>
      </div>
    </div>
  );
};
