import ClassModel from "../models/ClassSchema.js";
import UserModel from "../models/UserSchema.js";
import StudentModel from "../models/StudentSchema.js";
import AttendenceModel from "../models/AttendenceSchema.js";

// Create a new class
export const createClass = async (req, res) => {
  try {
    const { className, classTeacherId } = req.body;

    // Check if class name already exists
    const existingClass = await ClassModel.findOne({ className });
    if (existingClass) {
      return res.status(400).json({ message: "Class name already exists" });
    }

    // Verify teacher exists if provided
    if (classTeacherId) {
      const teacher = await UserModel.findOne({
        _id: classTeacherId,
        role: "teacher",
      });
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
    }

    const newClass = new ClassModel({
      className,
      classTeacher: classTeacherId || null,
    });

    await newClass.save();

    // Update teacher's assigned classes
    if (classTeacherId) {
      await UserModel.findByIdAndUpdate(classTeacherId, {
        $push: { assignedClasses: newClass._id },
      });
    }

    res.status(201).json({
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find()
      .populate("classTeacher", "name email")
      .populate("students", "name rollNo");

    res.status(200).json({
      message: "Classes fetched successfully",
      count: classes.length,
      classes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get class by ID
export const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await ClassModel.findById(classId)
      .populate("classTeacher", "name email contact")
      .populate("students", "name rollNo fatherName contact gender age");

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update class
export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { className } = req.body;

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if new class name already exists
    if (className && className !== classData.className) {
      const existingClass = await ClassModel.findOne({ className });
      if (existingClass) {
        return res.status(400).json({ message: "Class name already exists" });
      }
      classData.className = className;
    }

    await classData.save();

    res.status(200).json({
      message: "Class updated successfully",
      class: classData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete class
export const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Remove class from teacher's assigned classes
    if (classData.classTeacher) {
      await UserModel.findByIdAndUpdate(classData.classTeacher, {
        $pull: { assignedClasses: classId },
      });
    }

    // Delete all students in this class
    await StudentModel.deleteMany({ class: classId });

    // Delete all attendance records for this class
    await AttendenceModel.deleteMany({ classId });

    await ClassModel.findByIdAndDelete(classId);

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign teacher to class
export const assignTeacher = async (req, res) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    const teacher = await UserModel.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Remove class from old teacher if exists
    if (classData.classTeacher) {
      await UserModel.findByIdAndUpdate(classData.classTeacher, {
        $pull: { assignedClasses: classId },
      });
    }

    // Update class with new teacher
    classData.classTeacher = teacherId;
    await classData.save();

    // Add class to new teacher
    await UserModel.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedClasses: classId },
    });

    res.status(200).json({
      message: "Teacher assigned successfully",
      class: classData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove teacher from class
export const removeTeacher = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (!classData.classTeacher) {
      return res.status(400).json({ message: "No teacher assigned to this class" });
    }

    // Remove class from teacher
    await UserModel.findByIdAndUpdate(classData.classTeacher, {
      $pull: { assignedClasses: classId },
    });

    classData.classTeacher = null;
    await classData.save();

    res.status(200).json({
      message: "Teacher removed successfully",
      class: classData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add student to class
export const addStudentToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student already in this class
    if (classData.students.includes(studentId)) {
      return res.status(400).json({ message: "Student already in this class" });
    }

    // Remove from old class if exists
    if (student.class) {
      await ClassModel.findByIdAndUpdate(student.class, {
        $pull: { students: studentId },
      });
    }

    // Add to new class
    classData.students.push(studentId);
    await classData.save();

    // Update student's class
    student.class = classId;
    await student.save();

    res.status(200).json({
      message: "Student added to class successfully",
      class: classData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove student from class
export const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove student from class
    await ClassModel.findByIdAndUpdate(classId, {
      $pull: { students: studentId },
    });

    // Clear student's class reference
    student.class = null;
    await student.save();

    res.status(200).json({
      message: "Student removed from class successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get class students
export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await ClassModel.findById(classId).populate(
      "students",
      "name rollNo fatherName contact gender age"
    );

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
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

// Get class statistics
export const getClassStats = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await ClassModel.findById(classId)
      .populate("classTeacher", "name")
      .populate("students");

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Get attendance stats
    const attendanceRecords = await AttendenceModel.find({ classId });
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === "Present").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "Absent").length;

    // Gender distribution
    const maleCount = classData.students.filter((s) => s.gender === "male").length;
    const femaleCount = classData.students.filter((s) => s.gender === "female").length;

    res.status(200).json({
      message: "Class statistics fetched",
      class: {
        _id: classData._id,
        className: classData.className,
        teacher: classData.classTeacher?.name || "Not Assigned",
      },
      studentStats: {
        total: classData.students.length,
        male: maleCount,
        female: femaleCount,
      },
      attendanceStats: {
        totalRecords: totalAttendance,
        presentCount,
        absentCount,
        attendanceRate:
          totalAttendance > 0
            ? `${((presentCount / totalAttendance) * 100).toFixed(2)}%`
            : "N/A",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
