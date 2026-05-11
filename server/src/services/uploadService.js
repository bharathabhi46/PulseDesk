import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import { env } from "../config/env.js";

const uploadBuffer = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "pulsedesk",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });

export const uploadFiles = async (files = []) => {
  if (!files.length) return [];

  const cloudinaryReady = env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret;

  if (!cloudinaryReady) {
    return files.map((file) => ({
      url: `local-placeholder://${file.originalname}`,
      publicId: null,
      resourceType: file.mimetype,
      originalName: file.originalname,
      size: file.size
    }));
  }

  const results = await Promise.all(files.map(uploadBuffer));
  return results.map((result, index) => ({
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    originalName: files[index].originalname,
    size: files[index].size
  }));
};
