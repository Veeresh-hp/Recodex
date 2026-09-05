"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificateQrCodeDataUrl = generateCertificateQrCodeDataUrl;
exports.generateCertificateQrCodeBuffer = generateCertificateQrCodeBuffer;
const qrcode_1 = __importDefault(require("qrcode"));
const BASE_VERIFY_URL = process.env.PUBLIC_VERIFY_URL || "https://recodex.in/verify";
/**
 * Generates a base64 Data URL for a certificate verification QR code.
 */
async function generateCertificateQrCodeDataUrl(certificateId) {
    const url = `${BASE_VERIFY_URL}/${encodeURIComponent(certificateId)}`;
    return qrcode_1.default.toDataURL(url, {
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
async function generateCertificateQrCodeBuffer(certificateId) {
    const url = `${BASE_VERIFY_URL}/${encodeURIComponent(certificateId)}`;
    return qrcode_1.default.toBuffer(url, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        color: {
            dark: "#0a0d14",
            light: "#ffffff",
        },
    });
}
