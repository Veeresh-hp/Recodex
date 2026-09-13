import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Award, Download, ExternalLink, Printer, XCircle, ZoomIn, ZoomOut,
  RotateCw, Maximize2, Minimize2, ShieldCheck, CheckCircle2, FileText
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
 * Robust file downloader that enforces true file downloads across origins
 * and Cloudinary CDN assets.
 */
export async function downloadCertificateFile(url: string, filename: string, forcePdf: boolean = false) {
  try {
    let targetUrl = url;

    // If Cloudinary URL, format for direct attachment download
    if (targetUrl.includes("res.cloudinary.com")) {
      if (forcePdf && !targetUrl.toLowerCase().includes(".pdf")) {
        targetUrl = targetUrl.replace(/\.(png|jpe?g|webp)(\?.*)?$/i, ".pdf$1");
      }
      if (targetUrl.includes("/upload/")) {
        targetUrl = targetUrl.replace(/\/upload\/(fl_attachment\/)?/, "/upload/fl_attachment/");
      }
      const a = document.createElement("a");
      a.href = targetUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // Base64 or Blob URL direct download
    if (targetUrl.startsWith("data:") || targetUrl.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = targetUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // Fetch binary blob to enforce download across other origins
    const res = await fetch(targetUrl, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  } catch (err) {
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
 * Opens document in a clean new browser tab.
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
      console.warn("Blob conversion failed, opening direct:", e);
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
  const issueDate = certificate.issueDate || "Verified";
  const certId = certificate.credentialId || certificate.id;

  // Detect whether this was uploaded as a PDF
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

  const isCloudinary = Boolean(fileData && fileData.includes("res.cloudinary.com"));

  // Cloudinary image transformation URL: renders the PDF page directly as a crisp PNG image
  const cloudinaryPngUrl = useMemo(() => {
    if (!isCloudinary || !fileData) return "";
    let clean = fileData.replace(/\.pdf(\?.*)?$/i, ".png$1");
    if (clean.includes("/upload/")) {
      clean = clean.replace(/\/upload\/(v\d+\/)?/, "/upload/f_png,q_auto:best,w_1800/$1");
    }
    return clean;
  }, [fileData, isCloudinary]);

  // Convert base64 PDF data to Blob URL for direct PDF downloads
  const [blobPdfUrl, setBlobPdfUrl] = useState<string>("");
  // In-browser rendered image if base64 PDF is provided locally
  const [base64PdfImage, setBase64PdfImage] = useState<string>("");

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

        // Dynamically load PDF.js from CDN to render local base64 PDF directly to image canvas
        const renderLocalPdf = async () => {
          try {
            const pdfjsLib = (window as any).pdfjsLib;
            if (pdfjsLib) {
              const loadingTask = pdfjsLib.getDocument({ data: atob(base64Data) });
              const pdf = await loadingTask.promise;
              const page = await pdf.getPage(1);
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                setBase64PdfImage(canvas.toDataURL("image/png"));
              }
            } else {
              const script = document.createElement("script");
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
              script.onload = async () => {
                const lib = (window as any).pdfjsLib;
                if (!lib) return;
                lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                const loadingTask = lib.getDocument({ data: atob(base64Data) });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                if (context) {
                  await page.render({ canvasContext: context, viewport }).promise;
                  setBase64PdfImage(canvas.toDataURL("image/png"));
                }
              };
              document.head.appendChild(script);
            }
          } catch (e) {
            console.warn("Local PDF to image render note:", e);
          }
        };
        renderLocalPdf();
      } catch (err) {
        console.error("Failed to process PDF data:", err);
      }
    } else {
      setBlobPdfUrl("");
      setBase64PdfImage("");
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileData]);

  // Primary image source to display in the viewer:
  // 1) Cloudinary converted PNG image (super high resolution vector render)
  // 2) Locally rendered base64 PDF image
  // 3) fileData directly (for regular PNG/JPG/WEBP images)
  const displayImageSrc = useMemo(() => {
    if (isCloudinary && isPdf && cloudinaryPngUrl) {
      return cloudinaryPngUrl;
    }
    if (base64PdfImage) {
      return base64PdfImage;
    }
    if (cloudinaryPngUrl) {
      return cloudinaryPngUrl;
    }
    return fileData;
  }, [isCloudinary, isPdf, cloudinaryPngUrl, base64PdfImage, fileData]);

  // Image zoom and rotate controls
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

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  const handlePrint = () => window.print();

  // The actual PDF download target (preserves .pdf extension and downloads the real PDF document)
  const downloadPdfTarget = useMemo(() => {
    if (isCloudinary && isPdf) {
      // Ensure it points to the original .pdf asset, not .png
      let pdfUrl = fileData;
      if (!pdfUrl.toLowerCase().includes(".pdf")) {
        pdfUrl = pdfUrl.replace(/\.(png|jpe?g|webp)(\?.*)?$/i, ".pdf$1");
      }
      return pdfUrl;
    }
    return blobPdfUrl || fileData;
  }, [isCloudinary, isPdf, fileData, blobPdfUrl]);

  const safeDownloadFilename = fileName
    ? (isPdf && !fileName.toLowerCase().endsWith(".pdf") ? `${fileName.replace(/\.[^/.]+$/, "")}.pdf` : fileName)
    : `Certificate_${certId}_${studentName.replace(/\s+/g, "_")}.${isPdf ? "pdf" : "png"}`;

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
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Verified Credential
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 truncate max-w-sm mt-0.5">
                {studentName} • {certId}
              </p>
            </div>
          </div>

          {/* Action Toolbar (Only Image Controls: Zoom, Rotate, External Link, Print, Fullscreen, Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {/* Zoom and Rotate Controls */}
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
                className="px-2 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer font-bold"
                title="Reset Zoom to 100%"
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

            {/* Open in External Asset Link / Cloudinary */}
            {fileData && (
              <button
                type="button"
                onClick={() => openCertificateInNewTab(displayImageSrc || fileData, blobPdfUrl)}
                className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-cyan-300 transition-colors cursor-pointer"
                title={isCloudinary ? "Open asset in Cloudinary" : "Open document in new browser tab"}
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
              title="Print Certificate Document"
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

        {/* MAIN DOCUMENT VIEWPORT (ALWAYS PURE HIGH-RES IMAGE) */}
        <div
          ref={containerRef}
          className="relative flex-1 mt-4 p-2 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-auto flex flex-col items-center justify-center min-h-[440px]"
        >
          {displayImageSrc ? (
            <div id="recodex-print-certificate" className="w-full h-full flex items-center justify-center overflow-auto p-2 sm:p-4">
              <img
                src={displayImageSrc}
                alt={`Certificate for ${studentName}`}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease-out",
                }}
                className="max-h-[620px] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-zinc-800/80 pointer-events-auto select-none"
                draggable={false}
              />
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
              onClick={() => downloadCertificateFile(downloadPdfTarget, safeDownloadFilename, isPdf)}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/20"
            >
              <Download size={15} />
              <span>Download Official {isPdf ? "PDF" : "Certificate"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
