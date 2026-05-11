import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/", "application/pdf", "text/plain"];
    if (allowed.some((type) => file.mimetype.startsWith(type) || file.mimetype === type)) {
      cb(null, true);
      return;
    }
    cb(new ApiError(400, "Unsupported file type"));
  }
});
