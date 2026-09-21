import React, { useState, useEffect } from "react";
import { User } from "./types";
import { api } from "./services/api";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { DashboardPage } from "./pages/DashboardPage";
import { InvoicesListPage } from "./pages/InvoicesListPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { UploadPage } from "./pages/UploadPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuthPage } from "./pages/AuthPage";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("inv_auth_token");
    if (token) {
      api
        .getMe()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          localStorage.removeItem("inv_auth_token");
          // Fallback to default demo user for seamless preview
          setCurrentUser({
            id: "usr_demo_88201",
            email: "demo@invoice.ma",
            full_name: "Enterprise Finance Lead",
            created_at: "2026-09-01T08:00:00Z",
          });
        })
        .finally(() => {
          setAuthChecking(false);
        });
    } else {
      // Default to demo user for instantaneous portfolio review
      setCurrentUser({
        id: "usr_demo_88201",
        email: "demo@invoice.ma",
        full_name: "Enterprise Finance Lead",
        created_at: "2026-09-01T08:00:00Z",
      });
      setAuthChecking(false);
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab("dashboard");
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Initializing AI Invoice Analyzer...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Primary Sidebar */}
      <Sidebar
        currentTab={selectedInvoiceId ? "invoices" : currentTab}
        setCurrentTab={(tab) => {
          setSelectedInvoiceId(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentTab={selectedInvoiceId ? "invoices" : currentTab}
          onOpenUpload={() => {
            setSelectedInvoiceId(null);
            setCurrentTab("upload");
          }}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {selectedInvoiceId ? (
            <InvoiceDetailPage
              invoiceId={selectedInvoiceId}
              onBack={() => setSelectedInvoiceId(null)}
            />
          ) : currentTab === "dashboard" ? (
            <DashboardPage
              onNavigateToInvoice={(id) => setSelectedInvoiceId(id)}
              onNavigateToInvoicesList={() => setCurrentTab("invoices")}
              onNavigateToUpload={() => setCurrentTab("upload")}
            />
          ) : currentTab === "invoices" ? (
            <InvoicesListPage
              onNavigateToInvoice={(id) => setSelectedInvoiceId(id)}
              onNavigateToUpload={() => setCurrentTab("upload")}
            />
          ) : currentTab === "upload" ? (
            <UploadPage
              onUploadSuccess={(newId) => {
                setSelectedInvoiceId(newId);
              }}
            />
          ) : currentTab === "settings" ? (
            <SettingsPage />
          ) : null}
        </main>
      </div>
    </div>
  );
}
