import React, { useState } from "react";
import { api } from "../services/api";
import { User } from "../types";
import { Sparkles, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("demo@invoice.ma");
  const [password, setPassword] = useState("Password123!");
  const [fullName, setFullName] = useState("Enterprise Finance Lead");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register(email, password, fullName);
        onAuthSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("demo@invoice.ma");
    setPassword("Password123!");
    setLoading(true);
    setError(null);
    try {
      const res = await api.login("demo@invoice.ma", "Password123!");
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || "Failed demo sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-slate-950 p-6 text-center border-b border-slate-800">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">AI Invoice Analyzer</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise OCR & LLM Extraction Platform</p>
        </div>

        {/* Form Box */}
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {isRegister ? "Create Analyst Account" : "Enterprise Sign In"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {isRegister ? "Sign in instead" : "Create account"}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Yassine El Amrani"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : isRegister ? "Register Account" : "Sign In to Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>One-Click Enterprise Demo Sign-In</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Credentials: <span className="font-mono text-slate-600">demo@invoice.ma</span> / <span className="font-mono text-slate-600">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
