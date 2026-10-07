import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { UPLOADS_DIR } from "../lib/uploads.js";

export const AVATARS_DIR = path.join(UPLOADS_DIR, "avatars");
mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: AVATARS_DIR,
    filename: (req, file, cb) => {
      cb(null, `${req.user.id}-${Date.now()}${ALLOWED_TYPES[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
}).single("avatar");

// Enveloppe multer pour renvoyer des erreurs 400 lisibles
export const uploadAvatar = (req, res, next) => {
  upload(req, res, (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image trop lourde (2 Mo maximum)" });
    }
    if (err?.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Format accepté : JPG, PNG ou WebP" });
    }
    if (err) {
      return next(err);
    }
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image envoyée" });
    }
    next();
  });
};
