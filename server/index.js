import express from "express";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import documentationRoutes from "./routes/documentationRoutes.js";

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
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/documentations", documentationRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
