import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validates.js";
import { isAdmin, isModeratorOrAdmin } from "../middleware/authorize.js";
import {
  getAllUsers,
  updateUserRole,
  getAdminStats,
  getMe,
  updateMe,
  updatePassword,
  updateAvatar,
  deleteAvatar,
} from "../controllers/userController.js";
import {
  validateProfileUpdate,
  validatePasswordChange,
} from "../validators/userValidators.js";
import { uploadAvatar } from "../middleware/uploadAvatar.js";

const router = express.Router();

router.use(verifyToken);
router.param("id", validateIdParam);

// Compte de l'utilisateur connecté
router.get("/me", getMe);
router.put("/me", validateProfileUpdate, updateMe);
router.put("/me/password", validatePasswordChange, updatePassword);
router.post("/me/avatar", uploadAvatar, updateAvatar);
router.delete("/me/avatar", deleteAvatar);

// Administration
router.get("/", isAdmin, getAllUsers);

router.get("/admin/stats", isAdmin, getAdminStats);

router.put("/:id/role", isAdmin, updateUserRole);

export default router;
