import { Router } from "express";
import {
  createMeeting,
  getAllMeetings,
  getMeetingsByDepartment,
  getMyMeetings,
  deleteMeeting
} from "../controllers/meeting.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST → Admin/HR creates meeting
router.post("/", authorize(['ADMIN', 'HR']), createMeeting);

// GET → Admin/HR sees all meetings
router.get("/", authorize(['ADMIN', 'HR']), getAllMeetings);

// GET → Employee sees only their department meetings
router.get("/my-meetings", getMyMeetings);

// GET → Get meetings by specific department
router.get("/department/:departmentId", getMeetingsByDepartment);

// DELETE → Delete meeting (Admin/HR only)
router.delete("/:id", authorize(['ADMIN', 'HR']), deleteMeeting);

export default router;