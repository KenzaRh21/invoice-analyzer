import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Invoice, formatCurrencyAmount } from "../types";
import {
  ArrowLeft,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  Building,
  UserCheck,
  Calendar,
  CreditCard,
  Clock,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Receipt,
  Copy,
  ExternalLink,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { ManualCorrectionModal } from "../components/ManualCorrectionModal";

interface InvoiceDetailPageProps {
  invoiceId: string;
  onBack: () => void;
  onNavigateToInvoice?: (id: string) => void;
}

export const InvoiceDetailPage: React.FC<InvoiceDetailPageProps> = ({
  invoiceId,
  onBack,
  onNavigateToInvoice,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [previewMode, setPreviewMode] = useState<"rendered" | "original">("rendered");

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error("Failed to load invoice details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const handleSaveCorrection = async (updatedFields: Partial<Invoice>) => {
    const updated = await api.updateInvoice(invoiceId, updatedFields);
    setInvoice(updated);
  };

  const handleReprocess = async () => {
    try {
      setReprocessing(true);
      await api.reprocessInvoice(invoiceId);
      await loadInvoice();
    } catch (err) {
      alert("Failed to reprocess invoice with AI.");
    } finally {
      setReprocessing(false);
    }
  };

  if (loading || !invoice) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">Loading invoice extraction data...</span>
        </div>
      </div>
    );
  }

  const documentUrl = api.getDocumentUrl(invoice.id);
  const isPdf = invoice.file_name?.toLowerCase().endsWith(".pdf");

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Back to ledger"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                {invoice.invoice_number || "Draft Invoice"}
              </h1>
              <StatusBadge status={invoice.payment_status} type="payment" />
              <ConfidenceBadge score={invoice.confidence_score} showDetails={true} />
              {invoice.currency ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  {invoice.currency}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Currency Unknown
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              File: <span className="font-medium text-slate-700">{invoice.file_name}</span> • Ingested on{" "}
              {new Date(invoice.created_at).toLocaleDateString()} • Provider: {invoice.provider_used}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Edit Extracted Fields</span>
          </button>

          <button
            disabled={reprocessing}
            onClick={handleReprocess}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${reprocessing ? "animate-spin" : ""}`} />
            <span>{reprocessing ? "Reprocessing..." : "Reprocess with AI"}</span>
          </button>

          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => api.downloadExport(invoice.id, "csv")}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-r border-slate-200 transition-colors"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => api.downloadExport(invoice.id, "json")}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Export as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate Warning Banner */}
      {invoice.is_duplicate && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 flex-1">
            <span className="font-bold text-sm block">⚠️ Potential Duplicate Invoice Detected</span>
            This invoice shares the same invoice number ({invoice.invoice_number}) and supplier as a previously ingested record.
            {invoice.duplicate_of_id && onNavigateToInvoice && (
              <button
                onClick={() => onNavigateToInvoice(invoice.duplicate_of_id!)}
                className="mt-1 inline-flex items-center gap-1 text-rose-700 underline font-semibold hover:text-rose-900"
              >
                <span>View original invoice record ({invoice.duplicate_of_id.slice(0, 8)}...)</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Human-in-the-Loop Review Banner */}
      {invoice.requires_review && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 flex-1">
            <span className="font-bold text-sm block">Auditor Verification Requested</span>
            <span>
              {invoice.review_notes || "Please review extracted amounts, vendor information, or currency determination before approving payment."}
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Review & Resolve
          </button>
        </div>
      )}

      {/* Main Grid: Visual Document Representation + Structured Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Visual Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[700px]">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Document Preview
                </span>
              </div>
              {/* Preview Mode Switcher */}
              <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setPreviewMode("rendered")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    previewMode === "rendered" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Layout Paper
                </button>
                <button
                  onClick={() => setPreviewMode("original")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                    previewMode === "original" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Original Document</span>
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100/50 flex justify-center">
              {previewMode === "rendered" ? (
                /* Rendered Invoice Paper Layout */
                <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-sm border border-slate-200/80 font-sans text-xs space-y-5 self-start">
                  {/* Paper Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase">
                        {invoice.supplier_name || "SUPPLIER INVOICE"}
                      </h2>
                      {invoice.supplier_tax_id && (
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">Tax ID / ICE: {invoice.supplier_tax_id}</p>
                      )}
                      {invoice.supplier_address && (
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-tight">
                          {invoice.supplier_address}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-700 font-mono">
                        FACTURE / INVOICE
                      </div>
                      <div className="font-mono font-semibold text-slate-800 mt-1">
                        {invoice.invoice_number || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Date: {invoice.invoice_date || "—"}</div>
                      {invoice.due_date && (
                        <div className="text-[10px] text-slate-400">Due: {invoice.due_date}</div>
                      )}
                      {invoice.currency && (
                        <div className="text-[10px] font-mono font-bold text-indigo-600 mt-1">
                          Currency: {invoice.currency}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Box */}
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Facturé à / Bill To:
                    </span>
                    <div className="font-semibold text-slate-800">
                      {invoice.customer_name || "CLIENT / DESTINATAIRE"}
                    </div>
                    {invoice.customer_tax_id && (
                      <p className="text-[10px] text-slate-500 font-mono">Tax ID: {invoice.customer_tax_id}</p>
                    )}
                  </div>

                  {/* Line Items Table */}
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                        <th className="py-1 text-left">Description</th>
                        <th className="py-1 text-center w-10">Qté</th>
                        <th className="py-1 text-right w-16">P.U.</th>
                        <th className="py-1 text-right w-16">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 text-slate-800">{it.description}</td>
                            <td className="py-1.5 text-center font-mono text-slate-600">{it.quantity}</td>
                            <td className="py-1.5 text-right font-mono text-slate-600">{it.unit_price?.toLocaleString()}</td>
                            <td className="py-1.5 text-right font-mono font-semibold text-slate-800">
                              {it.total?.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-3 text-center text-slate-400 italic">
                            No extracted individual line items.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Totals Summary */}
                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <div className="w-48 space-y-1 text-right font-mono">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Sous-total:</span>
                        <span>{formatCurrencyAmount(invoice.subtotal, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>TVA / Tax:</span>
                        <span>{formatCurrencyAmount(invoice.tax_amount, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold text-xs pt-1 border-t border-slate-200">
                        <span>Total:</span>
                        <span className="text-indigo-700">{formatCurrencyAmount(invoice.total_amount, invoice.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Original Document (PDF/Image) Viewer */
                <div className="w-full h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden">
                  {isPdf ? (
                    <iframe
                      src={documentUrl}
                      title="Invoice PDF Preview"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-slate-950">
                      <img
                        src={documentUrl}
                        alt="Original invoice document"
                        className="max-w-full max-h-full object-contain rounded shadow-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Raw OCR/Parsed Text Inspector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Raw OCR Extracted Document Text</span>
              </div>
              {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showRawText && (
              <div className="p-4 border-t border-slate-100 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                <pre>{invoice.raw_text || "No raw text recorded for this document."}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Structured Extracted Information & Auditing (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Supplier and Customer Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <Building className="w-4 h-4" />
                <span>Supplier / Fournisseur</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {invoice.supplier_name || <span className="text-slate-400 italic">Not extracted</span>}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400 text-[11px]">Tax ID / ICE:</span>
                    <span className="font-semibold text-slate-800">{invoice.supplier_tax_id || "—"}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-500">
                    <span className="text-slate-400 block mb-0.5">Address:</span>
                    {invoice.supplier_address || "No address extracted"}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                <span>Client / Destinataire</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {invoice.customer_name || <span className="text-slate-400 italic">Not specified</span>}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400 text-[11px]">Tax ID / ICE:</span>
                    <span className="font-semibold text-slate-800">{invoice.customer_tax_id || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Totals Breakdown Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Financial Totals & Currency
              </span>
              <span className="text-xs font-mono font-bold text-indigo-700 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
                Currency: {invoice.currency || "Unspecified"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-500 font-medium block">Subtotal (HT)</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {formatCurrencyAmount(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-500 font-medium block">Tax / VAT Amount</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {formatCurrencyAmount(invoice.tax_amount, invoice.currency)}
                </span>
              </div>
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                <span className="text-[11px] text-indigo-700 font-semibold block">Total Due (TTC)</span>
                <span className="text-lg font-bold font-mono text-indigo-900 mt-0.5 block">
                  {formatCurrencyAmount(invoice.total_amount, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Extracted Line Items Ledger */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted Line Items ({invoice.items?.length || 0})
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Adjust Items</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-center">Tax %</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-medium text-slate-800">{it.description}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">{it.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {formatCurrencyAmount(it.unit_price, invoice.currency)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {it.tax_rate ? `${it.tax_rate}%` : "0%"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          {formatCurrencyAmount(it.total, invoice.currency)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No line items parsed. Click "Edit Extracted Fields" to manually input itemized services.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Pipeline Telemetry & Audit Meta */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Processing Latency: <strong className="text-slate-800">{invoice.processing_time_ms} ms</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Extraction Engine: <strong className="text-slate-800">{invoice.provider_used}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Last Updated: <strong className="text-slate-800">{new Date(invoice.updated_at).toLocaleTimeString()}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Correction Modal */}
      {isModalOpen && (
        <ManualCorrectionModal
          invoice={invoice}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCorrection}
        />
      )}
    </div>
  );
};
