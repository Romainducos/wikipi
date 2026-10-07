import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validates.js";
import { isAdmin, isModeratorOrAdmin } from "../middleware/authorize.js";
import {
  getAllUsers,
  updateUserRole,
  getAdminStats,
} from "../controllers/userController.js";

const router = express.Router();

router.use(verifyToken);
router.param("id", validateIdParam);

router.get("/", isAdmin, getAllUsers);

router.get("/admin/stats", isAdmin, getAdminStats);

router.put("/:id/role", isAdmin, updateUserRole);

export default router;
