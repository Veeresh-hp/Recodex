import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Award, Download, ExternalLink, Printer, XCircle, ZoomIn, ZoomOut,
  RotateCw, Maximize2, Minimize2, ShieldCheck, ShieldAlert, CheckCircle2, FileText, Loader2
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
 * Generates a valid standard PDF document (PDF 1.4) containing the certificate image.
 * Runs 100% in browser so it bypasses Cloudinary's default raw PDF delivery block.
 */
export async function generatePdfBlobFromImageUrl(imageUrl: string): Promise<Blob> {
  // Fetch as blob first if possible to prevent cross-origin canvas security errors
  let localUrl = imageUrl;
  let shouldRevoke = false;
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (res.ok) {
      const b = await res.blob();
      localUrl = URL.createObjectURL(b);
      shouldRevoke = true;
    }
  } catch (e) {
    // If fetch failed, fallback to direct URL
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1600;
        canvas.height = img.naturalHeight || 1130;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context failed");

        // Clean white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((jpegBlob) => {
          if (shouldRevoke) URL.revokeObjectURL(localUrl);

          if (!jpegBlob) {
            reject(new Error("Failed to export canvas to JPEG"));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            try {
              const buffer = reader.result as ArrayBuffer;
              const bytes = new Uint8Array(buffer);

              const w = canvas.width;
              const h = canvas.height;

              // Scale pixels to standard 72 DPI PDF points
              const pdfWidth = Math.round(w * 0.75);
              const pdfHeight = Math.round(h * 0.75);

              const header = `%PDF-1.4\n`;
              const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
              const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
              const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /Im 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
              const obj4Header = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`;
              const obj4Footer = `\nendstream\nendobj\n`;
              const streamContent = `q\n${pdfWidth} 0 0 ${pdfHeight} 0 0 cm\n/Im Do\nQ\n`;
              const obj5 = `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

              const enc = new TextEncoder();
              const hBytes = enc.encode(header);
              const o1Bytes = enc.encode(obj1);
              const o2Bytes = enc.encode(obj2);
              const o3Bytes = enc.encode(obj3);
              const o4HBytes = enc.encode(obj4Header);
              const o4FBytes = enc.encode(obj4Footer);
              const o5Bytes = enc.encode(obj5);

              const offset1 = hBytes.length;
              const offset2 = offset1 + o1Bytes.length;
              const offset3 = offset2 + o2Bytes.length;
              const offset4 = offset3 + o3Bytes.length;
              const offset5 = offset4 + o4HBytes.length + bytes.length + o4FBytes.length;
              const xrefOffset = offset5 + o5Bytes.length;

              const pad = (n: number) => n.toString().padStart(10, "0");
              const xref = `xref\n0 6\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n`;
              const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
              const trailerBytes = enc.encode(xref + trailer);

              const totalSize =
                hBytes.length +
                o1Bytes.length +
                o2Bytes.length +
                o3Bytes.length +
                o4HBytes.length +
                bytes.length +
                o4FBytes.length +
                o5Bytes.length +
                trailerBytes.length;

              const pdfBytes = new Uint8Array(totalSize);

              let cursor = 0;
              pdfBytes.set(hBytes, cursor); cursor += hBytes.length;
              pdfBytes.set(o1Bytes, cursor); cursor += o1Bytes.length;
              pdfBytes.set(o2Bytes, cursor); cursor += o2Bytes.length;
              pdfBytes.set(o3Bytes, cursor); cursor += o3Bytes.length;
              pdfBytes.set(o4HBytes, cursor); cursor += o4HBytes.length;
              pdfBytes.set(bytes, cursor); cursor += bytes.length;
              pdfBytes.set(o4FBytes, cursor); cursor += o4FBytes.length;
              pdfBytes.set(o5Bytes, cursor); cursor += o5Bytes.length;
              pdfBytes.set(trailerBytes, cursor); cursor += trailerBytes.length;

              const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
              resolve(pdfBlob);
            } catch (err) {
              reject(err);
            }
          };
          reader.readAsArrayBuffer(jpegBlob);
        }, "image/jpeg", 0.98);
      } catch (err) {
        if (shouldRevoke) URL.revokeObjectURL(localUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      if (shouldRevoke) URL.revokeObjectURL(localUrl);
      reject(new Error("Image failed to load for PDF generation"));
    };
    img.src = localUrl;
  });
}

/**
 * Downloads the certificate document either as a real vector PDF or as a high-res image.
 */
export async function downloadCertificateFile(
  imageUrl: string,
  filename: string,
  asPdf: boolean = true
) {
  if (asPdf) {
    try {
      const pdfBlob = await generatePdfBlobFromImageUrl(imageUrl);
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const pdfName = filename.toLowerCase().endsWith(".pdf")
        ? filename
        : `${filename.replace(/\.[^/.]+$/, "")}.pdf`;
      a.download = pdfName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    } catch (e) {
      console.warn("Client PDF generation fallback to image download:", e);
    }
  }

  // Fallback: direct image download
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    }
  } catch (e) {}

  const a = document.createElement("a");
  a.href = imageUrl;
  a.target = "_blank";
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Opens image document in a new browser tab.
 */
export function openCertificateInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function CertificateViewerModal({ certificate, onClose }: Props) {
  const isRevoked = certificate.status === "Revoked" || certificate.status === "REVOKED";

  if (isRevoked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
        <div className="w-full max-w-md bg-white dark:bg-[#07090e] border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/25 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.15)]">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-lg font-bold text-foreground dark:text-white">Certificate Access Revoked</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            This certificate document has been revoked by administration. The file cannot be opened. Please contact administration for any enquiry.
          </p>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fileData = certificate.fileData || "";
  const fileName = certificate.fileName || "";
  const fileType = certificate.fileType || "";
  const studentName = certificate.studentName || certificate.recipientName || "Student Developer";
  const projectName = certificate.projectName || certificate.projectTitle || "Software Engineering Project";
  const issueDate = certificate.issueDate || "Verified";
  const certId = certificate.credentialId || certificate.id;

  const [downloading, setDownloading] = useState(false);

  // Detect whether this was originally uploaded as a PDF
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

  // Cloudinary image transformation URL: renders the PDF directly as a crystal-clear PNG image
  const cloudinaryPngUrl = useMemo(() => {
    if (!isCloudinary || !fileData) return "";
    let clean = fileData.replace(/\.pdf(\?.*)?$/i, ".png$1");
    if (clean.includes("/upload/")) {
      clean = clean.replace(/\/upload\/(v\d+\/)?/, "/upload/f_png,q_auto:best,w_1800/$1");
    }
    return clean;
  }, [fileData, isCloudinary]);

  // Local rendered image if base64 PDF is passed
  const [base64PdfImage, setBase64PdfImage] = useState<string>("");

  useEffect(() => {
    if (fileData && fileData.startsWith("data:application/pdf")) {
      try {
        const base64Data = fileData.split(",")[1] || fileData;
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
            console.warn("Local PDF render note:", e);
          }
        };
        renderLocalPdf();
      } catch (err) {
        console.error("PDF data processing note:", err);
      }
    }
  }, [fileData]);

  // The primary image source to display in the viewer
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

  const safeDownloadFilename = fileName
    ? (isPdf && !fileName.toLowerCase().endsWith(".pdf") ? `${fileName.replace(/\.[^/.]+$/, "")}.pdf` : fileName)
    : `Certificate_${certId}_${studentName.replace(/\s+/g, "_")}.${isPdf ? "pdf" : "png"}`;

  const handleDownload = async () => {
    if (!displayImageSrc || downloading) return;
    setDownloading(true);
    try {
      await downloadCertificateFile(displayImageSrc, safeDownloadFilename, isPdf);
    } finally {
      setDownloading(false);
    }
  };

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

          {/* Action Toolbar */}
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

            {/* Open in Cloudinary / New Tab */}
            {displayImageSrc && (
              <button
                type="button"
                onClick={() => openCertificateInNewTab(displayImageSrc)}
                className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-cyan-300 transition-colors cursor-pointer"
                title={isCloudinary ? "Open direct asset in Cloudinary" : "Open certificate in a clean new tab"}
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

        {/* MAIN DOCUMENT VIEWPORT (PURE HIGH-RES IMAGE) */}
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
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download Official {isPdf ? "PDF" : "Certificate"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
