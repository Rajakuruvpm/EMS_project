import { Router } from "express";
import { getInternalRequests, updateRequestStatus } from "../controllers/internalRequests.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// All routes require authentication and Admin/HR role
router.use(authenticate);
router.use(authorize(['ADMIN', 'HR']));

router.get("/", getInternalRequests);
router.put("/:id/status", updateRequestStatus);

export default router;