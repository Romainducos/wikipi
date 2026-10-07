import express from "express";
import rateLimit from "express-rate-limit";
import { verifyToken } from "../middleware/auth.js";
import { getHome, login, register } from "../controllers/authController.js";
import { validateRegister } from "../validators/authValidator.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
});

router.post("/register", authLimiter, validateRegister, register);

router.post("/login", authLimiter, login);

router.get("/home", verifyToken, getHome);

export default router;
