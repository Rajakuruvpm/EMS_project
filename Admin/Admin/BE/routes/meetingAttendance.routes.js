import { Router } from "express";
import { getAllMeetingsWithDept, getMeetingAttendance } from "../controllers/meetingAttendance.controller.js";

const router = Router();

router.get("/", getAllMeetingsWithDept);              // All meetings for admin
router.get("/:meetingId", getMeetingAttendance);      // Specific meeting attendance

export default router;
