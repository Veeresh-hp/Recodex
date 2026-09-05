import QRCode from "qrcode";

const BASE_VERIFY_URL = process.env.PUBLIC_VERIFY_URL || "https://recodex.in/verify";

/**
 * Generates a base64 Data URL for a certificate verification QR code.
 */
export async function generateCertificateQrCodeDataUrl(certificateId: string): Promise<string> {
  const url = `${BASE_VERIFY_URL}/${encodeURIComponent(certificateId)}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 300,
    color: {
      dark: "#0a0d14",
      light: "#ffffff",
    },
  });
}

/**
 * Generates a Buffer for a certificate verification QR code (for embedding in PDFKit).
 */
export async function generateCertificateQrCodeBuffer(certificateId: string): Promise<Buffer> {
  const url = `${BASE_VERIFY_URL}/${encodeURIComponent(certificateId)}`;
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 300,
    color: {
      dark: "#0a0d14",
      light: "#ffffff",
    },
  });
}
