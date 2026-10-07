import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin } from "../middleware/authorize.js";
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

router.get("/", isAdmin, getPendingRequests);
router.put("/:id/accept", isAdmin, acceptRequest);
router.put("/:id/reject", isAdmin, rejectRequest);

export default router;
