import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validates.js";
import { validateGroup } from "../validators/groupValidators.js";
import {
  getMyGroup,
  countMyInvitations,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  inviteMember,
  cancelInvitation,
  acceptInvitation,
  declineInvitation,
  removeMember,
  updateMemberRole,
} from "../controllers/groupController.js";

const router = express.Router();

router.use(verifyToken);
router.param("id", validateIdParam);
router.param("userId", validateIdParam);
router.param("invitationId", validateIdParam);

// Mon groupe et mes invitations
router.get("/me", getMyGroup);
router.get("/me/invitations/count", countMyInvitations);
router.post("/invitations/:invitationId/accept", acceptInvitation);
router.post("/invitations/:invitationId/decline", declineInvitation);

// Gestion d'un groupe
router.post("/", validateGroup, createGroup);
router.get("/:id", getGroup);
router.put("/:id", validateGroup, updateGroup);
router.delete("/:id", deleteGroup);
router.post("/:id/invitations", inviteMember);
router.delete("/:id/invitations/:invitationId", cancelInvitation);
router.put("/:id/members/:userId", updateMemberRole);
router.delete("/:id/members/:userId", removeMember);

export default router;
