import React, { useState } from "react";
import { Invoice, InvoiceItem } from "../types";
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface ManualCorrectionModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<Invoice>) => Promise<void>;
}

const COMMON_CURRENCIES = [
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "MAD", label: "MAD (DH) - Moroccan Dirham" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "CHF", label: "CHF - Swiss Franc" },
  { code: "AED", label: "AED - UAE Dirham" },
  { code: "SAR", label: "SAR - Saudi Riyal" },
  { code: "JPY", label: "JPY (¥) - Japanese Yen" },
];

export const ManualCorrectionModal: React.FC<ManualCorrectionModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoice_number || "");
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoice_date || "");
  const [dueDate, setDueDate] = useState(invoice.due_date || "");
  const [supplierName, setSupplierName] = useState(invoice.supplier_name || "");
  const [supplierTaxId, setSupplierTaxId] = useState(invoice.supplier_tax_id || "");
  const [supplierAddress, setSupplierAddress] = useState(invoice.supplier_address || "");
  const [customerName, setCustomerName] = useState(invoice.customer_name || "");
  const [customerTaxId, setCustomerTaxId] = useState(invoice.customer_tax_id || "");
  const [currency, setCurrency] = useState(invoice.currency || "");
  const [subtotal, setSubtotal] = useState(invoice.subtotal || 0);
  const [taxAmount, setTaxAmount] = useState(invoice.tax_amount || 0);
  const [totalAmount, setTotalAmount] = useState(invoice.total_amount || 0);
  const [paymentStatus, setPaymentStatus] = useState(invoice.payment_status || "UNPAID");
  const [requiresReview, setRequiresReview] = useState(invoice.requires_review || false);
  const [reviewNotes, setReviewNotes] = useState(invoice.review_notes || "");

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice.items && invoice.items.length > 0
      ? [...invoice.items]
      : [{ description: "General Services", quantity: 1, unit_price: invoice.subtotal || 1000, tax_rate: 20, total: invoice.subtotal || 1000 }]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recalculate totals from items
  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };
    if (field === "quantity" || field === "unit_price") {
      const q = field === "quantity" ? Number(val) : current.quantity;
      const p = field === "unit_price" ? Number(val) : current.unit_price;
      current.total = Math.round(q * p * 100) / 100;
    }
    updated[index] = current;
    setItems(updated);

    // Update subtotal & total
    const newSubtotal = updated.reduce((sum, it) => sum + (it.total || 0), 0);
    setSubtotal(newSubtotal);
    const newTax = Math.round(newSubtotal * 0.2 * 100) / 100;
    setTaxAmount(newTax);
    setTotalAmount(newSubtotal + newTax);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: "New Item", quantity: 1, unit_price: 0, tax_rate: 20, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const filtered = items.filter((_, idx) => idx !== index);
    setItems(filtered);
    const newSubtotal = filtered.reduce((sum, it) => sum + (it.total || 0), 0);
    setSubtotal(newSubtotal);
    const newTax = Math.round(newSubtotal * 0.2 * 100) / 100;
    setTaxAmount(newTax);
    setTotalAmount(newSubtotal + newTax);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        supplier_name: supplierName,
        supplier_tax_id: supplierTaxId || null,
        supplier_address: supplierAddress || null,
        customer_name: customerName || null,
        customer_tax_id: customerTaxId || null,
        currency: currency.trim() ? currency.trim().toUpperCase() : null,
        subtotal: Number(subtotal),
        tax_amount: Number(taxAmount),
        total_amount: Number(totalAmount),
        payment_status: paymentStatus as any,
        requires_review: requiresReview,
        review_notes: reviewNotes || null,
        items,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to persist corrected fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Human-in-the-Loop Field Correction</h2>
            <p className="text-xs text-slate-500">
              Audit, adjust, and correct extracted OCR/LLM invoice metadata and line items.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency (ISO 4217)</label>
              <div className="flex gap-1.5">
                <select
                  value={COMMON_CURRENCIES.some((c) => c.code === currency) ? currency : (currency ? "OTHER" : "UNKNOWN")}
                  onChange={(e) => {
                    if (e.target.value === "UNKNOWN") setCurrency("");
                    else if (e.target.value !== "OTHER") setCurrency(e.target.value);
                  }}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="UNKNOWN">Unspecified / Unknown</option>
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                  <option value="OTHER">Other Custom Code...</option>
                </select>
                <input
                  type="text"
                  placeholder="Code"
                  maxLength={4}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-xs uppercase font-mono text-center"
                  title="ISO-4217 Currency Code"
                />
              </div>
            </div>
          </div>

          {/* Supplier & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Supplier Information</h3>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID / ICE / VAT</label>
                <input
                  type="text"
                  placeholder="e.g. ICE, IF, or VAT number"
                  value={supplierTaxId}
                  onChange={(e) => setSupplierTaxId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Supplier Address</label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Customer & Status</h3>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID / ICE</label>
                <input
                  type="text"
                  placeholder="e.g. ICE 009876543210098"
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Line Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Description</th>
                    <th className="py-2 px-3 font-semibold w-20">Qty</th>
                    <th className="py-2 px-3 font-semibold w-28">Price ({currency || "—"})</th>
                    <th className="py-2 px-3 font-semibold w-20">Tax %</th>
                    <th className="py-2 px-3 font-semibold w-28">Total ({currency || "—"})</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          placeholder="Item description"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          value={it.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          value={it.tax_rate}
                          onChange={(e) => handleItemChange(idx, "tax_rate", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right"
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-slate-800">
                        {it.total?.toLocaleString()} {currency}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit & Review Notes */}
          <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reqReview"
                checked={requiresReview}
                onChange={(e) => setRequiresReview(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="reqReview" className="text-xs font-semibold text-amber-900 cursor-pointer">
                Flag this invoice for AP / Finance Human Review
              </label>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-amber-800 mb-1">
                Auditor Review / Verification Notes
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Verified vendor tax ID against official registry, confirmed USD exchange rate."
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (HT):</span>
                <span className="font-mono font-medium">{subtotal.toLocaleString()} {currency || "—"}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA / Tax:</span>
                <span className="font-mono font-medium">{taxAmount.toLocaleString()} {currency || "—"}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-1.5 border-t border-slate-200">
                <span>Total (TTC):</span>
                <span className="font-mono text-indigo-700">{totalAmount.toLocaleString()} {currency || "—"}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Corrections"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
