import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  assignTeacher,
  removeTeacher,
  addStudentToClass,
  removeStudentFromClass,
  getClassStudents,
  getClassStats,
} from "../controllers/ClassController.js";
import { verifyToken, isAdmin } from "../authMiddleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Admin only routes
router.post("/", isAdmin, createClass);
router.patch("/:classId", isAdmin, updateClass);
router.delete("/:classId", isAdmin, deleteClass);
router.patch("/:classId/assign-teacher", isAdmin, assignTeacher);
router.patch("/:classId/remove-teacher", isAdmin, removeTeacher);
router.post("/:classId/add-student", isAdmin, addStudentToClass);
router.delete("/:classId/student/:studentId", isAdmin, removeStudentFromClass);

// Admin and Teacher can access
router.get("/", getAllClasses);
router.get("/:classId", getClassById);
router.get("/:classId/students", getClassStudents);
router.get("/:classId/stats", getClassStats);

export default router;
