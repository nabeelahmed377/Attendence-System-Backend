import express from "express";
import { register, login, getProfile } from "../controllers/AuthController.js";
import { verifyToken } from "../authMiddleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile);

export default router;
