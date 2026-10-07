import express from "express";
import {
  getDocumentationsByProject,
  createDocumentation,
  getAllDocumentations,
  getDocumentationById,
} from "../controllers/documentationController.js";
import { verifyToken } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validates.js";
import { validateDocumentation } from "../validators/documentationValidator.js";

const router = express.Router();

router.use(verifyToken);
router.param("id", validateIdParam);
router.param("projectId", validateIdParam);

router.post(
  "/projects/:projectId/documentations",
  validateDocumentation,
  createDocumentation
);

router.get("/projects/:projectId/documentations", getDocumentationsByProject);

router.get("/", getAllDocumentations);

router.get("/:id", getDocumentationById);

export default router;
