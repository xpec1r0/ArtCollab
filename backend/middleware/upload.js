// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter,
});

const uploadSingleMedia = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message || "File upload error",
      });
    }
    next();
  });
};

module.exports = {
  uploadSingleMedia,
};
