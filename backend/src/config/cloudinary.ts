import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

export default cloudinary;
