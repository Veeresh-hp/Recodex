"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificateId = generateCertificateId;
exports.isValidCertificateId = isValidCertificateId;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a non-sequential, cryptographically secure Certificate ID.
 * Format: RCX-YYYY-XXXXXXXX (e.g., RCX-2026-N82M4P9X)
 */
function generateCertificateId(year = new Date().getFullYear()) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous 0, O, 1, I
    let randomPart = "";
    const randomBytes = crypto_1.default.randomBytes(8);
    for (let i = 0; i < 8; i++) {
        randomPart += chars[randomBytes[i] % chars.length];
    }
    return `RCX-${year}-${randomPart}`;
}
/**
 * Validates whether a given string is a valid RecodeX certificate ID.
 */
function isValidCertificateId(id) {
    if (!id || typeof id !== "string")
        return false;
    return /^RCX-\d{4}-[A-Z0-9]{8}$/.test(id.trim().toUpperCase());
}
