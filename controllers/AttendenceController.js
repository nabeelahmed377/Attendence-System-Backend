import AttendenceModel from "../models/AttendenceSchema.js";
import ClassModel from "../models/ClassSchema.js";
import StudentModel from "../models/StudentSchema.js";

// Mark attendance for a class
export const markAttendance = async (req, res) => {
  try {
    const { classId, attendanceData, date } = req.body;
    // attendanceData: [{ studentId: "...", status: "Present" or "Absent" }]

    // Check if class exists
    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // For teachers, verify they are assigned to this class
    if (req.user.role === "teacher") {
      if (classData.classTeacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You are not assigned to this class",
        });
      }
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
        message: "Attendance already marked for this date",
        existingDate: attendanceDate,
      });
    }

    // Validate all students belong to this class
    const classStudentIds = classData.students.map((s) => s.toString());
    for (const record of attendanceData) {
      if (!classStudentIds.includes(record.studentId)) {
        return res.status(400).json({
          message: `Student ${record.studentId} does not belong to this class`,
        });
      }
    }

    // Create attendance records
    const attendanceRecords = attendanceData.map((record) => ({
      studentId: record.studentId,
      classId,
      markedBy: req.user._id,
      date: attendanceDate,
      status: record.status,
    }));

    const savedRecords = await AttendenceModel.insertMany(attendanceRecords);

    res.status(201).json({
      message: "Attendance marked successfully",
      date: attendanceDate,
      recordsCount: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance for single student
export const markSingleAttendance = async (req, res) => {
  try {
    const { studentId, classId, status, date } = req.body;

    // Verify student exists
    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify class exists
    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // For teachers, verify assignment
    if (req.user.role === "teacher") {
      if (classData.classTeacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You are not assigned to this class",
        });
      }
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if already marked
    const existing = await AttendenceModel.findOne({
      studentId,
      classId,
      date: attendanceDate,
    });

    if (existing) {
      return res.status(400).json({
        message: "Attendance already marked for this student on this date",
      });
    }

    const attendance = new AttendenceModel({
      studentId,
      classId,
      markedBy: req.user._id,
      date: attendanceDate,
      status,
    });

    await attendance.save();

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update attendance record
export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    if (!["Present", "Absent"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const attendance = await AttendenceModel.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // For teachers, verify assignment
    if (req.user.role === "teacher") {
      const classData = await ClassModel.findById(attendance.classId);
      if (classData.classTeacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You are not authorized to update this attendance",
        });
      }
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

// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await AttendenceModel.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await AttendenceModel.findByIdAndDelete(attendanceId);

    res.status(200).json({ message: "Attendance deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance by class and date
export const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // For teachers, verify assignment
    if (req.user.role === "teacher") {
      if (classData.classTeacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You are not assigned to this class",
        });
      }
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
      .populate("markedBy", "name")
      .sort({ date: -1 });

    // Group by date
    const groupedByDate = attendance.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
    }, {});

    res.status(200).json({
      message: "Attendance fetched successfully",
      className: classData.className,
      totalRecords: attendance.length,
      attendance: groupedByDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance summary for a class
export const getClassAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const classData = await ClassModel.findById(classId).populate("students", "name rollNo");
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    let dateFilter = { classId };
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendanceRecords = await AttendenceModel.find(dateFilter);

    // Calculate summary for each student
    const studentSummary = classData.students.map((student) => {
      const studentAttendance = attendanceRecords.filter(
        (a) => a.studentId.toString() === student._id.toString()
      );
      const totalDays = studentAttendance.length;
      const presentDays = studentAttendance.filter((a) => a.status === "Present").length;
      const absentDays = studentAttendance.filter((a) => a.status === "Absent").length;
      const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      return {
        student: {
          _id: student._id,
          name: student.name,
          rollNo: student.rollNo,
        },
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage: `${percentage}%`,
      };
    });

    res.status(200).json({
      message: "Attendance summary fetched",
      className: classData.className,
      summary: studentSummary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get today's attendance status for a class
export const getTodayAttendance = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await ClassModel.findById(classId).populate("students", "name rollNo");
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await AttendenceModel.find({
      classId,
      date: { $gte: today, $lt: tomorrow },
    });

    const markedStudentIds = todayAttendance.map((a) => a.studentId.toString());

    const attendanceStatus = classData.students.map((student) => {
      const record = todayAttendance.find(
        (a) => a.studentId.toString() === student._id.toString()
      );
      return {
        student: {
          _id: student._id,
          name: student.name,
          rollNo: student.rollNo,
        },
        isMarked: markedStudentIds.includes(student._id.toString()),
        status: record ? record.status : null,
        attendanceId: record ? record._id : null,
      };
    });

    const allMarked = attendanceStatus.every((s) => s.isMarked);

    res.status(200).json({
      message: "Today's attendance status",
      date: today,
      className: classData.className,
      allMarked,
      markedCount: markedStudentIds.length,
      totalStudents: classData.students.length,
      students: attendanceStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get overall attendance report (Admin only)
export const getOverallReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const classes = await ClassModel.find().populate("classTeacher", "name");

    const report = await Promise.all(
      classes.map(async (classData) => {
        const attendance = await AttendenceModel.find({
          classId: classData._id,
          ...dateFilter,
        });

        const totalRecords = attendance.length;
        const presentCount = attendance.filter((a) => a.status === "Present").length;
        const absentCount = attendance.filter((a) => a.status === "Absent").length;

        return {
          class: {
            _id: classData._id,
            className: classData.className,
            teacher: classData.classTeacher?.name || "Not Assigned",
          },
          studentCount: classData.students.length,
          totalRecords,
          presentCount,
          absentCount,
          attendanceRate:
            totalRecords > 0 ? `${((presentCount / totalRecords) * 100).toFixed(2)}%` : "N/A",
        };
      })
    );

    res.status(200).json({
      message: "Overall attendance report",
      report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
