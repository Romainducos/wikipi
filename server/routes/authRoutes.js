import express from "express";
import rateLimit from "express-rate-limit";
import { verifyToken } from "../middleware/auth.js";
import {
  getHome,
  login,
  register,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { validateRegister } from "../validators/authValidator.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Réglable pour les tests automatisés, 10 tentatives par défaut
  limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
});

router.post("/register", authLimiter, validateRegister, register);

router.post("/login", authLimiter, login);

router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password", authLimiter, resetPassword);

router.get("/home", verifyToken, getHome);

export default router;
