import { Readable } from "stream";
import fs from "fs/promises";
import path from "path";
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
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedList = [];
    for (const file of files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);

      const cleanBaseUrl = env.backendUrl.endsWith("/") ? env.backendUrl.slice(0, -1) : env.backendUrl;
      uploadedList.push({
        url: `${cleanBaseUrl}/uploads/${filename}`,
        publicId: filename,
        resourceType: file.mimetype,
        originalName: file.originalname,
        size: file.size
      });
    }
    return uploadedList;
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
