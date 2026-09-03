// routes/leave.routes.js
import { Router } from "express";
import { 
  getLeaves, 
  getLeave, 
  createLeave, 
  updateLeaveStatus, 
  deleteLeave,
  getEmployeesForLeave,
  getMyLeaves
} from "../controllers/leave.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Public routes (for employees to view their leaves)
router.get("/my-leaves", authenticate, getMyLeaves);
router.post("/", authenticate, createLeave);

// Admin/HR routes
router.use(authenticate);
router.use(authorize(['ADMIN', 'HR']));

router.get("/", getLeaves);
router.get("/employees", getEmployeesForLeave);
router.get("/:id", getLeave);
router.put("/:id/status", updateLeaveStatus);
router.delete("/:id", deleteLeave);

export default router;