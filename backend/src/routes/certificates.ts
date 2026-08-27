import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const DB_FILE = path.join(__dirname, "../../certificates_db.json");

// Helper to read local json DB
const readCertificatesFile = (): any[] => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to read certificates file:", e);
  }
  return [];
};

// Helper to write local json DB
const writeCertificatesFile = (certs: any[]) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(certs, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write certificates file:", e);
  }
};

// GET /api/certificates
router.get("/", (_req: Request, res: Response) => {
  try {
    const certs = readCertificatesFile();
    res.json(certs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch certificates" });
  }
});

// POST /api/certificates
router.post("/", (req: Request, res: Response) => {
  try {
    const cert = req.body;
    if (!cert.id || !cert.studentName) {
      res.status(400).json({ error: "Certificate id and studentName are required" });
      return;
    }

    let certs = readCertificatesFile();
    const existingIndex = certs.findIndex((c: any) => c.id === cert.id || (cert.userEmail && c.userEmail === cert.userEmail));

    if (existingIndex >= 0) {
      certs[existingIndex] = { ...certs[existingIndex], ...cert, updatedAt: new Date().toISOString() };
    } else {
      certs.unshift({ ...cert, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    writeCertificatesFile(certs);
    res.json({ message: "Certificate saved successfully", certificate: cert });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save certificate" });
  }
});

// DELETE /api/certificates/:id
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let certs = readCertificatesFile();
    certs = certs.filter((c: any) => c.id !== id);
    writeCertificatesFile(certs);
    res.json({ message: "Certificate deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete certificate" });
  }
});

export default router;
