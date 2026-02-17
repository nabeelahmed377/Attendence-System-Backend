import express from "express";
import {
  markAttendance,
  markSingleAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByClassAndDate,
  getClassAttendanceSummary,
  getTodayAttendance,
  getOverallReport,
} from "../controllers/AttendenceController.js";
import {
  verifyToken,
  isAdmin,
  isAdminOrTeacher,
} from "../authMiddleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Mark attendance (Admin or Teacher)
router.post("/mark", isAdminOrTeacher, markAttendance);
router.post("/mark-single", isAdminOrTeacher, markSingleAttendance);

// Update attendance (Admin or Teacher)
router.patch("/:attendanceId", isAdminOrTeacher, updateAttendance);

// Delete attendance (Admin only)
router.delete("/:attendanceId", isAdmin, deleteAttendance);

// Get attendance by class
router.get("/class/:classId", isAdminOrTeacher, getAttendanceByClassAndDate);
router.get("/class/:classId/summary", isAdminOrTeacher, getClassAttendanceSummary);
router.get("/class/:classId/today", isAdminOrTeacher, getTodayAttendance);

// Overall report (Admin only)
router.get("/report", isAdmin, getOverallReport);

export default router;
