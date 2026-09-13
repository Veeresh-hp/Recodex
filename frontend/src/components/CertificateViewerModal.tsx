import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Award, Download, ExternalLink, Printer, XCircle, ZoomIn, ZoomOut,
  RotateCw, Maximize2, Minimize2, Eye, FileText, Image as ImageIcon,
  CheckCircle2, ShieldCheck, RefreshCw, AlertCircle, FileCheck, Layers
} from "lucide-react";

export interface CertificateItem {
  id: string;
  studentName?: string;
  recipientName?: string;
  userEmail?: string;
  recipientEmail?: string;
  projectName?: string;
  projectTitle?: string;
  issueDate?: string;
  status?: string;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  description?: string;
  credentialId?: string;
}

interface Props {
  certificate: CertificateItem;
  onClose: () => void;
}

/**
 * Robust file downloader that bypasses cross-origin download restrictions.
 */
export async function downloadCertificateFile(url: string, filename: string) {
  try {
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // Try fetching binary blob to guarantee download attribute works across origins
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    // Direct link fallback
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

/**
 * Safely opens document in new tab, converting base64 data URIs to blob URLs
 * so modern Chromium won't block top-level navigation.
 */
export function openCertificateInNewTab(url: string, blobUrl?: string) {
  const target = blobUrl || url;
  if (target.startsWith("data:")) {
    try {
      const parts = target.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "application/pdf";
      const binary = atob(parts[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const b = new Blob([bytes], { type: mime });
      const bUrl = URL.createObjectURL(b);
      window.open(bUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(bUrl), 60000);
      return;
    } catch (e) {
      console.warn("Blob conversion failed, attempting direct window.open:", e);
    }
  }
  window.open(target, "_blank", "noopener,noreferrer");
}

export default function CertificateViewerModal({ certificate, onClose }: Props) {
  const fileData = certificate.fileData || "";
  const fileName = certificate.fileName || "";
  const fileType = certificate.fileType || "";
  const studentName = certificate.studentName || certificate.recipientName || "Student Developer";
  const projectName = certificate.projectName || certificate.projectTitle || "Software Engineering Project";
  const issueDate = certificate.issueDate || "Issued by RecodeX";
  const certId = certificate.credentialId || certificate.id;

  // Detect whether this is a PDF or an image
  const isPdf = useMemo(() => {
    if (!fileData && !fileName && !fileType) return false;
    const fd = fileData.toLowerCase();
    const fn = fileName.toLowerCase();
    const ft = fileType.toLowerCase();
    if (ft.includes("pdf")) return true;
    if (fn.endsWith(".pdf") || fn.includes(".pdf")) return true;
    if (fd.startsWith("data:application/pdf")) return true;
    if (fd.includes(".pdf")) return true;
    return false;
  }, [fileData, fileName, fileType]);

  const isImage = useMemo(() => {
    if (!fileData && !fileName && !fileType) return false;
    if (isPdf) return false;
    const fd = fileData.toLowerCase();
    const fn = fileName.toLowerCase();
    const ft = fileType.toLowerCase();
    if (ft.startsWith("image/")) return true;
    if (fd.startsWith("data:image/")) return true;
    if (/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(fn)) return true;
    if (/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(fd)) return true;
    return true; // Default fallback to image if non-PDF document
  }, [fileData, fileName, fileType, isPdf]);

  const isCloudinary = Boolean(fileData && fileData.includes("res.cloudinary.com"));

  // Cloudinary image transformation URL for PDF (converts PDF page 1 to crisp PNG)
  const cloudinaryPngUrl = useMemo(() => {
    if (!isCloudinary || !fileData) return "";
    let clean = fileData.replace(/\.pdf(\?.*)?$/i, ".png$1");
    if (clean.includes("/upload/")) {
      clean = clean.replace(/\/upload\/(v\d+\/)?/, "/upload/f_png,q_auto:best,w_1800/$1");
    }
    return clean;
  }, [fileData, isCloudinary]);

  // Google Docs Viewer fallback for remote public PDFs
  const googleDocsViewerUrl = useMemo(() => {
    if (!fileData || fileData.startsWith("data:") || fileData.startsWith("blob:")) return "";
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileData)}&embedded=true`;
  }, [fileData]);

  // Convert base64 PDF data URL to local Blob URL so Chrome won't block the iframe
  const [blobPdfUrl, setBlobPdfUrl] = useState<string>("");
  useEffect(() => {
    let createdUrl = "";
    if (fileData && fileData.startsWith("data:application/pdf")) {
      try {
        const base64Data = fileData.split(",")[1] || fileData;
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(blob);
        setBlobPdfUrl(createdUrl);
      } catch (err) {
        console.error("Failed to generate PDF blob URL:", err);
      }
    } else {
      setBlobPdfUrl("");
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileData]);

  // The primary PDF source to render in iframe/object
  const activePdfSource = blobPdfUrl || fileData;

  // Viewer modes:
  // "document" -> native iframe/object PDF viewer
  // "image"    -> rendered PNG image (Cloudinary or image view)
  // "gdocs"    -> Google Docs embedded viewer
  const [pdfViewMode, setPdfViewMode] = useState<"document" | "image" | "gdocs">("document");

  // Image viewer zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePrint = () => {
    window.print();
  };

  const safeDownloadFilename = fileName || `Certificate_${certId}_${studentName.replace(/\s+/g, "_")}.${isPdf ? "pdf" : "png"}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-text"
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #recodex-print-certificate, #recodex-print-certificate * {
            visibility: visible !important;
          }
          #recodex-print-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
            z-index: 99999 !important;
          }
          #recodex-print-certificate img {
            max-width: 100% !important;
            max-height: 100vh !important;
            object-fit: contain !important;
          }
          #recodex-print-certificate iframe, #recodex-print-certificate object {
            width: 100vw !important;
            height: 100vh !important;
          }
        }
      `}</style>

      <div
        className={`relative w-full ${
          isFullscreen ? "max-w-[98vw] h-[96vh]" : "max-w-5xl max-h-[94vh]"
        } bg-[#080b12] text-white border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_90px_rgba(0,209,255,0.22)] flex flex-col overflow-hidden transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-200 font-bold">
                  Official Certificate Document
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  {isPdf ? "PDF Document" : "Official Image"}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 truncate max-w-sm mt-0.5">
                {studentName} • {certId}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {/* PDF View Mode Switchers */}
            {isPdf && (
              <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPdfViewMode("document")}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    pdfViewMode === "document"
                      ? "bg-cyan-500 text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Native PDF Document Viewer"
                >
                  <FileText size={12} />
                  <span>PDF</span>
                </button>

                {cloudinaryPngUrl && (
                  <button
                    type="button"
                    onClick={() => setPdfViewMode("image")}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      pdfViewMode === "image"
                        ? "bg-cyan-500 text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                    title="Rendered Crisp Image View"
                  >
                    <ImageIcon size={12} />
                    <span>Image</span>
                  </button>
                )}

                {googleDocsViewerUrl && (
                  <button
                    type="button"
                    onClick={() => setPdfViewMode("gdocs")}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      pdfViewMode === "gdocs"
                        ? "bg-cyan-500 text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                    title="Google Docs Cloud Viewer"
                  >
                    <Layers size={12} />
                    <span>Cloud</span>
                  </button>
                )}
              </div>
            )}

            {/* Image Viewer Zoom/Rotate Controls */}
            {(isImage || (isPdf && pdfViewMode === "image")) && (
              <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 py-1 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw size={14} />
                </button>
              </div>
            )}

            {/* Open in External / New Tab */}
            {fileData && (
              <button
                type="button"
                onClick={() => openCertificateInNewTab(fileData, blobPdfUrl)}
                className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-cyan-300 transition-colors cursor-pointer"
                title={isCloudinary ? "Open direct asset in Cloudinary" : "Open document in a clean new browser tab"}
              >
                <ExternalLink size={13} />
                <span>{isCloudinary ? "Open in Cloudinary" : "Open in New Tab"}</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-zinc-200 transition-colors cursor-pointer"
              title="Print Certificate"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <XCircle size={18} />
            </button>
          </div>
        </div>

        {/* MAIN DOCUMENT VIEWPORT */}
        <div
          ref={containerRef}
          className="relative flex-1 mt-4 p-2 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-auto flex flex-col items-center justify-center min-h-[440px]"
        >
          {fileData ? (
            <div id="recodex-print-certificate" className="w-full h-full flex flex-col items-center justify-center">
              {/* --- 1. PDF DOCUMENT VIEWER --- */}
              {isPdf && pdfViewMode === "document" && (
                <div className="w-full h-full flex flex-col items-center">
                  <object
                    data={activePdfSource}
                    type="application/pdf"
                    className="w-full h-[580px] sm:h-[620px] rounded-xl border border-zinc-800 bg-white"
                  >
                    <iframe
                      src={activePdfSource}
                      title={`Certificate ${certId}`}
                      className="w-full h-[580px] sm:h-[620px] rounded-xl border border-zinc-800 bg-white"
                    />
                  </object>

                  {/* Fallback help bar if browser struggles with native PDF embed */}
                  <div className="w-full mt-3 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400 print:hidden">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-cyan-400 shrink-0" />
                      <span>Viewing difficulties? Try alternate viewers or open directly:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cloudinaryPngUrl && (
                        <button
                          type="button"
                          onClick={() => setPdfViewMode("image")}
                          className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Switch to Image View
                        </button>
                      )}
                      {googleDocsViewerUrl && (
                        <button
                          type="button"
                          onClick={() => setPdfViewMode("gdocs")}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                        >
                          Google Viewer
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openCertificateInNewTab(fileData, blobPdfUrl)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink size={11} />
                        New Tab
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2. GOOGLE DOCS VIEWER (For remote URLs) --- */}
              {isPdf && pdfViewMode === "gdocs" && googleDocsViewerUrl && (
                <iframe
                  src={googleDocsViewerUrl}
                  title={`Certificate ${certId} Cloud Viewer`}
                  className="w-full h-[580px] sm:h-[620px] rounded-xl border border-zinc-800 bg-white"
                />
              )}

              {/* --- 3. IMAGE VIEWER (For Images OR Cloudinary PDF Image View) --- */}
              {(isImage || (isPdf && pdfViewMode === "image")) && (
                <div
                  className="w-full h-full min-h-[480px] flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing"
                  style={{ touchAction: "none" }}
                >
                  <img
                    src={pdfViewMode === "image" && cloudinaryPngUrl ? cloudinaryPngUrl : fileData}
                    alt={`Certificate for ${studentName}`}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: "transform 0.2s ease-out",
                    }}
                    className="max-h-[620px] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-zinc-800/80 pointer-events-auto"
                    draggable={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <FileText size={40} className="mx-auto text-zinc-600 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Certificate Credential #{certId}</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Official certificate issued for <strong>{projectName}</strong>. The uploaded document is currently being synchronized by the administration.
              </p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER INFO & DIRECT DOWNLOAD */}
        <div className="mt-4 p-3.5 sm:p-4 bg-zinc-900/70 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shrink-0 print:hidden">
          <div className="space-y-0.5 text-left w-full sm:w-auto">
            <p className="text-zinc-300 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>Recipient: <strong className="text-white">{studentName}</strong></span>
              {certificate.userEmail && <span className="text-zinc-500">({certificate.userEmail})</span>}
            </p>
            <p className="text-zinc-500 text-[11px]">
              Project: {projectName} • Issued on: {issueDate} • ID: <span className="text-cyan-400 font-bold">{certId}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => downloadCertificateFile(blobPdfUrl || fileData, safeDownloadFilename)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/20"
            >
              <Download size={14} />
              <span>Download Official {isPdf ? "PDF" : "Certificate"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
