import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { isModeratorOrAdmin } from "../middleware/authorize.js";
import { getActivity } from "../controllers/moderationController.js";

const router = express.Router();

router.use(verifyToken, isModeratorOrAdmin);

router.get("/activity", getActivity);

export default router;
