// routes/project.routes.js
import express from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from "../controllers/project.controller.js";

// Import your existing middleware
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// GET all projects - Accessible to all authenticated users
router.get("/", getProjects);

// GET single project - Accessible to all authenticated users
router.get("/:id", getProjectById);

// CREATE new project - Only ADMIN and HR
router.post("/", authorize(['ADMIN', 'HR']), createProject);

// UPDATE project - Only ADMIN and HR
router.put("/:id", authorize(['ADMIN', 'HR']), updateProject);

// DELETE project - Only ADMIN
router.delete("/:id", authorize(['ADMIN']), deleteProject);

export default router;