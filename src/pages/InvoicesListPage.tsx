import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Invoice, formatCurrencyAmount } from "../types";
import {
  Search,
  Filter,
  Trash2,
  ExternalLink,
  RefreshCw,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  FileJson,
  AlertTriangle,
  Copy,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfidenceBadge } from "../components/ConfidenceBadge";

interface InvoicesListPageProps {
  onNavigateToInvoice: (id: string) => void;
  onNavigateToUpload: () => void;
}

export const InvoicesListPage: React.FC<InvoicesListPageProps> = ({
  onNavigateToInvoice,
  onNavigateToUpload,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices({
        search,
        status: statusFilter,
        payment_status: paymentFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 10,
      });
      setInvoices(res.items);
      setTotalPages(res.pages);
      setTotalCount(res.total);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter, paymentFilter, sortBy, sortOrder, page]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this invoice and its processing records?")) return;
    try {
      await api.deleteInvoice(id);
      fetchInvoices();
    } catch (err) {
      alert("Failed to delete invoice.");
    }
  };

  const handleExport = (id: string, format: "csv" | "json", e: React.MouseEvent) => {
    e.stopPropagation();
    api.downloadExport(id, format);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Processing Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, audit, and export all ingested enterprise invoice records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Process New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice number, supplier name, or tax ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Processing Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Processing States</option>
              <option value="PROCESSED">Fully Processed</option>
              <option value="PROCESSING">Processing In-Flight</option>
              <option value="UPLOADED">Uploaded / Queued</option>
              <option value="FAILED">Processing Failed</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="UNKNOWN">Status Unknown</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("_");
                setSortBy(sb);
                setSortOrder(so as any);
              }}
              className="px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="created_at_desc">Newest Ingested</option>
              <option value="created_at_asc">Oldest Ingested</option>
              <option value="total_amount_desc">Highest Amount</option>
              <option value="total_amount_asc">Lowest Amount</option>
              <option value="confidence_score_desc">Highest Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Supplier & Tax ID</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Quality & Audit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching invoices found. Try clearing filters or ingest a new document.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onNavigateToInvoice(inv.id)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{inv.invoice_number || "—"}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {inv.is_duplicate && (
                        <div className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded mt-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Duplicate Alert</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 max-w-[220px] truncate">
                        {inv.supplier_name || "Unknown Supplier"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.supplier_tax_id ? `Tax ID: ${inv.supplier_tax_id}` : inv.file_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Issued: {inv.invoice_date || "—"}</div>
                      {inv.due_date && <div className="text-[10px] text-slate-400">Due: {inv.due_date}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      <div>{formatCurrencyAmount(inv.total_amount, inv.currency)}</div>
                      {inv.currency && (
                        <span className="text-[10px] text-slate-400 font-normal">{inv.currency}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.payment_status} type="payment" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <ConfidenceBadge score={inv.confidence_score} showDetails={false} />
                        {inv.requires_review && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.status} type="processing" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleExport(inv.id, "csv", e)}
                          title="Export CSV"
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleExport(inv.id, "json", e)}
                          title="Export JSON"
                          className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <FileJson className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(inv.id, e)}
                          title="Delete invoice record"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{invoices.length}</strong> of{" "}
            <strong className="text-slate-800">{totalCount}</strong> total invoices
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <span className="font-mono text-slate-700 font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
