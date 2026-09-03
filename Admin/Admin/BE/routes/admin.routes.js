// routes/admin.routes.js
import { Router } from "express";
import { 
  getEmployees, 
  getEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee
} from "../controllers/admin.controller.js";
import { getDepartments } from "../controllers/department.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// All routes require authentication and Admin role
router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get("/employees", getEmployees);
router.get("/employees/:id", getEmployee);
router.post("/employees", createEmployee);
router.put("/employees/:id", updateEmployee);
router.delete("/employees/:id", deleteEmployee);
router.get("/departments", getDepartments);

export default router;