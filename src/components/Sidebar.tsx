import React from "react";
import { LayoutDashboard, FileText, UploadCloud, Settings, LogOut, Sparkles, Building2 } from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
    { id: "invoices", label: "Invoices Ledger", icon: FileText },
    { id: "upload", label: "AI Document Ingestion", icon: UploadCloud },
    { id: "settings", label: "System & AI Config", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              AI Invoice Analyzer
            </h1>
            <span className="text-[11px] font-mono text-indigo-400 font-medium">
              Enterprise OCR & LLM
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Moroccan Enterprise Benchmark Badge */}
      <div className="p-3 mx-3 mb-3 bg-slate-800/70 border border-slate-700/60 rounded-xl">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 mb-1">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Morocco Tax & ICE Ready</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">
          Engineered for MAD currency, ICE identifiers, TVA rates (20%), and bilingual documents.
        </p>
      </div>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <div className="text-xs font-semibold text-white truncate">
              {currentUser?.full_name || "Enterprise Analyst"}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {currentUser?.email || "demo@invoice.ma"}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
