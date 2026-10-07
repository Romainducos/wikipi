import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin, isModeratorOrAdmin } from "../middleware/authorize.js";
import { validateIdParam } from "../middleware/validates.js";
import {
  createRequest,
  getMyRequest,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
} from "../controllers/moderatorRequestController.js";

const router = express.Router();

router.use(verifyToken);
router.param("id", validateIdParam);

router.post("/", createRequest);
router.get("/mine", getMyRequest);

// Les modos voient les demandes, seuls les admins les traitent
router.get("/", isModeratorOrAdmin, getPendingRequests);
router.put("/:id/accept", isAdmin, acceptRequest);
router.put("/:id/reject", isAdmin, rejectRequest);

export default router;
