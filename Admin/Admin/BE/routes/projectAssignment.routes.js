// routes/projectAssignment.routes.js
import express from "express";
import {
  getProjectAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByProject,
  getAssignmentsByEmployee,
  assignDepartmentToProject,
  getDepartmentAssignments,
  removeDepartmentFromProject,
  getEmployeesByDepartment,
  assignMultipleEmployees
} from "../controllers/projectAssignment.controller.js";

import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// GET all assignments - Accessible to ADMIN and HR
router.get("/", authorize(['ADMIN', 'HR']), getProjectAssignments);

// GET assignment by ID - Accessible to ADMIN, HR, and assigned employee
router.get("/:id", getAssignmentById);

// GET assignments by project ID - Accessible to ADMIN, HR, and project members
router.get("/project/:projectId", getAssignmentsByProject);

// GET assignments by employee ID - Accessible to ADMIN, HR, and the employee themselves
router.get("/employee/:empId", getAssignmentsByEmployee);

// CREATE new assignment - Only ADMIN and HR
router.post("/", authorize(['ADMIN', 'HR']), createAssignment);

// UPDATE assignment - Only ADMIN and HR
router.put("/:id", authorize(['ADMIN', 'HR']), updateAssignment);

// DELETE assignment - Only ADMIN and HR
router.delete("/:id", authorize(['ADMIN', 'HR']), deleteAssignment);

// ✅ DEPARTMENT ASSIGNMENT ROUTES
router.post("/department", authorize(['ADMIN', 'HR']), assignDepartmentToProject);
router.get("/project/:projectId/departments", getDepartmentAssignments);
router.delete("/project/:projectId/department/:departmentId", authorize(['ADMIN', 'HR']), removeDepartmentFromProject);

// ✅ EMPLOYEE MANAGEMENT ROUTES
router.get("/department/:departmentId/employees", getEmployeesByDepartment);
router.post("/assign-multiple", authorize(['ADMIN', 'HR']), assignMultipleEmployees);

export default router;