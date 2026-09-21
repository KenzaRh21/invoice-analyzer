import { DashboardStats, Invoice, User } from "../types";

const API_BASE = "/api";

function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("inv_auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Authentication failed.");
    }
    const data = await res.json();
    localStorage.setItem("inv_auth_token", data.access_token);
    return data;
  },

  async register(email: string, password: string, fullName: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed.");
    }
    const data = await res.json();
    localStorage.setItem("inv_auth_token", data.access_token);
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  logout() {
    localStorage.removeItem("inv_auth_token");
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
    return res.json();
  },

  // Invoices
  async getInvoices(params: {
    search?: string;
    status?: string;
    payment_status?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Invoice[]; total: number; page: number; pages: number }> {
    const url = new URL(`${API_BASE}/invoices`, window.location.origin);
    if (params.search) url.searchParams.set("search", params.search);
    if (params.status && params.status !== "ALL") url.searchParams.set("status", params.status);
    if (params.payment_status && params.payment_status !== "ALL") url.searchParams.set("payment_status", params.payment_status);
    if (params.sort_by) url.searchParams.set("sort_by", params.sort_by);
    if (params.sort_order) url.searchParams.set("sort_order", params.sort_order);
    if (params.page) url.searchParams.set("page", String(params.page));
    if (params.limit) url.searchParams.set("limit", String(params.limit));

    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to retrieve invoices");
    return res.json();
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Invoice not found");
    return res.json();
  },

  async uploadInvoice(file: File): Promise<Invoice> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("inv_auth_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/invoices/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Upload & processing failed");
    }
    return res.json();
  },

  async updateInvoice(id: string, payload: Partial<Invoice>): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update invoice");
    return res.json();
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete invoice");
  },

  async reprocessInvoice(id: string): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${id}/reprocess`, {
      method: "POST",
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error("Failed to reprocess invoice");
    return res.json();
  },

  downloadExport(id: string, format: "csv" | "json") {
    const token = localStorage.getItem("inv_auth_token");
    const url = `${API_BASE}/invoices/${id}/export?format=${format}&token=${token || ""}`;
    window.open(url, "_blank");
  },

  getDocumentUrl(id: string): string {
    const token = localStorage.getItem("inv_auth_token");
    return `${API_BASE}/invoices/${id}/file?token=${token || ""}`;
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
