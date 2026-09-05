"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificatePdf = generateCertificatePdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrGenerator_1 = require("./qrGenerator");
/**
 * Generates a luxury, high-resolution A4 Landscape Certificate PDF buffer.
 */
async function generateCertificatePdf(data) {
    return new Promise(async (resolve, reject) => {
        try {
            // Create A4 Landscape PDF (841.89 x 595.28 pt)
            const doc = new pdfkit_1.default({
                size: "A4",
                layout: "landscape",
                margins: { top: 36, bottom: 36, left: 40, right: 40 },
                info: {
                    Title: `RecodeX Certificate - ${data.recipientName} - ${data.certificateId}`,
                    Author: "RecodeX Developer Marketplace",
                    Subject: "Certificate of Project Completion",
                    Keywords: "RecodeX, Certificate, Software Engineering, Verification",
                },
            });
            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));
            const width = 841.89;
            const height = 595.28;
            // --- 1. LUXURY BACKGROUND & BORDER ---
            // Outer subtle dark background
            doc.rect(0, 0, width, height).fill("#0a0d14");
            // Inner card container
            doc.roundedRect(24, 24, width - 48, height - 48, 12).fill("#0d111a");
            // Outer Gold / Cyan Gradient Border
            doc.lineWidth(2.5);
            doc.roundedRect(28, 28, width - 56, height - 56, 10).stroke("#00d1ff");
            // Inner Fine Accent Border
            doc.lineWidth(0.8);
            doc.roundedRect(34, 34, width - 68, height - 68, 8).stroke("#1e293b");
            // Corner Decorative Brackets (Top Left, Top Right, Bottom Left, Bottom Right)
            const cornerSize = 24;
            doc.lineWidth(3).strokeColor("#00d1ff");
            // Top-Left
            doc.moveTo(28, 28 + cornerSize).lineTo(28, 28).lineTo(28 + cornerSize, 28).stroke();
            // Top-Right
            doc.moveTo(width - 28 - cornerSize, 28).lineTo(width - 28, 28).lineTo(width - 28, 28 + cornerSize).stroke();
            // Bottom-Left
            doc.moveTo(28, height - 28 - cornerSize).lineTo(28, height - 28).lineTo(28 + cornerSize, height - 28).stroke();
            // Bottom-Right
            doc.moveTo(width - 28 - cornerSize, height - 28).lineTo(width - 28, height - 28).lineTo(width - 28, height - 28 - cornerSize).stroke();
            // --- 2. HEADER: LOGO & BADGE ---
            doc.fillColor("#00d1ff")
                .fontSize(22)
                .font("Helvetica-Bold")
                .text("RECODEX", 0, 54, { align: "center", characterSpacing: 4 });
            doc.fillColor("#94a3b8")
                .fontSize(8.5)
                .font("Helvetica")
                .text("OFFICIAL VERIFIED CREDENTIAL • DEVELOPER MARKETPLACE", 0, 80, { align: "center", characterSpacing: 2 });
            // Title
            doc.fillColor("#ffffff")
                .fontSize(28)
                .font("Helvetica-Bold")
                .text("CERTIFICATE OF PROJECT COMPLETION", 0, 106, { align: "center", characterSpacing: 1.5 });
            doc.fillColor("#64748b")
                .fontSize(10)
                .font("Helvetica-Oblique")
                .text("This official credential certifies that", 0, 148, { align: "center" });
            // --- 3. RECIPIENT NAME ---
            doc.fillColor("#38bdf8")
                .fontSize(32)
                .font("Helvetica-Bold")
                .text(data.recipientName || "Distinguished Developer", 0, 172, { align: "center" });
            // Fine Underline
            const nameWidth = doc.widthOfString(data.recipientName || "Distinguished Developer");
            const nameX = (width - nameWidth) / 2;
            doc.moveTo(nameX - 20, 214).lineTo(nameX + nameWidth + 20, 214).lineWidth(1).strokeColor("#00d1ff").stroke();
            // --- 4. BODY & PROJECT DESCRIPTION ---
            doc.fillColor("#94a3b8")
                .fontSize(10.5)
                .font("Helvetica")
                .text("has successfully built, verified, and officially completed the real-world project", 0, 228, { align: "center" });
            // Project Title Highlight Box
            doc.fillColor("#ffffff")
                .fontSize(20)
                .font("Helvetica-Bold")
                .text(`"${data.projectTitle || "Software Solution"}"`, 0, 248, { align: "center" });
            if (data.category) {
                doc.fillColor("#00d1ff")
                    .fontSize(9.5)
                    .font("Helvetica-Bold")
                    .text(`Domain: ${data.category.toUpperCase()}`, 0, 276, { align: "center", characterSpacing: 1 });
            }
            // --- 5. METADATA CARDS (Completion Date, Issue Date, Final Evaluation) ---
            const cardY = 308;
            const cardHeight = 62;
            const cardWidth = 140;
            const gap = 16;
            const totalCardsWidth = cardWidth * 3 + gap * 2;
            const startCardX = (width - totalCardsWidth) / 2;
            const completionStr = new Date(data.completionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const issueStr = new Date(data.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const gradeStr = data.grade || "A+ (Verified)";
            // Card 1: Completion Date
            doc.roundedRect(startCardX, cardY, cardWidth, cardHeight, 6).fillAndStroke("#111827", "#1f2937");
            doc.fillColor("#64748b").fontSize(7.5).font("Helvetica-Bold").text("COMPLETION DATE", startCardX, cardY + 12, { width: cardWidth, align: "center", characterSpacing: 1 });
            doc.fillColor("#e2e8f0").fontSize(10.5).font("Helvetica-Bold").text(completionStr, startCardX, cardY + 28, { width: cardWidth, align: "center" });
            // Card 2: Issue Date
            const card2X = startCardX + cardWidth + gap;
            doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 6).fillAndStroke("#111827", "#1f2937");
            doc.fillColor("#64748b").fontSize(7.5).font("Helvetica-Bold").text("OFFICIAL ISSUE DATE", card2X, cardY + 12, { width: cardWidth, align: "center", characterSpacing: 1 });
            doc.fillColor("#38bdf8").fontSize(10.5).font("Helvetica-Bold").text(issueStr, card2X, cardY + 28, { width: cardWidth, align: "center" });
            // Card 3: Evaluation & Grade
            const card3X = card2X + cardWidth + gap;
            doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 6).fillAndStroke("#111827", "#1f2937");
            doc.fillColor("#64748b").fontSize(7.5).font("Helvetica-Bold").text("EVALUATION RATING", card3X, cardY + 12, { width: cardWidth, align: "center", characterSpacing: 1 });
            doc.fillColor("#10b981").fontSize(10.5).font("Helvetica-Bold").text(gradeStr, card3X, cardY + 28, { width: cardWidth, align: "center" });
            // --- 6. EMBEDDED QR CODE & VERIFICATION URL ---
            const qrBuffer = await (0, qrGenerator_1.generateCertificateQrCodeBuffer)(data.certificateId);
            const qrSize = 88;
            const qrX = 64;
            const qrY = height - qrSize - 62;
            // QR white backing plate with cyan border
            doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4).fillAndStroke("#ffffff", "#00d1ff");
            doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
            // Verification label next to QR code
            const verifyX = qrX + qrSize + 16;
            doc.fillColor("#94a3b8")
                .fontSize(8)
                .font("Helvetica-Bold")
                .text("PUBLIC VERIFICATION ID", verifyX, qrY + 8);
            doc.fillColor("#00d1ff")
                .fontSize(11)
                .font("Helvetica-Bold")
                .text(data.certificateId, verifyX, qrY + 22, { characterSpacing: 1 });
            doc.fillColor("#64748b")
                .fontSize(7.5)
                .font("Helvetica")
                .text(`Scan QR code or visit:\n${data.verificationUrl || `https://recodex.in/verify/${data.certificateId}`}`, verifyX, qrY + 40, { width: 190 });
            // --- 7. SIGNATURES & OFFICIAL SEAL ---
            const sigY = height - 120;
            const sigWidth = 180;
            const sigX = width - sigWidth - 64;
            // Official Seal Graphic
            const sealX = sigX - 90;
            const sealY = sigY + 14;
            doc.circle(sealX, sealY, 26).lineWidth(1.5).strokeColor("#00d1ff").stroke();
            doc.circle(sealX, sealY, 22).lineWidth(0.8).strokeColor("#38bdf8").stroke();
            doc.fillColor("#00d1ff").fontSize(6.5).font("Helvetica-Bold").text("RECODEX", sealX - 22, sealY - 10, { width: 44, align: "center" });
            doc.fillColor("#ffffff").fontSize(6).font("Helvetica").text("VERIFIED", sealX - 22, sealY - 1, { width: 44, align: "center" });
            doc.fillColor("#10b981").fontSize(5.5).font("Helvetica-Bold").text("GENUINE", sealX - 22, sealY + 8, { width: 44, align: "center" });
            // Signature line
            doc.moveTo(sigX, sigY + 36).lineTo(sigX + sigWidth, sigY + 36).lineWidth(1).strokeColor("#475569").stroke();
            doc.fillColor("#38bdf8")
                .fontSize(13)
                .font("Helvetica-BoldOblique")
                .text("RecodeX Review Board", sigX, sigY + 16, { width: sigWidth, align: "center" });
            doc.fillColor("#94a3b8")
                .fontSize(8)
                .font("Helvetica-Bold")
                .text("AUTHORIZED SIGNATURE", sigX, sigY + 42, { width: sigWidth, align: "center", characterSpacing: 1 });
            doc.fillColor("#64748b")
                .fontSize(7)
                .font("Helvetica")
                .text("Academic & Technical Certification Committee", sigX, sigY + 54, { width: sigWidth, align: "center" });
            // --- 8. FOOTER METADATA ---
            doc.fillColor("#475569")
                .fontSize(7)
                .font("Helvetica")
                .text(`Tamper-evident cryptographic record • SHA-256 Verified • Generated on RecodeX Cloud Infrastructure`, 0, height - 38, { align: "center" });
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
