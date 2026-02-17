import express from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByRollNo,
  updateStudent,
  deleteStudent,
  getStudentAttendance,
} from "../controllers/StudentController.js";
import { verifyToken, isAdmin } from "../authMiddleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Admin only routes
router.post("/", isAdmin, createStudent);
router.patch("/:studentId", isAdmin, updateStudent);
router.delete("/:studentId", isAdmin, deleteStudent);

// Admin and Teacher can access
router.get("/", getAllStudents);
router.get("/:studentId", getStudentById);
router.get("/rollno/:rollNo", getStudentByRollNo);
router.get("/:studentId/attendance", getStudentAttendance);

export default router;
