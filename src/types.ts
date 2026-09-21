export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  file_name: string;
  file_path?: string;
  status: "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  supplier_name: string | null;
  supplier_tax_id: string | null;
  supplier_address: string | null;
  customer_name: string | null;
  customer_tax_id: string | null;
  currency: string | null; // ISO 4217 code (USD, EUR, MAD, etc.) or null if undetermined
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: "PAID" | "UNPAID" | "OVERDUE" | "UNKNOWN";
  raw_text?: string | null;
  confidence_score: number;
  processing_time_ms: number;
  provider_used: string;
  error_message?: string | null;
  is_duplicate?: boolean;
  duplicate_of_id?: string | null;
  requires_review?: boolean;
  review_notes?: string | null;
  confidence_breakdown?: {
    score: number;
    level: string;
    requires_review: boolean;
    review_reasons: string[];
    breakdown: Record<string, any>;
    currency_detected: boolean;
    disclaimer: string;
  };
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface CurrencySummary {
  currency: string;
  total_amount: number;
  unpaid_amount: number;
  overdue_amount: number;
  count: number;
}

export interface DashboardStats {
  total_invoices: number;
  processed_invoices: number;
  pending_invoices: number;
  failed_invoices: number;
  total_amount: number;
  unpaid_amount: number;
  overdue_amount: number;
  currency?: string | null;
  currency_summaries?: CurrencySummary[];
  monthly_volume: Array<{ month: string; count: number }>;
  monthly_amount: Array<{ month: string; amount: number }>;
  payment_distribution: Array<{ status: string; count: number }>;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export function formatCurrencyAmount(amount: number | null | undefined, currencyCode?: string | null): string {
  const val = amount || 0;
  const curr = currencyCode ? currencyCode.trim().toUpperCase() : null;

  if (!curr || curr === "UNKNOWN") {
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Unspecified)`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 2,
    }).format(val);
  } catch {
    // If currency isn't recognized by Intl
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
  }
}
