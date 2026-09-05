import crypto from "crypto";

/**
 * Generates a non-sequential, cryptographically secure Certificate ID.
 * Format: RCX-YYYY-XXXXXXXX (e.g., RCX-2026-N82M4P9X)
 */
export function generateCertificateId(year: number = new Date().getFullYear()): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous 0, O, 1, I
  let randomPart = "";
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    randomPart += chars[randomBytes[i] % chars.length];
  }
  return `RCX-${year}-${randomPart}`;
}

/**
 * Validates whether a given string is a valid RecodeX certificate ID.
 */
export function isValidCertificateId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^RCX-\d{4}-[A-Z0-9]{8}$/.test(id.trim().toUpperCase());
}
