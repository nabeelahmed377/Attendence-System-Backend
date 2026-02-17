import jwt from "jsonwebtoken";
import UserModel from "../models/UserSchema.js";

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Check if user is Admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// Check if user is Teacher
export const isTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Access denied. Teacher only." });
  }
  next();
};

// Check if user is Admin OR Teacher
export const isAdminOrTeacher = (req, res, next) => {
  if (!["admin", "teacher"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied. Admin or Teacher only." });
  }
  next();
};
