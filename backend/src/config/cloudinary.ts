import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables with fallback credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "kt6airvk",
  api_key: process.env.CLOUDINARY_API_KEY || "317654865152487",
  api_secret: process.env.CLOUDINARY_API_SECRET || "ls9_Y3JYVoV8DeTSY8jhsUkek-c",
});

/**
 * Uploads a file buffer directly to Cloudinary using secure stream uploads.
 * Bypasses writing to the local server file system.
 * 
 * @param fileBuffer - Buffer of the uploaded file from multer memory storage
 * @param folder - Folder path within Cloudinary
 * @returns Promise resolving to the Cloudinary API response
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "recodex"
): Promise<{ secure_url: string; public_id: string; [key: string]: any }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload returned undefined result."));
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Uploads a user's certificate document (PDF or Image) into a dedicated user folder in Cloudinary.
 * Accepts base64 data URI string or Buffer.
 * 
 * @param fileData - Base64 Data URL or Buffer
 * @param userIdentifier - User email or name for folder routing
 * @param certId - Certificate unique identifier
 * @returns Promise resolving to secure Cloudinary URL and public_id
 */
export const uploadCertificateToCloudinary = async (
  fileData: string | Buffer,
  userIdentifier: string,
  certId: string
): Promise<{ secure_url: string; public_id: string }> => {
  const safeUserFolder = (userIdentifier || "general_user")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.-]/g, "_");
  const folder = `recodex/certificates/${safeUserFolder}`;
  const safeCertId = (certId || `CERT-${Date.now()}`).replace(/[^a-zA-Z0-9_.-]/g, "_");

  if (typeof fileData === "string" && fileData.startsWith("data:")) {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      public_id: safeCertId,
      resource_type: "auto",
      overwrite: true,
    });
    return { secure_url: result.secure_url, public_id: result.public_id };
  } else if (Buffer.isBuffer(fileData)) {
    const result = await uploadToCloudinary(fileData, folder);
    return { secure_url: result.secure_url, public_id: result.public_id };
  } else if (typeof fileData === "string" && (fileData.startsWith("http://") || fileData.startsWith("https://"))) {
    // Already a remote URL (e.g. existing Cloudinary URL)
    return { secure_url: fileData, public_id: safeCertId };
  } else if (typeof fileData === "string") {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      public_id: safeCertId,
      resource_type: "auto",
      overwrite: true,
    });
    return { secure_url: result.secure_url, public_id: result.public_id };
  }

  throw new Error("Invalid file data format for certificate upload.");
};

export default cloudinary;
