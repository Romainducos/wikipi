import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validates.js";
import {
  getProposalsToReview,
  countProposalsToReview,
  getMyProposals,
  acceptProposal,
  rejectProposal,
} from "../controllers/proposalController.js";

const router = express.Router();

router.use(verifyToken);
router.param("id", validateIdParam);

router.get("/to-review", getProposalsToReview);
router.get("/to-review/count", countProposalsToReview);
router.get("/mine", getMyProposals);
router.put("/:id/accept", acceptProposal);
router.put("/:id/reject", rejectProposal);

export default router;
