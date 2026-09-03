// routes/payroll.routes.js
import { Router } from "express";
import { 
  getPayrolls, 
  getPayroll, 
  createPayroll, 
  updatePayrollStatus, 
  deletePayroll,
  calculateSalary,
  getEmployeesForPayroll
} from "../controllers/payroll.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// All routes require authentication and Admin/HR role
router.use(authenticate);
router.use(authorize(['ADMIN', 'HR']));

// Define routes
router.get("/", getPayrolls);
router.get("/employees", getEmployeesForPayroll);
router.get("/:id", getPayroll);
router.post("/calculate", calculateSalary);
router.post("/", createPayroll);
router.put("/:id/status", updatePayrollStatus);
router.delete("/:id", deletePayroll);

export default router;