import express from "express";

import { verifyToken } from "../middleware/auth.js";
import { validateIdParam } from "../middleware/validates.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { validateProject } from "../validators/projectValidators.js";

const router = express.Router();

router.use(verifyToken);
router.param("id", validateIdParam);

router.post("/", validateProject, createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", validateProject, updateProject);
router.delete("/:id", deleteProject);

export default router;
