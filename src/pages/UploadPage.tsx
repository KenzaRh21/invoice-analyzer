import React, { useState, useRef } from "react";
import { api } from "../services/api";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface UploadPageProps {
  onUploadSuccess: (invoiceId: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pipelineSteps = [
    { label: "Uploading invoice document to secure container", icon: UploadCloud },
    { label: "Executing optical character recognition (OCR)", icon: FileText },
    { label: "AI structured entity extraction & currency inference", icon: Sparkles },
    { label: "Schema validation, tax check & confidence scoring", icon: ShieldCheck },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    // Validate size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 10MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setProcessing(true);
    setStep(0);

    // Step simulation for visual feedback
    const stepInterval = setInterval(() => {
      setStep((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const result = await api.uploadInvoice(selectedFile);
      clearInterval(stepInterval);
      setStep(4);
      setTimeout(() => {
        onUploadSuccess(result.id);
      }, 700);
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "Failed to process invoice.");
      setProcessing(false);
    }
  };

  // Quick Test Sample Invoices (creates realistic virtual files)
  const handleQuickSample = (name: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const sampleFile = new File([blob], name, { type: "application/pdf" });
    processSelectedFile(sampleFile);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ingest & Analyze Invoices</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload PDF or image invoices (JPG, PNG). The system will automatically run OCR, multi-currency detection, line-item parsing, and confidence scoring.
        </p>
      </div>

      {/* Main Upload Dropzone Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <form
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all ${
            dragActive
              ? "border-indigo-600 bg-indigo-50/50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50/30"
          } ${processing ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Drag and drop your invoice here, or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
            >
              browse computer
            </button>
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md">
            Supports PDF, JPG, JPEG, and PNG files up to 10MB. OCR and entity extraction will begin automatically.
          </p>
        </form>

        {/* Processing Steps Indicator */}
        {processing && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                Automated Processing Pipeline
              </span>
              <span className="text-xs font-mono font-medium text-indigo-600">
                {file?.name} ({(file?.size! / 1024).toFixed(1)} KB)
              </span>
            </div>

            <div className="space-y-3">
              {pipelineSteps.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = step > idx;
                const isCurrent = step === idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 text-xs transition-colors ${
                      isCompleted
                        ? "text-emerald-700 font-medium"
                        : isCurrent
                        ? "text-indigo-700 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      )}
                    </div>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick Test Demo Samples */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Try Quick Test Invoices (Ready-to-Test Multi-Currency Scenarios)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sample 1: USD Tech Corporation */}
          <div
            onClick={() =>
              handleQuickSample(
                "invoice_us_tech.pdf",
                "DATACLOUD ENTERPRISE SYSTEMS INC\n100 Silicon Ave, San Francisco CA\nINVOICE #: US-2026-9041\nDate: 2026-09-12\nDue Date: 2026-10-12\nBILL TO: Acme Retail Corp\nDESCRIPTION: Enterprise Kubernetes Cluster - 1 Month: $4,500.00\nProfessional Security Audit: $950.00\nSUBTOTAL: $5,450.00\nTAX (0%): $0.00\nTOTAL DUE: $5,450.00 USD"
              )
            }
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                USD ($) Enterprise Cloud SaaS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                USD $5,450.00
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-snug">
              DataCloud Systems Inc • $5,450.00 USD • Demonstrates US Dollar symbol ($) and ISO code (USD) detection without MAD conversion.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <span>Test extraction</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Sample 2: EUR European Telecom & Cloud */}
          <div
            onClick={() =>
              handleQuickSample(
                "invoice_eur_telecom.pdf",
                "EUROPE DATA NETWORKS SAS\n45 Rue de la Paix, 75002 Paris, France\nTVA: FR 89 123456789\nFACTURE N°: EUR-2026-4412\nDate: 2026-09-14\nTotal HT: 2 500,00 €\nTVA (20%): 500,00 €\nTOTAL TTC: 3 000,00 €"
              )
            }
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                EUR (€) European Cloud & Telecom
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                EUR €3,000.00
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-snug">
              Europe Data Networks SAS • €3,000.00 EUR • Tests European comma decimal separators and Euro symbol (€) parsing.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <span>Test extraction</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Sample 3: MAD Moroccan Engineering & ICE */}
          <div
            onClick={() =>
              handleQuickSample(
                "invoice_moroccan_ice.pdf",
                "SOCIETE MAROCAINE D'INGENIERIE ET TRAVAUX - SMIT SA\nBoulevard Zerktouni, Casablanca, Maroc\nICE: 001523489000045\nIF: 40129854\nFACTURE N°: FAC-2026-00125\nDate: 2026-09-18\nÉchéance: 2026-10-18\nClient: SOCIETE INDUSTRIELLE DU DETROIT\nICE Client: 002987112000033\nTotal HT: 26 000,00 MAD\nTVA (20%): 5 200,00 MAD\nNET A PAYER: 31 200,00 MAD"
              )
            }
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                MAD (DH) Moroccan Tax & ICE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                31,200.00 MAD
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-snug">
              SMIT SA • 31,200.00 MAD • Tests Moroccan legal business requirements: ICE, Identifiant Fiscal (IF), and 20% TVA.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <span>Test extraction</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Sample 4: Missing Fields & Duplicate Detection */}
          <div
            onClick={() =>
              handleQuickSample(
                "invoice_missing_fields.pdf",
                "GLOBEX LOGISTICS\nFacture: INV-GLX-881\nPalettes bois | Total: 6000\n(Currency unspecified)"
              )
            }
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Missing Currency & Low Confidence
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Review Required
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-snug">
              Globex Logistics • Currency undetermined • Missing due date, missing customer and tax ID. Flags auditor for human review.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
              <span>Test extraction</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
