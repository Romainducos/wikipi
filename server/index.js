import express from "express";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import documentationRoutes from "./routes/documentationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import moderatorRequestRoutes from "./routes/moderatorRequestRoutes.js";
import { UPLOADS_DIR } from "./lib/uploads.js";
import { frontendUrls } from "./lib/frontendUrls.js";

const requiredEnv = [
  "PORT",
  "JWT_KEY",
  "JWT_EXPIRES_IN",
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error("Variables d'environnement manquantes:", missingEnv.join(", "));
  process.exit(1);
}

const app = express();
app.use(cors({ origin: frontendUrls }));
app.use(express.json());
// Express 5 laisse req.body undefined sans corps de requête : on garantit un objet
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/documentations", documentationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/moderator-requests", moderatorRequestRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
