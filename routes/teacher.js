import express from "express";
import {
  getMyClasses,
  getClassStudents,
  markAttendance,
  updateAttendance,
  getClassAttendance,
} from "../controllers/TeacherController.js";
import {
  verifyToken,
  isTeacher,
} from "../authMiddleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and teacher role
router.use(verifyToken, isTeacher);

// Get teacher's assigned classes
router.get("/my-classes", getMyClasses);

// Get students of a specific class
router.get("/class/:classId/students", getClassStudents);

// Get attendance for a class (with optional date query)
router.get("/class/:classId/attendance", getClassAttendance);

// Mark attendance for a class
router.post("/class/:classId/attendance", markAttendance);

// Update a specific attendance record
router.patch("/attendance/:attendanceId", updateAttendance);

export default router;
