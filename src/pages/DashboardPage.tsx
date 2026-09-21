import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { DashboardStats, Invoice, formatCurrencyAmount } from "../types";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  CreditCard,
  Building,
  Globe2,
  Coins,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { MonthlyVolumeChart, MonthlyAmountChart, PaymentDistributionChart } from "../components/Charts";

interface DashboardPageProps {
  onNavigateToInvoice: (id: string) => void;
  onNavigateToInvoicesList: () => void;
  onNavigateToUpload: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToInvoice,
  onNavigateToInvoicesList,
  onNavigateToUpload,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, invoicesData] = await Promise.all([
        api.getDashboardStats(),
        api.getInvoices({ limit: 5, sort_by: "created_at", sort_order: "desc" }),
      ]);
      setStats(statsData);
      setRecentInvoices(invoicesData.items);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">Loading executive analytics...</span>
        </div>
      </div>
    );
  }

  // Multi-currency calculation
  const currencySummaries = stats?.currency_summaries || [];
  const currentSummary = selectedCurrency === "ALL"
    ? null
    : currencySummaries.find((c) => c.currency === selectedCurrency);

  const displayTotal = currentSummary ? currentSummary.total_amount : (stats?.total_amount || 0);
  const displayUnpaid = currentSummary ? currentSummary.unpaid_amount : (stats?.unpaid_amount || 0);
  const displayOverdue = currentSummary ? currentSummary.overdue_amount : (stats?.overdue_amount || 0);
  const activeCurrencyCode = currentSummary ? currentSummary.currency : (stats?.currency || null);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Executive Welcome & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial & Extraction Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline metrics, automated document parsing health, and multi-currency ledger aggregates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Process New Invoice</span>
          </button>
        </div>
      </div>

      {/* Multi-Currency Ingestion Selector / Badges */}
      {currencySummaries.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Globe2 className="w-4 h-4 text-indigo-600" />
            <span>Multi-Currency Portfolios Ingested:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCurrency("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCurrency === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Currencies ({stats?.total_invoices || 0})
            </button>
            {currencySummaries.map((cs) => (
              <button
                key={cs.currency}
                onClick={() => setSelectedCurrency(cs.currency)}
                className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1.5 ${
                  selectedCurrency === cs.currency
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                }`}
              >
                <span>{cs.currency}</span>
                <span className="text-[10px] opacity-80">({formatCurrencyAmount(cs.total_amount, cs.currency)})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {currentSummary ? currentSummary.count : (stats?.total_invoices || 0)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats?.processed_invoices || 0} fully processed</span>
            </div>
          </div>
        </div>

        {/* Total Invoiced Amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {selectedCurrency === "ALL" ? "Total Invoiced (All)" : `Total Invoiced (${selectedCurrency})`}
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrencyAmount(displayTotal, activeCurrencyCode)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Extracted in invoice's native currency
            </div>
          </div>
        </div>

        {/* Unpaid Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unpaid Balance</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 font-mono">
              {formatCurrencyAmount(displayUnpaid, activeCurrencyCode)}
            </div>
            <div className="text-[11px] text-amber-600 mt-1">Pending vendor payment settlement</div>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue Balance</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-700 font-mono">
              {formatCurrencyAmount(displayOverdue, activeCurrencyCode)}
            </div>
            <div className="text-[11px] text-rose-600 mt-1">Requires immediate AP review</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Monthly Invoice Volume</h2>
              <p className="text-[11px] text-slate-400">Total documents ingested per month</p>
            </div>
          </div>
          <MonthlyVolumeChart data={stats?.monthly_volume || []} />
        </div>

        {/* Monthly Amount Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Invoiced Spend by Month</h2>
              <p className="text-[11px] text-slate-400">Native currency volumes</p>
            </div>
          </div>
          <MonthlyAmountChart data={stats?.monthly_amount || []} currency={activeCurrencyCode || "Total"} />
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payment Status Mix</h2>
              <p className="text-[11px] text-slate-400">Paid, Unpaid, and Overdue distribution</p>
            </div>
          </div>
          <PaymentDistributionChart data={stats?.payment_distribution || []} />
        </div>
      </div>

      {/* Recent Ingested Invoices Ledger Snippet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Ingested Invoices</h2>
            <p className="text-[11px] text-slate-400">Latest documents processed by the pipeline</p>
          </div>
          <button
            onClick={onNavigateToInvoicesList}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            View Complete Ledger →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Total Amount</th>
                <th className="py-2.5 px-4">Payment</th>
                <th className="py-2.5 px-4">Quality Score</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No recent invoices found. Ingest your first document to start.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onNavigateToInvoice(inv.id)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {inv.invoice_number || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-[200px] truncate">
                      {inv.supplier_name || "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{inv.invoice_date || "—"}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrencyAmount(inv.total_amount, inv.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.payment_status} type="payment" />
                    </td>
                    <td className="py-3 px-4">
                      <ConfidenceBadge score={inv.confidence_score} showDetails={false} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} type="processing" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
