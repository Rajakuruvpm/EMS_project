// routes/department.routes.js
import { Router } from "express";
import { 
  getDepartments, 
  getDepartment, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
} from "../controllers/department.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// All routes require authentication and Admin/HR role
router.use(authenticate);
router.use(authorize(['ADMIN', 'HR']));

router.get("/", getDepartments);
router.get("/:id", getDepartment);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;