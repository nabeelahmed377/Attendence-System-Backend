import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoute from "./routes/auth.js";
import teacherRoute from "./routes/teacher.js";
import adminRoute from "./routes/admin.js";
import studentRoute from "./routes/student.js";
import attendanceRoute from "./routes/attendance.js";
import classRoute from "./routes/class.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);
app.use(express.json());
app.use(cookieParser());

mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("Database Connection Error:", error.message);
    process.exit(1);
  }
};

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/teacher", teacherRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/students", studentRoute);
app.use("/api/v1/attendance", attendanceRoute);
app.use("/api/v1/classes", classRoute);

// Connect to DB
connectDB();

// Start server
app.listen(port, () => {
  console.log("Server is running on port", port);
});

export default app;
