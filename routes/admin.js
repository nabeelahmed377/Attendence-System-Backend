import express from "express";
import {
  createClass,
  getAllClasses,
  assignTeacherToClass,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  getAttendanceSummary,
} from "../controllers/AdminController.js";
import { verifyToken, isAdmin } from "../authMiddleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(verifyToken, isAdmin);

// Class routes
router.post("/class", createClass);
router.get("/classes", getAllClasses);
router.patch("/class/:classId/assign-teacher", assignTeacherToClass);

// Student routes
router.post("/student", createStudent);
router.get("/students", getAllStudents);
router.get("/student/:studentId", getStudentById);
router.patch("/student/:studentId", updateStudent);
router.delete("/student/:studentId", deleteStudent);

// Teacher routes
router.get("/teachers", getAllTeachers);
router.patch("/teacher/:teacherId", updateTeacher);
router.delete("/teacher/:teacherId", deleteTeacher);

// Attendance reports
router.get("/attendance/summary", getAttendanceSummary);

export default router;
