import ClassModel from "../models/ClassSchema.js";
import StudentModel from "../models/StudentSchema.js";
import AttendenceModel from "../models/AttendenceSchema.js";

// Get teacher's assigned classes
export const getMyClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find({
      classTeacher: req.user._id,
    }).populate("students");

    res.status(200).json({
      message: "Classes fetched successfully",
      count: classes.length,
      classes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get students of a specific class (only if teacher is assigned to that class)
export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await ClassModel.findOne({
      _id: classId,
      classTeacher: req.user._id,
    }).populate("students");

    if (!classData) {
      return res.status(404).json({
        message: "Class not found or you are not assigned to this class",
      });
    }

    res.status(200).json({
      message: "Students fetched successfully",
      className: classData.className,
      count: classData.students.length,
      students: classData.students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance for a class
export const markAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { attendanceData, date } = req.body;
    // attendanceData: [{ studentId: "...", status: "Present" or "Absent" }]

    // Verify teacher is assigned to this class
    const classData = await ClassModel.findOne({
      _id: classId,
      classTeacher: req.user._id,
    });

    if (!classData) {
      return res.status(404).json({
        message: "Class not found or you are not assigned to this class",
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this date
    const existingAttendance = await AttendenceModel.findOne({
      classId,
      date: attendanceDate,
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance already marked for this date. Use update endpoint.",
      });
    }

    // Create attendance records
    const attendanceRecords = attendanceData.map((record) => ({
      studentId: record.studentId,
      classId,
      markedBy: req.user._id,
      date: attendanceDate,
      status: record.status,
    }));

    await AttendenceModel.insertMany(attendanceRecords);

    res.status(201).json({
      message: "Attendance marked successfully",
      date: attendanceDate,
      records: attendanceRecords.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update attendance for a specific student
export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    const attendance = await AttendenceModel.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Verify teacher is assigned to this class
    const classData = await ClassModel.findOne({
      _id: attendance.classId,
      classTeacher: req.user._id,
    });

    if (!classData) {
      return res.status(403).json({
        message: "You are not authorized to update this attendance",
      });
    }

    attendance.status = status;
    await attendance.save();

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance for a class on a specific date
export const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    // Verify teacher is assigned to this class
    const classData = await ClassModel.findOne({
      _id: classId,
      classTeacher: req.user._id,
    });

    if (!classData) {
      return res.status(404).json({
        message: "Class not found or you are not assigned to this class",
      });
    }

    let query = { classId };

    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(attendanceDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.date = { $gte: attendanceDate, $lt: nextDay };
    }

    const attendance = await AttendenceModel.find(query)
      .populate("studentId", "name rollNo")
      .sort({ date: -1 });

    res.status(200).json({
      message: "Attendance fetched successfully",
      className: classData.className,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
