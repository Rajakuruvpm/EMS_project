import { Router } from "express";
import {  getAttendance } from "../controllers/attendance.controller.js";

const router = Router();

router.post("/", getAttendance);

export default router;