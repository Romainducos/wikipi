import path from "node:path";
import { fileURLToPath } from "node:url";
import { unlink } from "node:fs/promises";

// Dossier des fichiers envoyés par les utilisateurs, servi sur /uploads
export const UPLOADS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "uploads"
);

// Supprime un fichier à partir de son URL publique (/uploads/...), sans
// jamais sortir du dossier uploads
export const removeUpload = async (publicUrl) => {
  if (!publicUrl?.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOADS_DIR, publicUrl.slice("/uploads/".length));
  if (!filePath.startsWith(UPLOADS_DIR + path.sep)) return;
  await unlink(filePath).catch(() => {});
};
